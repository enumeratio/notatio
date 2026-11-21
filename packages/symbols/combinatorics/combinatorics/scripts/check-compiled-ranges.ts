// Where a compiled statistic's integer arithmetic leaves the doubles' exact range, answer right or not.
//
// The compiled code is JavaScript doubles: an Add, Multiply, Power or Divide whose integer result passes
// 2^53 has lost digits, and an answer built on it is right only by luck (and `fromJs` accepts any safe
// integer, so a wrong one is not declined). This script rewrites each generated entry so every such result
// goes through a check (the generated JavaScript is parsed and the arithmetic wrapped: no lowering of ours
// enters the build), runs it over each statistic's subjects, and names the smallest subject where an
// intermediate leaves the safe range, with the compiled answer beside the interpreter's.
//
//   node scripts/check-compiled-ranges.ts [--head A,B] [--on Carrier,...] [--sizes 6,8,10,...]
//     [--not Carrier,...] [--skip head@Carrier,...] [--seconds 3] [--interpret-max 30] [--out file.tsv]
//
// A `quotient` row is a `/` whose result is not an integer: the float arithmetic a count must not use.
// Subjects are `smallElements` (sizes up to 5), then each size of `--sizes` from the carrier's families at
// spread ranks, kept to the definition's domain; a statistic's ladder stops after a call over `--seconds`.

import { writeFileSync } from "node:fs";
import { createContext, runInContext } from "node:vm";
import { createRequire } from "node:module";
import type { Engine } from "@notatio/engine";
import { fromJs, runtimeHelpers } from "@notatio/engine/compiled";
import { compileBigint, fromBigint, toBigint } from "@notatio/engine/compiled-bigint";
import { createEngine } from "@notatio/engine/testing";
import { declareCombinatorics } from "../src/index.ts";
import { FLAT_BY_NAME, subjectToJs } from "../src/flat.ts";
import { COMPILED } from "../src/statistics/compiled.ts";
import { ALL_STATISTICS } from "../src/statistics/all.ts";
import { bigintForm, integerOf } from "../src/statistics/generate-exact.ts";
import { inDomain, interpretDefinition } from "../src/statistics/declare.ts";
import { type Definition, definitionKey, SUBJECT, signatureOf } from "../src/statistics/types.ts";
import { definitionHash } from "@notatio/engine/compiled";
import { ladderElements, smallElements } from "./samples.ts";

interface Node {
  readonly type: string;
  readonly start: number;
  readonly end: number;
  readonly [key: string]: unknown;
}

const ARITHMETIC = new Set(["+", "-", "*", "/", "**"]);
const ASSIGNMENTS = new Set(["+=", "-=", "*=", "/=", "**="]);
const CHECKED_CALLS = new Set(["Math.pow", "_SYS.pow", "_SYS.factorial", "_SYS.binomial"]);

const isNode = (value: unknown): value is Node =>
  typeof value === "object" && value !== null && typeof (value as Node).type === "string";

const calleeName = (callee: unknown): string => {
  if (!isNode(callee) || callee.type !== "MemberExpression") return "";
  const [object, property] = [callee.object, callee.property];
  return isNode(object) && isNode(property) ? `${String(object.name)}.${String(property.name)}` : "";
};

/** `source` (an arrow function's text) with every arithmetic result wrapped as `_chk(op, result)`. */
export function instrument(source: string): string {
  const { parseAst } = createRequire(import.meta.url)("vite") as { parseAst: (code: string) => Node };
  const text = `(${source})`;
  const opens: Array<[at: number, text: string]> = [];
  const closes: number[] = [];
  const wrap = (node: Node, label: string): void => {
    opens.push([node.start, `_chk(${JSON.stringify(label)}, `]);
    closes.push(node.end);
  };
  const walk = (value: unknown): void => {
    if (Array.isArray(value)) return value.forEach(walk);
    if (!isNode(value)) return;
    if (value.type === "BinaryExpression" && ARITHMETIC.has(String(value.operator)))
      wrap(value, String(value.operator));
    else if (value.type === "AssignmentExpression" && ASSIGNMENTS.has(String(value.operator)))
      wrap(value, String(value.operator));
    else if (value.type === "CallExpression" && CHECKED_CALLS.has(calleeName(value.callee)))
      wrap(value, calleeName(value.callee));
    for (const child of Object.values(value)) walk(child);
  };
  walk(parseAst(text));
  // A close sorts before an open at the same offset, so adjacent wrappers don't nest the wrong way.
  const events = [
    ...opens.map(([at, insert]) => ({ at, order: 1, insert })),
    ...closes.map((at) => ({ at, order: 0, insert: ")" })),
  ].toSorted((a, b) => a.at - b.at || a.order - b.order);
  let out = "";
  let from = 0;
  for (const event of events) {
    out += text.slice(from, event.at) + event.insert;
    from = event.at;
  }
  return (out + text.slice(from)).slice(1, -1);
}

