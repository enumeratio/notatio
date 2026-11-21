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
//      The two-operand count follows a tuple accumulator component by component (`Dom` below): a component is tainted
//      when its seed is an infinity or its expression reads a tainted component, and a component whose expression never
//      meets the infinity seed is clean, so `Add(a[1], b[1])` over a count beside a nearest-leaf distance seeded
//      `PositiveInfinity` keeps the flag. The accumulator must be a fixed-length tuple, read only by `At` with a literal
//      index and written only as a literal `List` (a recursive result likewise); anything else taints every component.
//      The `Multiply` and `Power` guards above still treat every fold and recursive result as derived. A clean
//      component is held under the doubles only by the 2^53 obligation on finite answers, plus a guard against an `Add`
//      of one expression to itself.
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
      env: new Map(),
      self: true,
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
  /** What each name in scope holds, component by component for a tuple (`Dom`). */
  readonly env: ReadonlyMap<string, Dom>;
  /** What a recursive call answers. */
  readonly self: Dom;
}

/**
 * The taint of a value: a scalar (`true` when its expression reads an infinity seed or a tainted value), or the
 * taint of each component of a tuple. `undefined` is a recursive result not yet known, which a fixed point fills.
 */
type Dom = boolean | undefined | Dom[];
type DomContext = Pick<Walk, "env" | "self">;

const collapse = (dom: Dom): boolean => (Array.isArray(dom) ? dom.some(collapse) : dom === true);
const settle = (dom: Dom): Dom => (Array.isArray(dom) ? dom.map(settle) : dom === true);
const sameDom = (a: Dom, b: Dom): boolean => JSON.stringify(a) === JSON.stringify(b);

function join(a: Dom, b: Dom): Dom {
  if (a === undefined) return b;
  if (b === undefined) return a;
  if (Array.isArray(a) && Array.isArray(b) && a.length === b.length) return a.map((x, i) => join(x, b[i]!));
  return collapse(a) || collapse(b);
}

const isList = (node: unknown): node is unknown[] => Array.isArray(node) && node[0] === "List";

/** Whether every read of `name` in `node` is `At(name, k)` for a literal integer `k` in 1..`size`. */
function readsOnlyByLiteralAt(node: unknown, name: string, size: number): boolean {
  if (node === name) return false;
  if (!Array.isArray(node)) return true;
  if (node[0] === "At" && node[1] === name) {
    const index = node[2];
    return typeof index === "number" && Number.isInteger(index) && index >= 1 && index <= size;
  }
  return node.every((child) => readsOnlyByLiteralAt(child, name, size));
}

/** Whether every recursive call in `node` is read by `At` with a literal index or is the body of a `Map`. */
function selfReadsAreLiteral(node: unknown, allowed = false): boolean {
  if (!Array.isArray(node)) return true;
  const [head, ...operands] = node;
  if (head === RECURSIVE) return allowed && operands.every((child) => selfReadsAreLiteral(child));
  if (head === "At") {
    const literal = typeof operands[1] === "number" && Number.isInteger(operands[1]);
    return selfReadsAreLiteral(operands[0], literal) && selfReadsAreLiteral(operands[1]);
  }
  if (head === "Map" && Array.isArray(operands[0]) && operands[0][0] === "Function")
    return selfReadsAreLiteral(operands[0][1], true) && operands.slice(1).every((child) => selfReadsAreLiteral(child));
  return node.every((child) => selfReadsAreLiteral(child));
}

const writesInfinity = (node: unknown): boolean => SIGNS.some((sign) => mentions(node, sign));

/** The taint of `node`, a tuple's components apart where the tuple is built by a literal `List` and read by `At`. */
function domOf(node: unknown, ctx: DomContext): Dom {
  if (typeof node === "string") return ctx.env.get(node) ?? false;
  if (!Array.isArray(node)) return false;
  const [head, ...operands] = node;
  switch (head) {
    case RECURSIVE:
      return ctx.self;
    case "Fold":
      return foldBindings(node, ctx).accumulator;
    case "List":
      return operands.map((item) => domOf(item, ctx));
    case "At": {
      const whole = domOf(operands[0], ctx);
      const index = operands[1];
      if (Array.isArray(whole)) {
        return typeof index === "number" && Number.isInteger(index) && index >= 1 && index <= whole.length
          ? whole[index - 1]!
          : true;
      }
      return whole;
    }
    case "If":
      // The condition only selects: a value taken from the branches is tainted only by what a branch reads. `If(Less(d, 3), 1, 0)`
      // over a distance `d` seeded with an infinity is a clean count.
      return join(domOf(operands[1], ctx), domOf(operands[2], ctx));
    case "Apply":
      if (Array.isArray(operands[0]) && operands[0][0] === "Function")
        return domOf(operands[0][1], enter(operands[0], operands.slice(1), ctx));
      break;
    default:
      if (Array.isArray(head) && head[0] === "Function") return domOf(head[1], enter(head, operands, ctx));
  }
  const parts = head === "Function" ? [operands[0]] : Array.isArray(head) ? [head, ...operands] : operands;
  return parts.some((child) => {
    const dom = domOf(child, ctx);
    // A tuple passed whole to another head taints every component.
    return Array.isArray(dom) && !isList(child) ? true : collapse(dom);
  });
}

