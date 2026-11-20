// A statistic's definition, run from the code compiled ahead of time from its Epsil. Each
// area compiles only its OWN definitions (its own `scripts/compile-definitions.ts`, into its
// own `statistics.compiled.generated.js`, one generator per area, step 6b) — this file merges
// their tables into one lookup, keyed by signature (`head@carrier`), which never collides
// across areas. An entry is used only while its hash matches the definition, and only for a
// subject and an answer that cross between MathJSON and JS exactly; everything else is
// interpreted. A definition with a `flat` alternative is compiled from it where it compiles and
// agrees (its entry carries the flat hash), and its subject is encoded to the carrier's flat reading first.

import type { Engine } from "@notatio/engine";
import { definitionHash, fromJs, type MathJSON, runtimeHelpers } from "@notatio/engine/compiled";
import { COMPILED as PERMUTATIONS_COMPILED } from "../../permutations/src/statistics.compiled.generated.js";
import { COMPILED as PARTITIONS_COMPILED } from "../../partitions/src/statistics.compiled.generated.js";
import { COMPILED as COMPOSITIONS_COMPILED } from "../../compositions/src/statistics.compiled.generated.js";
import { COMPILED as LATTICE_PATHS_COMPILED } from "../../lattice-paths/src/statistics.compiled.generated.js";
import { COMPILED as SET_PARTITIONS_COMPILED } from "../../set-partitions/src/statistics.compiled.generated.js";
import { COMPILED as TABLEAUX_COMPILED } from "../../tableaux/src/statistics.compiled.generated.js";
import { COMPILED as TREES_COMPILED } from "../../trees/src/statistics.compiled.generated.js";
import { COMPILED as GRAPHS_COMPILED } from "../../graphs/src/statistics.compiled.generated.js";
import { COMPILED as POSETS_COMPILED } from "../../posets/src/statistics.compiled.generated.js";
import { COMPILED as CARTAN_COMPILED } from "../../cartan/src/statistics.compiled.generated.js";
import { COMPILED as WORDS_COMPILED } from "../../words/src/statistics.compiled.generated.js";
import { bigintRuntime, fromBigint, toBigint } from "@notatio/engine/compiled-bigint";
import { EXACT_COMPILED } from "../statistics.exact.generated.js";
import { FLAT_BY_NAME as FLAT, subjectToJs } from "../flat.ts";
import { type Definition, definitionKey, SUBJECT, signatureOf, whereSignatureOf } from "./types.ts";

interface CompiledEntry {
  readonly hash: string;
  readonly run: (sys: never, vars: Record<string, unknown>) => unknown;
}

/** Every area's compiled table, merged. Add a spread here when an area's kernel moves in;
 *  nothing else in this file changes. */
export const COMPILED: Record<string, CompiledEntry> = {
  ...PERMUTATIONS_COMPILED,
  ...PARTITIONS_COMPILED,
  ...COMPOSITIONS_COMPILED,
  ...LATTICE_PATHS_COMPILED,
  ...SET_PARTITIONS_COMPILED,
  ...TABLEAUX_COMPILED,
  ...TREES_COMPILED,
  ...WORDS_COMPILED,
  ...GRAPHS_COMPILED,
  ...POSETS_COMPILED,
  ...CARTAN_COMPILED,
};

/** The compiled form of `definition` (or of its `where`), as a function of its subject's MathJSON, or
 *  undefined when there is none current. The function answers undefined where it can't answer exactly. */
export function compiledStatistic(
  ce: Engine,
  definition: Definition,
  part: "expr" | "where" = "expr",
): ((subject: unknown) => MathJSON | undefined) | undefined {
  if (part === "where") {
    const held = COMPILED[whereSignatureOf(definition)];
    if (held === undefined || definition.where === undefined || held.hash !== definitionHash(definition.where))
      return undefined;
    return compiledRun(ce, held.run, undefined);
  }
  // An exact count has BigInt code or none: its doubles' code (a stale build's) is never used.
  if (definition.exact === true) {
    const held: CompiledEntry | undefined = EXACT_COMPILED[signatureOf(definition)];
    if (held === undefined || held.hash !== definitionHash(definition.expr)) return undefined;
    return exactRun(ce, held.run);
  }
  const entry = COMPILED[signatureOf(definition)];
  if (entry === undefined) return undefined;
  // An entry stamped with the flat alternative's hash was compiled from it, and takes the flat reading.
  const flat = definition.flat !== undefined && entry.hash === definitionKey(definition);
  if (!flat && entry.hash !== definitionHash(definition.expr)) return undefined;
  const codec = flat ? FLAT[definition.on] : undefined;
  if (flat && codec === undefined) return undefined;
  return compiledRun(ce, entry.run, codec);
}

/** BigInt code run over the subject as bigints: an answer past the safe range, or a division that leaves a remainder,
 *  is undefined (the interpreter gives the exact integer). */
function exactRun(ce: Engine, run: CompiledEntry["run"]): (subject: unknown) => MathJSON | undefined {
  const sys = bigintRuntime(ce);
  return (subject) => {
    const value = subjectToJs(subject);
    if (value === undefined) return undefined;
    try {
      return fromJs(fromBigint(run(sys as never, toBigint({ [SUBJECT]: value }) as Record<string, unknown>)));
    } catch {
      return undefined;
    }
  };
}

function compiledRun(
  ce: Engine,
  run: CompiledEntry["run"],
  codec: (typeof FLAT)[string] | undefined,
): (subject: unknown) => MathJSON | undefined {
  const sys = runtimeHelpers(ce);
  return (subject) => {
    const nested = subjectToJs(subject);
    const value = codec === undefined || nested === undefined ? nested : codec.encode(nested);
    if (value === undefined) return undefined;
    try {
      return fromJs(run(sys as never, { [SUBJECT]: value }));
    } catch {
      return undefined;
    }
  };
}