interface Violation {
  readonly kind: "unsafe" | "quotient";
  readonly op: string;
  readonly value: number;
}

/** The checking function and the violations it has seen. */
function checker(): { chk: (op: string, value: unknown) => unknown; seen: Violation[] } {
  const seen: Violation[] = [];
  const chk = (op: string, value: unknown): unknown => {
    if (typeof value !== "number" || !Number.isFinite(value)) return value;
    if (Number.isInteger(value)) {
      if (!Number.isSafeInteger(value) && seen.length < 4) seen.push({ kind: "unsafe", op, value });
    } else if (op === "/" && seen.length < 4) seen.push({ kind: "quotient", op, value });
    return value;
  };
  return { chk, seen };
}

type Run = (sys: never, vars: Record<string, unknown>) => unknown;
interface Compiled {
  readonly run: Run;
  readonly codec: (typeof FLAT_BY_NAME)[string] | undefined;
}

/** The entry `compiledStatistic` would use for `definition`: its run and its flat codec. */
function entryOf(definition: Definition): Compiled | undefined {
  const entry = COMPILED[signatureOf(definition)];
  if (entry === undefined) return undefined;
  const flat = definition.flat !== undefined && entry.hash === definitionKey(definition);
  if (!flat && entry.hash !== definitionHash(definition.expr)) return undefined;
  const codec = flat ? FLAT_BY_NAME[definition.on] : undefined;
  return flat && codec === undefined ? undefined : { run: entry.run as Run, codec };
}

const toDouble = (run: Run, sys: unknown, codec: Compiled["codec"], subject: unknown): unknown => {
  const nested = subjectToJs(subject);
  const value = codec === undefined || nested === undefined ? nested : codec.encode(nested);
  return value === undefined ? undefined : run(sys as never, { [SUBJECT]: value });
};

const weightOf = (subject: unknown): number =>
  typeof subject === "number"
    ? subject
    : Array.isArray(subject)
      ? subject.reduce<number>((n, e) => n + weightOf(e), 0)
      : 0;

export interface Finding {
  readonly signature: string;
  /** The first subject (smallest) with an intermediate out of range. */
  readonly subject: unknown;
  readonly size: number;
  readonly violation: Violation;
  /** Subjects over the whole ladder where an intermediate left the range, and how they came out. */
  readonly hits: { answeredRight: number; answeredWrong: number; declined: number; unchecked: number };
  /** The first wrong answer: the compiled value, the exact one, and where the exact one came from. */
  readonly wrong?: { subject: unknown; compiled: unknown; exact: unknown; by: string; violation: Violation };
  readonly timedOut?: number;
}

const flag = (name: string): string | undefined => {
  const at = process.argv.indexOf(`--${name}`);
  return at === -1 ? undefined : process.argv[at + 1];
};

const context = createContext({});
/** `call()` with a wall-clock limit: V8 stops a runaway synchronous loop (the compiled code of an exponential count). */
function within<T>(milliseconds: number, call: () => T): T {
  (context as { call?: () => T }).call = call;
  return runInContext("call()", context, { timeout: milliseconds }) as T;
}

/** The exact integer for `subject` from BigInt code when it compiles and answers, else the interpreter's when the subject is small. */
function exactAnswer(
  ce: Engine,
  definition: Definition,
  big: ((vars: Record<string, unknown>) => unknown) | undefined,
  subject: unknown,
  interpretMax: number,
  seconds: number,
): { value: unknown; by: string } | undefined {
  const nested = subjectToJs(subject);
  if (big !== undefined && nested !== undefined) {
    try {
      const value = fromBigint(big(toBigint({ [SUBJECT]: nested }) as Record<string, unknown>));
      if (typeof value === "bigint" || typeof value === "number") return { value: BigInt(value), by: "bigint" };
    } catch {
      // the BigInt code declines: the interpreter is next
    }
  }
  if (weightOf(subject) > interpretMax) return undefined;
  try {
    const json = within(seconds * 10_000, () => interpretDefinition(ce, definition, ce.box(subject as never)).json);
    const value = integerOf(json);
    return { value: value ?? json, by: "interpreter" };
  } catch {
    return undefined;
  }
}

