// Which statistics may answer an infinity from their compiled code, decided from the definition at build
// time (BL-510). `fromJs` has no MathJSON for a JS `Infinity`, so a compiled answer of one is dropped and the
// interpreter, which may take seconds, answers instead. A definition that writes the infinity on purpose
// (`Girth` of a forest: `PositiveInfinity`) can carry it, when ALL of these hold:
//
//   1. its declared result type admits the infinity (`number` does, `integer` does not);
//   2. its Epsil writes the literal (`PositiveInfinity` or `NegativeInfinity`), so an infinity is its own;
//   3. nothing in it can make an infinity out of finite numbers: no `Divide`, no `Power`, no `Ln`, no
//      reciprocal trigonometric or Gamma-like head, which in JS give `Infinity` where the interpreter gives
//      `ComplexInfinity` or `NaN`; a head not classified here counts as one;
//   4. its integer arithmetic stays inside the 2^53 rule, which until an instrumented run exists means it
//      is limited to `Add`, `Subtract`, `Min`, `Max` and comparisons (`Sum` is `Add` over a range).
//
// A statistic with the flag lists the signs it may answer (`infinite` in its compiled entry); `compiledRun`
// reads a JS `Infinity` as `PositiveInfinity` only for a statistic that lists it, and everything else
// declines as before. `NaN` always declines. Build-time only: the compiled table carries the result, and
// this file is not among the checkers that key the verdicts (scripts/verdicts.ts), so its own cross-check
// rows (compiledDefinitionsWithInfinity) are keyed on its text instead.

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { applyPatch, matrixRankCompiles } from "@notatio/ce-patches";
import type { Engine } from "@notatio/engine";
import { bareEngine } from "@notatio/engine/testing";
import { compileTyped } from "@notatio/engine/compiled";
import { evaluateEpsilRepeatedly, type FlatCodec } from "@notatio/structures";
import { FLAT_BY_NAME, subjectToJs } from "../flat.ts";
import type { CompiledDefinition, Verdicts } from "./generate-compiled.ts";
import { compiledDefinitionsInDomains, inDomain, withWhere } from "./generate-domain.ts";
import { type Definition, definitionKey, type MathJSON, SUBJECT, signatureOf } from "./types.ts";

export type InfiniteSign = "PositiveInfinity" | "NegativeInfinity";

/** A compiled entry with the signs of infinity it may answer. */
export interface FlaggedDefinition extends CompiledDefinition {
  readonly infinite?: readonly InfiniteSign[];
}

/** Heads that give a finite number from finite numbers, exactly, and no infinity: structure, control, comparison
 *  and the arithmetic of rule 4. */
const EXACT = new Set([
  "Add",
  "Subtract",
  "Negate",
  "Min",
  "Max",
  "Abs",
  "Sum",
  "If",
  "Equal",
  "NotEqual",
  "Less",
  "LessEqual",
  "Greater",
  "GreaterEqual",
  "And",
  "Or",
  "Not",
  "List",
  "Tuple",
  "Range",
  "At",
  "Length",
  "Join",
  "Map",
  "Fold",
  "Apply",
  "Function",
  "Typed",
]);

/** Heads that make an infinity from finite numbers (rule 3): a pole, or an overflow of the doubles. */
const POLES = new Set([
  "Divide",
  "Rational",
  "Power",
  "Sqrt",
  "Root",
  "Ln",
  "Log",
  "Lb",
  "Lg",
  "Exp",
  "Tan",
  "Cot",
  "Sec",
  "Csc",
  "Tanh",
  "Coth",
  "Sech",
  "Csch",
  "Gamma",
  "GammaLn",
  "Digamma",
  "Zeta",
  "Factorial",
  "Factorial2",
  "Binomial",
]);

/** Other arithmetic that can pass 2^53 (rule 4). */
const WIDE_ARITHMETIC = new Set([
  "Multiply",
  "Mod",
  "Floor",
  "Ceil",
  "Round",
  "Truncate",
  "GCD",
  "LCM",
  "Product",
  "Square",
]);

/** Symbols that are an infinity or a non-number, none of which the definition writes on purpose. */
const NOT_A_NUMBER = new Set(["ComplexInfinity", "NaN"]);

