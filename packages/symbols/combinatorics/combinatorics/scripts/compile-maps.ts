// Compile every map's Epsil definition (its body, and its guard where it has one) to JavaScript
// ahead of time, with compute-engine's own compiler, into src/compiled-maps.generated.js. Each
// entry carries the hash of the definition it came from: at run time an entry is used only while
// its hash matches, so an edited map is compiled on first use (or interpreted) until this is
// rerun. Maps the compiler can't take yet are left out; a map whose compiled code answers
// differently from the interpreter on small elements of its source carrier is listed as
// `interpreted`, so it isn't compiled on first use either.
//
// A map with a `flat` body (over its carriers' flat readings, `Carrier.flat`) has that compiled first, held
// to the interpreter's answers on the nested definition: the entry then carries the flat hash and the carriers
// it is encoded from and decoded to (`flatIn`, `flatOut`). A flat body that disagrees falls back to the nested body.
//
// A composition (`composedOf`) has no body of its own: when every map it applies has compiled code,
// it gets an entry that runs those entries in turn, checked against the interpreter applying the
// same maps' definitions. A composition with a step that has none is left interpreted.
//
//   vp node packages/symbols/combinatorics/combinatorics/scripts/compile-maps.ts

import { fileURLToPath } from "node:url";
import type { Engine } from "@enumeratio/engine";
import { bareEngine } from "@enumeratio/engine/testing";
import { compileTyped, fromJs, runtimeHelpers, toJs } from "@enumeratio/engine/compiled";
import type { FlatCodec } from "@enumeratio/structures";
import { CARRIERS } from "../src/carriers.ts";
import { bodyHash, compositionHash, compositionSteps, flatHash, mapKey } from "../src/compiled.ts";
import { FLAT } from "../src/flat.ts";
import { evaluateDefinition, MAPS } from "../src/maps.ts";
import { noVerdicts, type Verdicts } from "../src/statistics/generate-compiled.ts";
import { smallElements } from "./samples.ts";
import { sharded } from "./shards.ts";
import { checkers } from "./verdicts.ts";
import { writeGenerated } from "./write-generated.ts";

export interface Entry {
  readonly key: string;
  readonly hash: string;
  readonly body?: string;
  readonly guard?: string;
  /** The carriers (type ids) whose flat readings the body takes its argument in and answers in: it was compiled
   *  from the map's `flat` body, and `hash` is the flat hash. */
  readonly flatIn?: string;
  readonly flatOut?: string;
  /** A composition: the keys of the entries it runs in turn. */
  readonly steps?: readonly string[];
  /** A composition with no entry, and why. */
  readonly skipped?: string;
}

type MapDef = (typeof MAPS)[number];
type Run = (vars: Record<string, unknown>) => unknown;

/** Whether the compiled body (and guard) give the interpreter's answer on every subject the
 *  compiled code answers at all: the same image, or a decline where the guard declines. A flat body is
 *  fed the subject encoded and its image decoded, as at run time (`codecs`). */
function agrees(
  ce: Engine,
  map: MapDef,
  body: Run,
  guard: Run | undefined,
  subjects: readonly unknown[],
  codecs: { encode?: FlatCodec; decode?: FlatCodec } = {},
): boolean {
  for (const subject of subjects) {
    const nested = toJs(subject);
    const raw = nested === undefined || codecs.encode === undefined ? nested : codecs.encode.encode(nested);
    if (raw === undefined) continue;
    let answer;
    try {
      const made = body({ _raw: raw });
      const image = codecs.decode === undefined || made === undefined ? made : codecs.decode.decode(made);
      answer = fromJs(image);
      if (answer !== undefined && guard !== undefined && guard({ _raw: raw, _image: image }) !== true) answer = null;
    } catch {
      continue;
    }
    if (answer === undefined) continue;
    const expected = evaluateDefinition(ce, map, subject) ?? null;
    if (JSON.stringify(answer) !== JSON.stringify(expected)) return false;
  }
  return true;
}

/** What the interpreter gives for `subject` through `steps` in turn: their definitions, no compiled code. */
function interpretSteps(ce: Engine, steps: readonly MapDef[], subject: unknown): unknown {
  let value = subject;
  for (const step of steps) {
    value = evaluateDefinition(ce, step, value);
    if (value === undefined) return undefined;
  }
  return value;
}

/** Whether a composition's chain gives what the interpreter gives through the same steps, on every
 *  subject the chain answers at all (it declines where a step's guard does). */
function agreesComposed(ce: Engine, steps: readonly MapDef[], chain: Run, subjects: readonly unknown[]): boolean {
  for (const subject of subjects) {
    const raw = toJs(subject);
    if (raw === undefined) continue;
    let answer;
    try {
      answer = fromJs(chain({ _raw: raw }));
    } catch {
      continue;
    }
    if (answer === undefined) continue;
    if (JSON.stringify(answer) !== JSON.stringify(interpretSteps(ce, steps, subject) ?? null)) return false;
  }
  return true;
}