/** `definition` over the ladder: where an intermediate first leaves the range, and whether any compiled answer there is wrong. */
function scan(
  ce: Engine,
  definition: Definition,
  compiled: Compiled,
  ladder: ReadonlyArray<readonly [number, unknown[]]>,
  shape: string | undefined,
  seconds: number,
  interpretMax: number,
): Finding | undefined {
  const { chk, seen } = checker();
  // oxlint-disable-next-line no-implied-eval -- the code is the build's own generated output, rewritten above
  const checked = new Function("_chk", `return ${instrument(compiled.run.toString())}`)(chk) as Run;
  const big =
    shape === undefined ? undefined : compileBigint(ce, bigintForm(definition.expr), { [SUBJECT]: shape })?.run;
  const sys = runtimeHelpers(ce);
  const hits = { answeredRight: 0, answeredWrong: 0, declined: 0, unchecked: 0 };
  let first: { subject: unknown; violation: Violation } | undefined;
  let wrong: Finding["wrong"];
  for (const [, subjects] of ladder) {
    for (const subject of subjects) {
      try {
        if (!inDomain(ce, definition, ce.box(subject as never))) continue;
      } catch {
        continue;
      }
      seen.length = 0;
      const started = Date.now();
      let value: unknown;
      try {
        value = within(seconds * 1000, () => toDouble(checked, sys, compiled.codec, subject));
      } catch (error) {
        if ((error as { code?: string }).code === "ERR_SCRIPT_EXECUTION_TIMEOUT")
          return first === undefined ? undefined : finding(definition, first, hits, wrong, weightOf(subject));
        continue;
      }
      if (value === undefined || seen.length === 0) {
        if (Date.now() - started > seconds * 1000) break;
        continue;
      }
      first ??= { subject, violation: seen[0]! };
      let answer: unknown;
      try {
        answer = fromJs(toDouble(compiled.run, sys, compiled.codec, subject));
      } catch {
        answer = undefined;
      }
      if (answer === undefined) {
        hits.declined++;
        continue;
      }
      const exact = exactAnswer(ce, definition, big, subject, interpretMax, seconds);
      if (exact === undefined) {
        hits.unchecked++;
        continue;
      }
      if (typeof exact.value === "bigint" && BigInt(answer as number) === exact.value) hits.answeredRight++;
      else {
        hits.answeredWrong++;
        wrong ??= { subject, compiled: answer, exact: String(exact.value), by: exact.by, violation: seen[0]! };
      }
    }
  }
  return first === undefined ? undefined : finding(definition, first, hits, wrong);
}

const finding = (
  definition: Definition,
  first: { subject: unknown; violation: Violation },
  hits: Finding["hits"],
  wrong: Finding["wrong"],
  timedOut?: number,
): Finding => ({
  signature: signatureOf(definition),
  subject: first.subject,
  size: weightOf(first.subject),
  violation: first.violation,
  hits,
  ...(wrong === undefined ? {} : { wrong }),
  ...(timedOut === undefined ? {} : { timedOut }),
});

