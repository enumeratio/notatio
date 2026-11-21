// Which statistics may answer an infinity from their compiled code, decided from the definition at build
// time (BL-510). `fromJs` has no MathJSON for a JS `Infinity`, so a compiled answer of one is dropped and the
// interpreter, which may take seconds, answers instead. A definition that writes the infinity on purpose
// (`Girth` of a forest: `PositiveInfinity`) can carry it, when ALL of these hold:
//
//   1. its declared result type admits the infinity (`number` does, `integer` does not);
//   2. its Epsil writes the literal (`PositiveInfinity` or `NegativeInfinity`), so an infinity is its own;
//   3. nothing in it can make an infinity out of finite numbers: no `Divide`, no pole-bearing head (`Ln`, `Tan`,
//      `Gamma`, `Factorial`, ...), and no head not classified here, which in JS give `Infinity` where the interpreter
//      gives `ComplexInfinity` or `NaN`. `Filter` is a list head with no pole; `self` (a recursive call) is
//      classified with the restriction of rule 4;
//   4. nothing in it can grow without limit by multiplying, which is what takes a finite computation past the
//      doubles (1.8e308) to `Infinity`; the 2^53 rule on finite answers is a separate obligation, not guarded here:
//        - no `Multiply` or `Power` has an operand that is a fold's accumulator, or the result of a recursive call
//          (`n * self(n - 1)` is a factorial and overflows at 171), or a name bound to one;
//        - a `Power` has a literal positive base and an exponent that is a literal, a name, or their sum or
//          difference (`Power(2, v)` for a mask), so it is bounded by the subject's size;
//        - a `Multiply` has at most one factor that is neither a literal nor a 0/1 indicator (`If(..., 1, 0)`, a
//          `Boole`, a comparison, a product of indicators), and when that factor is tainted as above, every other
//          factor is an indicator;
//        - an `Add` or `Subtract` has at most one operand that derives from a fold's accumulator or a recursive result
//          (`Add(acc, acc)` doubles each step and overflows after 1024);
//          unless it is a direct operand of a `Min` whose other operand is a direct read of the accumulator (itself, or an
//          element of it): `Min(t, x) <= t`, so the accumulator's largest entry never rises. Floyd-Warshall's
//          `Min(d[i][j], d[i][k] + d[k][j])` is that. The exemption is for a definition that writes only
//          `PositiveInfinity`; a compiled `-Infinity` is then unlisted and declines;
//        - `Min`, `Max`, `Mod` and comparisons are allowed anywhere (`Mod` by 0 is `NaN`, which declines). A recursive
//          result may be combined by `Add`, `Min`, `Max` and comparisons only.
//      A definition with a `where` and an `intermediates` statement (types.ts) holds its intermediates under 2^53 by
//      that bound, which is far below the doubles' range, so it needs no walk for rule 4.
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
  "Mod",
  "Boole",
  "Filter",
  "self",
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

/** Other arithmetic that can grow past the doubles (rule 4); `Multiply` and `Power` have rules of their own. */
const WIDE_ARITHMETIC = new Set(["Floor", "Ceil", "Round", "Truncate", "GCD", "LCM", "Product", "Square"]);

/** The head of a recursive call: its result is tainted, as a fold's accumulator is. */
const RECURSIVE = "self";

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
    const failure = firstFailure(expression, {
      bounded: definition.where !== undefined && definition.intermediates !== undefined,
      positiveOnly: written.length === 1 && written[0] === "PositiveInfinity",
      accumulators: new Set(),
      exempt: new Set(),
    });
    if (failure !== undefined) return refuse(failure.rule, failure.why);
  }
  return { signs: written };
}

const mentions = (node: unknown, symbol: string): boolean =>
  node === symbol || (Array.isArray(node) && node.some((child) => mentions(child, symbol)));

/** Whether `node` is a literal 0 or 1, a `Boole`, a comparison or a logic head, an `If` of indicators, or a product of them. */
function isIndicator(node: unknown): boolean {
  if (node === 0 || node === 1 || node === "True" || node === "False") return true;
  if (!Array.isArray(node)) return false;
  const [head, ...operands] = node;
  switch (head) {
    case "Boole":
    case "Equal":
    case "NotEqual":
    case "Less":
    case "LessEqual":
    case "Greater":
    case "GreaterEqual":
    case "And":
    case "Or":
    case "Not":
      return true;
    case "If":
      return isIndicator(operands[1]) && isIndicator(operands[2]);
    case "Multiply":
      return operands.every(isIndicator);
    default:
      return false;
  }
}