const SIGNS: readonly InfiniteSign[] = ["PositiveInfinity", "NegativeInfinity"];

/** Why a definition may not carry an infinity, or the signs it may. */
export type InfinityVerdict =
  | { readonly signs: readonly InfiniteSign[] }
  | { readonly signs: readonly []; readonly failed: 1 | 2 | 3 | 4; readonly why: string };

const refuse = (failed: 1 | 2 | 3 | 4, why: string): InfinityVerdict => ({ signs: [], failed, why });

/** The signs of infinity `definition`'s compiled code may answer, or the first rule it fails. `ce` types the result. */
export function infiniteAnswers(ce: Engine, definition: Definition): InfinityVerdict {
  const written = SIGNS.filter((sign) => mentions(definition.expr, sign));
  if (written.length === 0) return refuse(2, "no infinity literal");
  const result = definition.result ?? "number";
  try {
    const admits = (sign: InfiniteSign): boolean => ce.box(sign).type.matches(ce.type(result));
    if (!written.every(admits)) return refuse(1, `result type ${result} does not admit ${written.join(", ")}`);
  } catch {
    return refuse(1, `result type ${result} is not read`);
  }
  // The flat alternative is what compiles where it is held: both readings keep the rules.
  for (const expression of [definition.expr, ...(definition.flat === undefined ? [] : [definition.flat as MathJSON])]) {
    const failure = firstFailure(expression);
    if (failure !== undefined) return refuse(failure.rule, failure.why);
  }
  return { signs: written };
}

const mentions = (node: unknown, symbol: string): boolean =>
  node === symbol || (Array.isArray(node) && node.some((child) => mentions(child, symbol)));

/** The first head or symbol of `node` that breaks rule 3 or 4, with the reason. */
function firstFailure(node: unknown): { rule: 3 | 4; why: string } | undefined {
  if (typeof node === "string") return NOT_A_NUMBER.has(node) ? { rule: 3, why: `the symbol ${node}` } : undefined;
  if (!Array.isArray(node)) return undefined;
  const [head, ...operands] = node;
  if (typeof head === "string") {
    if (POLES.has(head)) return { rule: 3, why: `${head} can make an infinity from finite numbers` };
    if (WIDE_ARITHMETIC.has(head))
      return { rule: 4, why: `${head} is integer arithmetic beyond Add, Subtract, Min, Max` };
    if (!EXACT.has(head)) return { rule: 3, why: `${head} is not classified` };
  }
  for (const child of operands) {
    const failure = firstFailure(child);
    if (failure !== undefined) return failure;
  }
  return undefined;
}

/** The text of this file, which keys the cross-check rows it makes. */
const OWN_TEXT = createHash("sha256")
  .update(readFileSync(fileURLToPath(import.meta.url), "utf8"))
  .digest("hex");

/** Whether `definition`'s compiled code, over `subjects`, answers an infinity on at least one of them and the
 *  interpreter gives the same one on each, and nowhere an infinity of a sign it does not carry. A flag with no
 *  infinite subject behind it is not vouched for. */
function infinitiesAgree(
  ce: Engine,
  definition: Definition,
  signs: readonly InfiniteSign[],
  shape: string,
  codec: FlatCodec | undefined,
  subjects: readonly unknown[],
): boolean {
  const code = compileTyped(ce, codec === undefined ? definition.expr : definition.flat, {
    [SUBJECT]: codec?.shape ?? shape,
  });
  if (code === undefined) return false;
  let seen = 0;
  for (const subject of subjects) {
    const nested = subjectToJs(subject);
    const value = codec === undefined || nested === undefined ? nested : codec.encode(nested);
    if (value === undefined) continue;
    let raw: unknown;
    try {
      raw = code.run({ [SUBJECT]: value });
    } catch {
      continue;
    }
    if (raw !== Infinity && raw !== -Infinity) continue;
    const sign: InfiniteSign = raw === Infinity ? "PositiveInfinity" : "NegativeInfinity";
    if (!signs.includes(sign)) return false;
    if (evaluateEpsilRepeatedly(ce, definition.expr, { [SUBJECT]: subject }) !== sign) return false;
    seen++;
  }
  return seen > 0;
}