/** Each compilable map's key (`Name@from`), hash and generated code; no code for a map whose
 *  compiled code disagreed with the interpreter. Only the keys `mine` takes are looked at (a
 *  shard's share). A composition needs its steps' entries, which another shard may own: they are
 *  made here too, and left out of this shard's share. */
export function compiledMaps(verdicts: Verdicts = noVerdicts, mine: (key: string) => boolean = () => true): Entry[] {
  const ce = bareEngine();
  const carrierOf = new Map(CARRIERS.map((carrier) => [carrier.type, carrier]));
  const samples = new Map<string, unknown[]>();
  const subjectsOf = (carrier: string): unknown[] => {
    if (!samples.has(carrier)) samples.set(carrier, smallElements(ce, carrier));
    return samples.get(carrier)!;
  };

  const single = (map: MapDef): Entry | undefined => {
    const from = carrierOf.get(map.from);
    const to = carrierOf.get(map.to);
    if (from === undefined || to === undefined) return undefined;
    const subjects = subjectsOf(from.name);
    const key = mapKey(map);
    // The flat body first, where the map has one; the nested body after it.
    let wrong = false;
    if (map.flat !== undefined) {
      if (map.guard !== undefined) throw new Error(`${key} has a flat body and a guard`);
      const codecs = { encode: from.flat, decode: to.flat };
      const flat = compileTyped(ce, map.flat, { _raw: (from.flat ?? from).shape });
      if (flat !== undefined) {
        const shapes = [from.flat?.shape, to.flat?.shape];
        const parts = { body: map.body, flat: map.flat, code: flat.code, shapes, subjects };
        if (verdicts.remember(parts, () => agrees(ce, map, flat.run, undefined, subjects, codecs), key))
          return {
            key,
            hash: flatHash(map),
            body: flat.code,
            ...(from.flat === undefined ? {} : { flatIn: from.type }),
            ...(to.flat === undefined ? {} : { flatOut: to.type }),
          };
        wrong = true;
      }
    }
    const body = compileTyped(ce, map.body, { _raw: from.shape });
    if (body === undefined) return wrong ? { key, hash: bodyHash(map) } : undefined;
    const guard =
      map.guard === undefined ? undefined : compileTyped(ce, map.guard, { _raw: from.shape, _image: to.shape });
    if (map.guard !== undefined && guard === undefined) return undefined;
    const hash = bodyHash(map);
    const parts = { body: map.body, guard: map.guard, code: body.code, guardCode: guard?.code, subjects };
    if (!verdicts.remember(parts, () => agrees(ce, map, body.run, guard?.run, subjects), key)) return { key, hash };
    return { key, hash, body: body.code, ...(guard === undefined ? {} : { guard: guard.code }) };
  };

  const composed = (map: MapDef): Entry => {
    const key = mapKey(map);
    const skip = (why: string): Entry => ({ key, hash: "", skipped: why });
    const from = carrierOf.get(map.from);
    const steps = compositionSteps(MAPS, map);
    if (from === undefined) return skip(`no carrier ${map.from}`);
    if (steps === undefined) return skip("a step has no definition on the carrier before it");
    const entries = steps.map(entryOf);
    const missing = steps.filter((_, i) => entries[i]?.body === undefined).map(mapKey);
    if (missing.length > 0) return skip(`no compiled code: ${missing.join(", ")}`);
    const chain: Entry = { key, hash: compositionHash(steps), steps: steps.map(mapKey) };
    // The chain is run as it is written to the generated file.
    const used = new Map([...(entries as Entry[]), chain].map((e) => [e.key, e]));
    const generated = evaluateTable([...used.values()]);
    const sys = runtimeHelpers(ce);
    const run: Run = (vars) => generated[key]!.run(sys, vars);
    const subjects = subjectsOf(from.name);
    // What the answer depends on, besides the subjects: the steps' definitions and their compiled code.
    const parts = {
      steps: steps.map((step, i) => ({
        key: mapKey(step),
        body: step.body,
        guard: step.guard,
        flat: step.flat,
        code: entries[i]!.body,
        guardCode: entries[i]!.guard,
        flatIn: entries[i]!.flatIn,
        flatOut: entries[i]!.flatOut,
      })),
      subjects,
    };
    return verdicts.remember(parts, () => agreesComposed(ce, steps, run, subjects), key)
      ? chain
      : { key, hash: chain.hash };
  };

  const made = new Map<string, Entry | undefined>();
  const entryOf = (map: MapDef): Entry | undefined => {
    const key = mapKey(map);
    if (!made.has(key)) made.set(key, map.composedOf === undefined ? single(map) : composed(map));
    return made.get(key);
  };

  const out: Entry[] = [];
  for (const map of MAPS) {
    if ((map.body === undefined && map.composedOf === undefined) || !mine(mapKey(map))) continue;
    const entry = entryOf(map);
    if (entry !== undefined) out.push(entry);
  }
  return out.toSorted(byKey);
}