/** Whether `node` is, or reads, a fold or a recursive result, or a name bound to one (`tainted`). */
function isTainted(node: unknown, tainted: ReadonlySet<string>): boolean {
  if (typeof node === "string") return tainted.has(node);
  if (!Array.isArray(node)) return false;
  if (node[0] === RECURSIVE || node[0] === "Fold") return true;
  return node.some((child) => isTainted(child, tainted));
}

/** The name a function parameter binds: `a`, or `a` of `["Typed", "a", type]`. */
const parameterName = (parameter: unknown): string | undefined =>
  typeof parameter === "string"
    ? parameter
    : Array.isArray(parameter) && parameter[0] === "Typed" && typeof parameter[1] === "string"
      ? parameter[1]
      : undefined;

/** Whether `node` is a literal integer, a name that is not tainted, or a sum or difference of those: bounded by the subject's size. */
function isSizeBound(node: unknown, tainted: ReadonlySet<string>): boolean {
  if (typeof node === "number") return Number.isInteger(node);
  if (typeof node === "string") return node !== SUBJECT && !tainted.has(node);
  if (!Array.isArray(node)) return false;
  // The length of a list is its size.
  if (node[0] === "Length") return !isTainted(node, tainted);
  return (node[0] === "Add" || node[0] === "Subtract") && node.slice(1).every((child) => isSizeBound(child, tainted));
}

/** Rule 4 on one `Multiply` or `Power`: why it may grow without limit, or `undefined`. */
function growth(head: string, operands: readonly unknown[], tainted: ReadonlySet<string>): string | undefined {
  if (head === "Power") {
    const [base, exponent] = operands;
    if (typeof base === "number" && base > 0 && isSizeBound(exponent, tainted)) return undefined;
    return "Power is not a literal base to an exponent bounded by the subject's size";
  }
  const factors = operands.filter((factor) => !isIndicator(factor));
  const others = factors.filter((factor) => typeof factor !== "number");
  if (others.length > 1) return "Multiply has more than one factor that is neither a literal nor an indicator";
  if (others.some((factor) => isTainted(factor, tainted)) && factors.length > 1)
    return "Multiply scales a fold's accumulator or a recursive result";
  return undefined;
}

interface Walk {
  /** `where` and `intermediates` keep every intermediate under 2^53: rule 4 holds by that bound. */
  readonly bounded: boolean;
  /** The definition's signs are exactly `PositiveInfinity`: the `Min` exemption of rule 4 holds for that sign only. */
  readonly positiveOnly: boolean;
  /** The parameters that are a fold's accumulator, in scope. */
  readonly accumulators: ReadonlySet<string>;
  /** The `Add` and `Subtract` nodes exempt from the two-tainted-operands rule: a direct operand of a `Min` that also holds a direct read. */
  readonly exempt: ReadonlySet<unknown>;
}

/** Whether `node` is a fold's accumulator or an element of it (`At` of a direct read), not an expression computed from it. */
const isDirectRead = (node: unknown, accumulators: ReadonlySet<string>): boolean =>
  typeof node === "string"
    ? accumulators.has(node)
    : Array.isArray(node) && node[0] === "At" && isDirectRead(node[1], accumulators);

/**
 * The first head or symbol of `node` that breaks rule 3 or 4, with the reason. `tainted` are the names that hold a
 * fold's accumulator or a recursive result: an `Apply` binds a name to its value, tainted when the value is.
 */