/**
 * `compiledDefinitionsInDomains`, each compiled entry marked with the signs of infinity it may answer. A flag is
 * given only where the rules hold (`infiniteAnswers`) and the build's own cross-check agrees on the subjects of the
 * definition: a row of its own (`<signature> (infinite)`), so the verdicts of the definitions are untouched.
 */
export function compiledDefinitionsWithInfinity(
  all: readonly Definition[],
  shape: string,
  subjectsOf: (ce: Engine, carrier: string) => readonly unknown[],
  verdicts: Verdicts,
  mine: (signature: string) => boolean,
): { compiled: FlaggedDefinition[]; disagreed: string[] } {
  const done = compiledDefinitionsInDomains(all, shape, subjectsOf, verdicts, mine);
  const ce = bareEngine();
  applyPatch(ce, matrixRankCompiles);
  const entries = new Map(done.compiled.map((entry) => [entry.signature, entry]));
  const flagged = new Map<string, readonly InfiniteSign[]>();
  for (const definition of all.filter((d) => d.interpreted === undefined && mine(signatureOf(d)))) {
    const verdict = infiniteAnswers(ce, definition);
    if (verdict.signs.length === 0) continue;
    const signs = verdict.signs;
    const entry = entries.get(signatureOf(definition));
    const label = `${signatureOf(definition)} (infinite)`;
    const kept = definition.where === undefined ? verdicts : withWhere(verdicts, definition.where);
    const subjects = (): readonly unknown[] =>
      subjectsOf(ce, definition.on)
        .filter((s) => definition.where === undefined || inDomain(ce, definition, s))
        .filter((s) => weightOf(s) <= (definition.checkWeight ?? Infinity));
    if (verdicts.sourceOnly) {
      kept.note({ expr: definition.expr, flat: definition.flat, signs, subjects: subjects(), by: OWN_TEXT }, label);
      continue;
    }
    if (entry === undefined) continue;
    const flat = definition.flat !== undefined && entry.hash === definitionKey(definition);
    const codec = flat ? FLAT_BY_NAME[definition.on] : undefined;
    if (flat && codec === undefined) continue;
    const checked = subjects();
    const source = { expr: definition.expr, flat: definition.flat, signs, subjects: checked, by: OWN_TEXT };
    const parts = { ...source, code: entry.code };
    const agree = () => infinitiesAgree(ce, definition, signs, shape, codec, checked);
    if (kept.remember(parts, source, agree, label, false)) flagged.set(entry.signature, signs);
  }
  const compiled = done.compiled.map((entry) =>
    flagged.has(entry.signature) ? { ...entry, infinite: flagged.get(entry.signature)! } : entry,
  );
  return { compiled, disagreed: done.disagreed };
}

/** The sum of the numbers in a subject. */
const weightOf = (subject: unknown): number =>
  typeof subject === "number" ? subject : Array.isArray(subject) ? subject.reduce((n, e) => n + weightOf(e), 0) : 0;

/** Renders `entries` as the `statistics.compiled.generated.js` module text, an entry's `infinite` beside its hash. */
export function renderCompiledTable(entries: readonly FlaggedDefinition[]): string {
  const body = entries
    .map((e) => {
      const infinite = e.infinite === undefined ? "" : `    infinite: ${JSON.stringify(e.infinite)},\n`;
      return `  ${JSON.stringify(e.signature)}: {\n    hash: ${JSON.stringify(e.hash)},\n${infinite}    run: (_SYS, _) => ${e.code},\n  },`;
    })
    .join("\n");
  return `// GENERATED by scripts/compile-definitions.ts from this area's Epsil definitions, by
// compute-engine's JavaScript compiler. Do not edit: rerun the script. Each entry is used only
// while \`hash\` matches its definition; \`infinite\` lists the infinities its code may answer
// (see ../../src/statistics/infinity.ts); see ../../src/statistics/compiled.ts.
// compute-engine's code can bind a parameter it never reads, or spread an array it builds.
/* eslint-disable no-unused-vars, unicorn/no-useless-spread */

export const COMPILED = {
${body}
};
`;
}