/** The bare shape of each carrier the BigInt reference can be compiled for; the others are held to the interpreter alone. */
/** A seeded generator, so a sweep reruns on the same subjects. */
function generator(seed: number): () => number {
  let state = seed;
  return () => (state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 2 ** 32;
}

/** Subjects built directly for the carriers whose families take too long to unrank at the sizes where an intermediate overflows. */
const CUSTOM: Readonly<Record<string, (size: number) => unknown[]>> = {
  Permutation: (n) => {
    const random = generator(n);
    const identity = Array.from({ length: n }, (_, i) => i + 1);
    const shuffled = () => {
      const p = [...identity];
      for (let i = n - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [p[i], p[j]] = [p[j]!, p[i]!];
      }
      return p;
    };
    return [identity, identity.toReversed(), shuffled(), shuffled(), shuffled(), shuffled()].map((p) => ["List", ...p]);
  },
  BinaryWord: (n) => {
    const random = generator(n + 1000);
    const word = (p: number) => Array.from({ length: n }, () => (random() < p ? 1 : 0));
    return [word(0), word(1), word(0.5), word(0.5), word(0.25), word(0.75)].map((w) => ["List", ...w]);
  },
  LabeledGraph: (n) => {
    const random = generator(n + 2000);
    const pairs = Array.from({ length: n * n }, (_, k) => [Math.floor(k / n) + 1, (k % n) + 1] as const).filter(
      ([u, v]) => u < v,
    );
    const graph = (keep: (u: number, v: number) => boolean) => [
      "Tuple",
      n,
      ["List", ...pairs.filter(([u, v]) => keep(u, v)).map(([u, v]) => ["List", u, v])],
    ];
    return [
      graph(() => true),
      graph((u, v) => v === u + 1),
      graph(() => random() < 0.3),
      graph(() => random() < 0.6),
      graph(() => random() < 0.5),
    ];
  },
};

/** Seconds a carrier may take to produce the subjects of one size. */
const GENERATION = 20;

const SHAPES: Readonly<Record<string, string>> = {
  IntegerPartition: "list<integer>",
  DyckPath: "list<integer>",
  Permutation: "list<integer>",
  IntegerComposition: "list<integer>",
  BinaryWord: "list<integer>",
};

if (import.meta.main) {
  const heads = flag("head")?.split(",");
  const carriers = flag("on")?.split(",");
  const skip = new Set(flag("skip")?.split(","));
  const without = new Set(flag("not")?.split(","));
  const sizes = (flag("sizes") ?? "6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,30,32,36,40")
    .split(",")
    .map(Number);
  const seconds = Number(flag("seconds") ?? 3);
  const interpretMax = Number(flag("interpret-max") ?? 26);
  const ce = createEngine(declareCombinatorics);
  const subjectCache = new Map<string, unknown[]>();
  // Where a carrier's families take over ${GENERATION} seconds to unrank a size, that size and the larger ones are left out.
  const reach = new Map<string, number>();
  const subjectsAt = (carrier: string, size: number | "small"): unknown[] => {
    const key = `${carrier}@${size}`;
    let found = subjectCache.get(key);
    if (found !== undefined) return found;
    if (size !== "small" && size >= (reach.get(carrier) ?? Infinity)) return [];
    try {
      found = within(GENERATION * 1000, () =>
        size === "small"
          ? smallElements(ce, carrier)
          : (CUSTOM[carrier] ?? ((n) => ladderElements(ce, carrier, n)))(size),
      );
    } catch {
      reach.set(carrier, size === "small" ? 0 : size);
      console.error(`${carrier}: subjects of size ${size} take over ${GENERATION}s; the ladder stops before it`);
      found = [];
    }
    subjectCache.set(key, found);
    return found;
  };
  const rows: string[] = [
    "signature\tfirst size\tkind\top\tintermediate\tright\twrong\tdeclined\tunchecked\ttimed out at\twrong subject\tcompiled\texact\tby",
  ];
  let checked = 0;
  for (const definition of ALL_STATISTICS) {
    if (heads !== undefined && !heads.includes(definition.head)) continue;
    if (carriers !== undefined && !carriers.includes(definition.on)) continue;
    if (skip.has(signatureOf(definition)) || without.has(definition.on)) continue;
    const compiled = entryOf(definition);
    if (compiled === undefined) continue;
    checked++;
    console.error(`[${checked}] ${signatureOf(definition)}`);
    const ladder: Array<readonly [number, unknown[]]> = [
      [0, subjectsAt(definition.on, "small")],
      ...sizes.map((n) => [n, subjectsAt(definition.on, n)] as const),
    ];
    const found = scan(ce, definition, compiled, ladder, SHAPES[definition.on], seconds, interpretMax);
    if (found === undefined) continue;
    const row = [
      found.signature,
      found.size,
      found.violation.kind,
      found.violation.op,
      found.violation.value,
      found.hits.answeredRight,
      found.hits.answeredWrong,
      found.hits.declined,
      found.hits.unchecked,
      found.timedOut ?? "",
      found.wrong === undefined ? "" : JSON.stringify(found.wrong.subject),
      found.wrong === undefined ? "" : JSON.stringify(found.wrong.compiled),
      found.wrong === undefined ? "" : found.wrong.exact,
      found.wrong === undefined ? "" : found.wrong.by,
    ].join("\t");
    rows.push(row);
    console.log(row);
  }
  console.log(`${checked} compiled statistics checked, ${rows.length - 1} with an intermediate out of range`);
  const out = flag("out");
  if (out !== undefined) writeFileSync(out, `${rows.join("\n")}\n`);
}