function firstFailure(
  node: unknown,
  walk: Walk,
  tainted: ReadonlySet<string> = new Set(),
): { rule: 3 | 4; why: string } | undefined {
  if (typeof node === "string") return NOT_A_NUMBER.has(node) ? { rule: 3, why: `the symbol ${node}` } : undefined;
  if (!Array.isArray(node)) return undefined;
  const [head, ...operands] = node;
  const each = (children: readonly unknown[], names: ReadonlySet<string>, within: Walk = walk) => {
    for (const child of children) {
      const failure = firstFailure(child, within, names);
      if (failure !== undefined) return failure;
    }
    return undefined;
  };
  const extend = (names: readonly (string | undefined)[]): ReadonlySet<string> =>
    new Set([...tainted, ...names.filter((name): name is string => name !== undefined)]);
  /** `Function(body, parameters)` applied to `values`: a parameter is tainted when its value is. */
  const applied = (fn: readonly unknown[], values: readonly unknown[]) => {
    const [, body, ...parameters] = fn;
    const bound = parameters.map((p, i) => (isTainted(values[i], tainted) ? parameterName(p) : undefined));
    return each(values, tainted) ?? firstFailure(body, walk, extend(bound));
  };
  if (typeof head === "string") {
    if (POLES.has(head)) return { rule: 3, why: `${head} can make an infinity from finite numbers` };
    if (head === "Multiply" || head === "Power") {
      const why = walk.bounded ? undefined : growth(head, operands, tainted);
      if (why !== undefined) return { rule: 4, why };
    } else if (head === "Add" || head === "Subtract") {
      if (
        !walk.bounded &&
        !walk.exempt.has(node) &&
        operands.filter((operand) => isTainted(operand, tainted)).length > 1
      )
        return {
          rule: 4,
          why: `${head} has more than one operand derived from a fold's accumulator or a recursive result`,
        };
    } else if (WIDE_ARITHMETIC.has(head)) {
      if (!walk.bounded) return { rule: 4, why: `${head} is integer arithmetic beyond Add, Subtract, Min, Max, Mod` };
    } else if (!EXACT.has(head)) return { rule: 3, why: `${head} is not classified` };
    // A fold's accumulator is its function's first parameter.
    if (head === "Fold" && Array.isArray(operands[0]) && operands[0][0] === "Function") {
      const accumulator = parameterName(operands[0][2]);
      const within =
        accumulator === undefined ? walk : { ...walk, accumulators: new Set([...walk.accumulators, accumulator]) };
      return each(operands, extend([accumulator]), within);
    }
    // `Min(t, x) <= t` for a direct read `t` of the accumulator, so an `Add` beside it never raises the accumulator's largest entry.
    if (head === "Min" && walk.positiveOnly) {
      const sums = operands.filter(
        (operand, i) =>
          Array.isArray(operand) &&
          (operand[0] === "Add" || operand[0] === "Subtract") &&
          operands.some((other, j) => j !== i && isDirectRead(other, walk.accumulators)),
      );
      if (sums.length > 0) return each(operands, tainted, { ...walk, exempt: new Set([...walk.exempt, ...sums]) });
    }
    if (head === "Apply" && Array.isArray(operands[0]) && operands[0][0] === "Function")
      return applied(operands[0], operands.slice(1));
    return each(operands, tainted);
  }
  // `[Function(body, parameters), arguments]`, the form a recursive definition is applied in.
  if (Array.isArray(head) && head[0] === "Function") return applied(head, operands);
  return each(node, tainted);
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
    // The row's key holds the definition's own hash and the statement that waives rule 4, so a change to either, and
    // not only to this file, makes the row stale.
    const own = { hash: definitionKey(definition), intermediates: definition.intermediates };
    const kept = definition.where === undefined ? verdicts : withWhere(verdicts, definition.where);
    const subjects = (): readonly unknown[] =>
      subjectsOf(ce, definition.on)
        .filter((s) => definition.where === undefined || inDomain(ce, definition, s))
        .filter((s) => weightOf(s) <= (definition.checkWeight ?? Infinity));
    if (verdicts.sourceOnly) {
      kept.note(
        { expr: definition.expr, flat: definition.flat, ...own, signs, subjects: subjects(), by: OWN_TEXT },
        label,
      );
      continue;
    }
    if (entry === undefined) continue;
    const flat = definition.flat !== undefined && entry.hash === definitionKey(definition);
    const codec = flat ? FLAT_BY_NAME[definition.on] : undefined;
    if (flat && codec === undefined) continue;
    const checked = subjects();
    const source = { expr: definition.expr, flat: definition.flat, ...own, signs, subjects: checked, by: OWN_TEXT };
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