const byKey = (a: Entry, b: Entry): number => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0);

/** The generated entries as a JavaScript object literal. */
function table(entries: readonly Entry[]): string {
  const body = entries
    .filter((e) => e.skipped === undefined)
    .map((e) =>
      [
        `  ${JSON.stringify(e.key)}: {`,
        `    hash: ${JSON.stringify(e.hash)},`,
        e.steps !== undefined
          ? `    run: composed(${JSON.stringify(e.steps)}),`
          : e.body === undefined
            ? "    interpreted: true,"
            : `    run: (_SYS, _) => ${e.body},`,
        ...(e.guard === undefined ? [] : [`    guard: (_SYS, _) => ${e.guard},`]),
        ...(e.flatIn === undefined ? [] : [`    flatIn: ${JSON.stringify(e.flatIn)},`]),
        ...(e.flatOut === undefined ? [] : [`    flatOut: ${JSON.stringify(e.flatOut)},`]),
        "  },",
      ].join("\n"),
    )
    .join("\n");
  return `{\n${body}\n}`;
}

/** What a composition's entry runs: its steps' entries in turn. The chain declines (the interpreter
 *  answers) at an image `fromJs` wouldn't take, a safe integer or lists of them, and at a failed guard.
 *  A value stays in a carrier's flat reading (`form`) from one flat step to the next: it is decoded
 *  where a step wants another reading and at the chain's end, and encoded where a step wants the flat one. */
const COMPOSED = `const composed = (steps) => (_SYS, _) => {
  let raw = _._raw;
  let form;
  for (const key of steps) {
    const step = COMPILED_MAPS[key];
    if (step.flatIn !== form) {
      if (form !== undefined) raw = FLAT[form].decode(raw);
      if (raw !== undefined && step.flatIn !== undefined) raw = FLAT[step.flatIn].encode(raw);
      if (raw === undefined) return undefined;
    }
    const image = step.run(_SYS, { _raw: raw });
    if (!exact(image)) return undefined;
    if (step.guard !== undefined && step.guard(_SYS, { _raw: raw, _image: image }) !== true) return undefined;
    raw = image;
    form = step.flatOut;
  }
  return form === undefined ? raw : FLAT[form].decode(raw);
};
const exact = (value) =>
  typeof value === "number" ? Number.isSafeInteger(value) : Array.isArray(value) && value.every(exact);`;

export type Generated = Record<string, { run: (sys: unknown, vars: Record<string, unknown>) => unknown }>;

/** The generated entries, executable. */
export function evaluateTable(entries: readonly Entry[]): Generated {
  // oxlint-disable-next-line no-implied-eval -- the code is compute-engine's compiled output
  return new Function("FLAT", `${COMPOSED}\nconst COMPILED_MAPS = ${table(entries)};\nreturn COMPILED_MAPS;`)(
    FLAT,
  ) as Generated;
}

function render(entries: readonly Entry[]): string {
  return `// GENERATED by scripts/compile-maps.ts from the maps' Epsil definitions, by compute-engine's
// JavaScript compiler. Do not edit: rerun the script. Each entry is used only while \`hash\`
// matches its definition; see src/compiled.ts.
// A definition that ignores its argument compiles to code that never reads it.
/* eslint-disable no-unused-vars, unicorn/no-useless-spread */
import { FLAT } from "./flat.ts";

${COMPOSED}

export const COMPILED_MAPS = ${table(entries)};
`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const defined = MAPS.filter((m) => m.body !== undefined || m.composedOf !== undefined);
  const run = await sharded(import.meta.url, "compile-maps", checkers.maps, defined.map(mapKey), compiledMaps);
  if (run === undefined) process.exit(0);
  const entries = run.results.flat().toSorted(byKey);
  const target = fileURLToPath(new URL("../src/compiled-maps.generated.js", import.meta.url));
  writeGenerated(target, render(entries));
  run.verdicts.save();
  const chains = entries.filter((e) => e.steps !== undefined);
  console.log(
    `${entries.filter((e) => e.body !== undefined).length} of ${MAPS.filter((m) => m.body !== undefined).length} map definitions compiled, ` +
      `${chains.length} of ${MAPS.filter((m) => m.composedOf !== undefined).length} compositions`,
  );
  for (const e of entries) {
    if (e.skipped !== undefined) console.log(`${e.key}: composition left interpreted (${e.skipped})`);
    else if (e.body === undefined && e.steps === undefined)
      console.log(`${e.key}: compiled code disagreed with the interpreter; left interpreted`);
  }
}