/** The scope of the body of `Function(body, parameters)` applied to `values`, and what a recursive call answers in it. */
function enter<W extends DomContext>(fn: readonly unknown[], values: readonly unknown[], ctx: W): W {
  const [, body, ...parameters] = fn;
  const env = new Map(ctx.env);
  parameters.forEach((parameter, i) => {
    const name = parameterName(parameter);
    if (name === undefined || name === RECURSIVE) return;
    const dom = domOf(values[i], ctx);
    env.set(name, readsOnlyByLiteralAt(body, name, Infinity) || !Array.isArray(dom) ? dom : true);
  });
  const self = parameterName(parameters[0]) === RECURSIVE ? recursionDom(body, env) : ctx.self;
  return { ...ctx, env, self };
}

/** What a recursive call answers: the fixed point of the taint of the body, or `true` where a result is not read by `At`. */
function recursionDom(body: unknown, env: ReadonlyMap<string, Dom>): Dom {
  let result: Dom = undefined;
  for (let round = 0; round < 16; round++) {
    const next = join(result, domOf(body, { env, self: result }));
    if (sameDom(next, result)) return Array.isArray(result) && selfReadsAreLiteral(body) ? settle(result) : true;
    result = next;
  }
  return true;
}

/** A fold's accumulator and entry: the fixed point of its step over a literal-list seed, or an opaque accumulator. */
function foldBindings(fold: readonly unknown[], ctx: DomContext): { accumulator: Dom; entry: Dom } {
  const opaque = { accumulator: true, entry: false };
  const [, fn, seed, collection] = fold;
  if (!Array.isArray(fn) || fn[0] !== "Function") return opaque;
  const [, step, ...parameters] = fn;
  const a = parameterName(parameters[0]);
  const b = parameterName(parameters[1]);
  if (a === undefined || !isList(seed) || !isList(step) || step.length !== seed.length) return opaque;
  if (!readsOnlyByLiteralAt(step, a, seed.length - 1)) return opaque;
  // A seed component that is an infinity is the taint's source.
  let accumulator: Dom = seed.slice(1).map((item) => writesInfinity(item) || collapse(domOf(item, ctx)));
  const elements =
    Array.isArray(collection) &&
    collection[0] === "Map" &&
    Array.isArray(collection[1]) &&
    collection[1][0] === "Function"
      ? domOf(collection[1][1], ctx)
      : collapse(domOf(collection, ctx));
  const entry =
    b === undefined || readsOnlyByLiteralAt(step, b, Infinity) || !Array.isArray(elements) ? elements : true;
  for (let round = 0; round <= seed.length; round++) {
    const env = new Map(ctx.env);
    env.set(a, accumulator);
    if (b !== undefined) env.set(b, entry);
    const next = join(accumulator, domOf(step, { ...ctx, env }));
    if (sameDom(next, accumulator)) return { accumulator, entry: settle(entry) };
    accumulator = next;
  }
  return opaque;
}

/** Whether `node` is tainted (see `Dom`) in `ctx`. */
const taintOf = (node: unknown, ctx: DomContext): boolean => collapse(domOf(node, ctx));

/** Whether `node` is a fold's accumulator or an element of it (`At` of a direct read), not an expression computed from it. */
const isDirectRead = (node: unknown, accumulators: ReadonlySet<string>): boolean =>
  typeof node === "string"
    ? accumulators.has(node)
    : Array.isArray(node) && node[0] === "At" && isDirectRead(node[1], accumulators);

/**
 * How many of an `Add` or `Subtract`'s `operands` are tainted by the component rule. An operand derived from an
 * accumulator (`derived`, the whole-accumulator reading) that appears twice doubles whatever its component: two equal
 * ones count as two.
 */
function taintedOperands(operands: readonly unknown[], walk: Walk, derived: ReadonlySet<string>): number {
  const count = operands.filter((operand) => taintOf(operand, walk)).length;
  const repeated = operands.some(
    (operand, i) =>
      isTainted(operand, derived) &&
      !isIndicator(operand) &&
      operands.some((other, j) => j !== i && JSON.stringify(other) === JSON.stringify(operand)),
  );
  return repeated ? Math.max(count, 2) : count;
}

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
    // The function passed as its own `self` is walked once, as the body, where a recursive call's taint is known.
    const own = values.filter((_, i) => parameterName(parameters[i]) !== RECURSIVE);
    return each(own, tainted) ?? firstFailure(body, enter(fn, values, walk), extend(bound));
  };
  if (typeof head === "string") {
    if (POLES.has(head)) return { rule: 3, why: `${head} can make an infinity from finite numbers` };
    if (head === "Multiply" || head === "Power") {
      const why = walk.bounded ? undefined : growth(head, operands, tainted);
      if (why !== undefined) return { rule: 4, why };
    } else if (head === "Add" || head === "Subtract") {
      if (!walk.bounded && !walk.exempt.has(node) && taintedOperands(operands, walk, tainted) > 1)
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
      const entry = parameterName(operands[0][3]);
      const bound = foldBindings(node, walk);
      const env = new Map(walk.env);
      if (accumulator !== undefined) env.set(accumulator, bound.accumulator);
      if (entry !== undefined) env.set(entry, bound.entry);
      const within = {
        ...walk,
        env,
        accumulators: accumulator === undefined ? walk.accumulators : new Set([...walk.accumulators, accumulator]),
      };
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
