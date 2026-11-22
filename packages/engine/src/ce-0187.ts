// The wrong answers of compute-engine 0.187.1's compiler (fixed in 0.188 to 0.193) that an
// expression of ours can reach, as shapes of the MathJSON a compile entry point receives. An
// entry point asks `ce0187Decline` and leaves a matching expression to the interpreter;
// `packages/census/scripts/ce-0187-scan.ts` walks what the entry points are handed with
// `findCe0187Defects` and checks each hit against the interpreter; `tests/ce-0187-defects.test.ts`
// reproduces every defect on a bare 0.187.1, so the first release that fixes one fails it. Then
// the name below is searched for and its decline lifted.

/** The defects, by the name every decline and every probe carries. */
export const CE_0187_DEFECTS = {
  /** A function lowered to an operator expression (or an `If` or `Typed` the types decide) is spliced
   *  unparenthesized into the operator around it: `2·Fract(y)` in a function body is `2 * y - Math.floor(y)`. */
  parentheses: "ce-0187:parentheses",
  /** `Csch(x)` and `Sech(x)` in a denominator (`Csch(x)^-1` too) compile to `2 / Math.sinh(x)`, the reciprocal dropped.
   *  Found by the audit; Sec, Csc, Cot, Coth and the inverse reciprocals are right at the pin. */
  reciprocalHyperbolic: "ce-0187:reciprocal-hyperbolic",
  /** A negation, product or difference of `Sqrt(X)²`, and `Abs(Block(X))` under one, lose their parentheses. */
  sqrtSquared: "ce-0187:sqrt-squared",
  /** A compilation reads a name from the scope at compile time, not where the expression was boxed. */
  scope: "ce-0187:scope",
  /** With `k := 4` held, `(x²)^k` is boxed as `x^(2k)`, which is `x` at `k = 1/2`. */
  heldValueBoxing: "ce-0187:held-value-boxing",
  /** A function parameter that is complex (or untyped) reaches `LerchPhi`, whose complex lowering reads a
   *  plain number as 0: `t ↦ LerchPhi(0.3, t, 2)` is the constant `1/0.7`. */
  complexParameter: "ce-0187:complex-parameter",
  /** A compiled `Sum` or `Product` answers NaN at its first NaN term, where the interpreter answers on. */
  sumNaN: "ce-0187:sum-nan",
  /** A compiled `PointList` stops at `iterationBudget`. */
  pointListBudget: "ce-0187:pointlist-budget",
  /** A complex-mode `Sqrt` of a real operand. */
  complexModeSqrt: "ce-0187:complex-mode-sqrt",
  /** `z² + a` compiled from names of no declared type reads a complex input as a number. */
  complexInput: "ce-0187:complex-input",
  /** An `Abs` is dropped from a declared range. */
  absRange: "ce-0187:abs-range",
} as const;

export type Ce0187Defect = (typeof CE_0187_DEFECTS)[keyof typeof CE_0187_DEFECTS];

/** The defects whose shapes decline to the interpreter. The others are census-only: the scan counts them and
 *  `tests/ce-0187-defects.test.ts` holds what the pin does, and no expression of ours has a shape that can
 *  reach one (the entry point's options, the declared types), or none that the interpreter disagrees on. */
export const CE_0187_DECLINED: ReadonlySet<Ce0187Defect> = new Set([
  CE_0187_DEFECTS.parentheses,
  CE_0187_DEFECTS.reciprocalHyperbolic,
  CE_0187_DEFECTS.sqrtSquared,
  CE_0187_DEFECTS.heldValueBoxing,
  CE_0187_DEFECTS.complexParameter,
]);

/** One expression's match: where, and what. `path` indexes the operands from the root (0 is the head). */
export interface Ce0187Hit {
  readonly defect: Ce0187Defect;
  readonly path: readonly number[];
  readonly detail: string;
}

/** The heads whose JavaScript lowering is an operator expression with no parentheses of its own (`y - Math.floor(y)`),
 *  of those compute-engine's table lowers: the differential sweep of every lowered head, in a function body under each
 *  operator, finds only these two wrong at the pin. */
export const OPERATOR_LOWERED_HEADS: ReadonlySet<string> = new Set(["Fract", "Haversine"]);

/** The heads whose compiled lowering is the reciprocal of another's, which the denominator drops. */
const RECIPROCAL_HYPERBOLIC_HEADS: ReadonlySet<string> = new Set(["Csch", "Sech"]);

/** The heads whose lowering takes a complex operand as `{ re, im }` and reads a plain number as 0. */
export const COMPLEX_LOWERED_HEADS: ReadonlySet<string> = new Set(["LerchPhi"]);

/** The heads that can answer NaN for a real operand of a finite sum's term. */
const NAN_HEADS: ReadonlySet<string> = new Set([
  "Sqrt",
  "Root",
  "Ln",
  "Log",
  "Lb",
  "Lg",
  "Arcsin",
  "Arccos",
  "Arcosh",
  "Artanh",
  "Divide",
  "Gamma",
  "Digamma",
]);

/** An operator that splices an operand's code into its own: the operand of one of these needs its parentheses. */
const OPERATORS: ReadonlySet<string> = new Set(["Multiply", "Divide", "Negate", "Subtract", "Power", "Square"]);

/** An operator under which `Sqrt(X)²` and `Abs(Block(X))` lose their parentheses. */
const SQUARE_OPERATORS: ReadonlySet<string> = new Set(["Multiply", "Divide", "Negate", "Subtract"]);

/** The heads whose lowering is an operator expression, so the code of one is not one operand. A call, a name or a number is. */
const OPERATOR_EXPRESSION_HEADS: ReadonlySet<string> = new Set([
  "Add",
  "Subtract",
  "Multiply",
  "Divide",
  "Negate",
  "Power",
  "Square",
  "Sqrt",
  "Root",
  "And",
  "Or",
  "Not",
  "Equal",
  "NotEqual",
  "Less",
  "LessEqual",
  "Greater",
  "GreaterEqual",
  "If",
  "Block",
  "Typed",
]);

const CONSTANTS: ReadonlySet<string> = new Set([
  "True",
  "False",
  "Pi",
  "ExponentialE",
  "ImaginaryUnit",
  "NaN",
  "ComplexInfinity",
  "PositiveInfinity",
  "NegativeInfinity",
  "Nothing",
]);

type Node = unknown;

const isCall = (node: Node): node is readonly unknown[] => Array.isArray(node) && typeof node[0] === "string";

/** The names a node reads, constants left out. */
function namesIn(node: Node, into: Set<string> = new Set()): Set<string> {
  if (typeof node === "string") {
    if (!CONSTANTS.has(node)) into.add(node);
  } else if (Array.isArray(node)) {
    for (const child of node.slice(1)) namesIn(child, into);
  } else if (node !== null && typeof node === "object") {
    const fn = (node as { fn?: unknown }).fn;
    if (fn !== undefined) namesIn(fn, into);
  }
  return into;
}

/** A call's head when `node` is one, with `Square` and a `{ fn }` object read as the array form. */
function headOf(node: Node): string | undefined {
  if (isCall(node)) return node[0] as string;
  const fn =
    node !== null && typeof node === "object" && !Array.isArray(node) ? (node as { fn?: unknown }).fn : undefined;
  return isCall(fn) ? (fn[0] as string) : undefined;
}

const operandsOf = (node: Node): readonly unknown[] => {
  if (isCall(node)) return node.slice(1);
  const fn =
    node !== null && typeof node === "object" && !Array.isArray(node) ? (node as { fn?: unknown }).fn : undefined;
  return isCall(fn) ? fn.slice(1) : [];
};

/** A literal number: a JSON number or `{ num }`. */
const isNumber = (node: Node): boolean =>
  typeof node === "number" || (node !== null && typeof node === "object" && "num" in (node as object));

const isMinusOne = (node: Node): boolean =>
  node === -1 || (node !== null && typeof node === "object" && (node as { num?: unknown }).num === "-1");

const isEvenInteger = (node: Node): boolean => typeof node === "number" && Number.isInteger(node) && node % 2 === 0;

/** `Sqrt(X)` squared: `Power(Sqrt(X), 2)`, `Square(Sqrt(X))`, or `Multiply(Sqrt(X), Sqrt(X))`. */
function squaredSqrt(node: Node): boolean {
  const head = headOf(node);
  const ops = operandsOf(node);
  const sqrt = (n: Node): boolean => headOf(n) === "Sqrt" || (headOf(n) === "Power" && operandsOf(n)[1] === 0.5);
  if (head === "Power") return sqrt(ops[0]) && ops[1] === 2;
  if (head === "Square") return sqrt(ops[0]);
  if (head === "Multiply") return ops.length === 2 && sqrt(ops[0]) && JSON.stringify(ops[0]) === JSON.stringify(ops[1]);
  return false;
}

/** A type that bounds its values (`real<0..5>`): a comparison against it can be decided by the type. */
const hasRange = (type: string | undefined): boolean => type !== undefined && type.includes("..");

/** A parameter's declared type, or undefined for a bare name. */
function paramOf(param: Node): { name: string; type?: string } | undefined {
  if (typeof param === "string") return { name: param };
  if (isCall(param) && param[0] === "Typed" && typeof param[1] === "string") {
    const type = typeof param[2] === "string" ? param[2].replaceAll("'", "") : undefined;
    return type === undefined ? { name: param[1] } : { name: param[1], type };
  }
  return undefined;
}

/** A parameter's type that a plain number satisfies: a real lowering is chosen for it. */
const isRealType = (type: string | undefined): boolean =>
  type !== undefined && /^(real|finite_real|integer|rational|finite_integer|non_negative_integer)\b/.test(type);

interface Frame {
  /** The parameters of the enclosing functions, innermost last, with their types. */
  readonly params: readonly { name: string; type?: string }[];
}

/**
 * Every match of a 0.187.1 compiler defect in `json`, a MathJSON expression as a compile entry point receives
 * it. `types` are the declared types of its free names (range types decide an `If` on their own).
 */
export function findCe0187Defects(json: Node, types: Readonly<Record<string, string>> = {}): Ce0187Hit[] {
  const hits: Ce0187Hit[] = [];
  const add = (defect: Ce0187Defect, path: readonly number[], detail: string): void => {
    hits.push({ defect, path, detail });
  };

  const walk = (node: Node, path: readonly number[], parent: string | undefined, frame: Frame): void => {
    const head = headOf(node);
    if (head === undefined) return;
    const ops = operandsOf(node);
    const under = parent !== undefined && OPERATORS.has(parent);

    if (head === "Function") {
      // A function's parameters: untyped or complex, one that reaches a complex lowering is read as 0.
      const params = ops
        .slice(1)
        .map(paramOf)
        .filter((p) => p !== undefined);
      const inner: Frame = { params: [...frame.params, ...params] };
      const body = ops[0];
      const complex = params.filter((p) => !isRealType(p.type));
      if (complex.length > 0)
        findComplexReaches(
          body,
          complex.map((p) => p.name),
          [...path, 1],
        );
      walk(body, [...path, 1], "Function", inner);
      return;
    }

    if (under && frame.params.length > 0 && OPERATOR_LOWERED_HEADS.has(head))
      add(CE_0187_DEFECTS.parentheses, path, `${head} in a function body under ${parent}`);
    if (parent === "Divide" && RECIPROCAL_HYPERBOLIC_HEADS.has(head) && path[path.length - 1] === 2)
      add(CE_0187_DEFECTS.reciprocalHyperbolic, path, `${head} in a denominator`);
    // `Csch(x)^-1` is boxed as `1/Csch(x)`, so its denominator drops the reciprocal as well.
    if (head === "Power" && RECIPROCAL_HYPERBOLIC_HEADS.has(headOf(ops[0]) ?? "") && isMinusOne(ops[1]))
      add(CE_0187_DEFECTS.reciprocalHyperbolic, path, `${headOf(ops[0])} to the power -1`);
    if (under && head === "If") {
      const condition = ops[0];
      const names = [...namesIn(condition)];
      const decided =
        names.length === 0 || headOf(condition) === "Element" || names.some((name) => hasRange(types[name]));
      // A closed condition picks its branch; any other decided one can pick either. Only a branch that lowers to an
      // operator expression loses what the splice needs.
      const branches = condition === "True" ? [ops[1]] : condition === "False" ? [ops[2]] : [ops[1], ops[2]];
      const spliced = branches.some((branch) => OPERATOR_EXPRESSION_HEADS.has(headOf(branch) ?? ""));
      if (decided && spliced)
        add(CE_0187_DEFECTS.parentheses, path, `If with a condition the types decide under ${parent}`);
    }
    if (under && head === "Typed" && OPERATOR_EXPRESSION_HEADS.has(headOf(ops[0]) ?? ""))
      add(CE_0187_DEFECTS.parentheses, path, `Typed expression under ${parent}`);
    if (parent !== undefined && SQUARE_OPERATORS.has(parent) && squaredSqrt(node))
      add(CE_0187_DEFECTS.sqrtSquared, path, `Sqrt squared under ${parent}`);
    if (parent !== undefined && SQUARE_OPERATORS.has(parent) && head === "Abs" && headOf(ops[0]) === "Block")
      add(CE_0187_DEFECTS.sqrtSquared, path, `Abs of a Block under ${parent}`);
    if (
      head === "Power" &&
      (headOf(ops[0]) === "Square" || (headOf(ops[0]) === "Power" && isEvenInteger(operandsOf(ops[0])[1]))) &&
      !isNumber(ops[1])
    )
      add(CE_0187_DEFECTS.heldValueBoxing, path, "(x^2n)^k with a symbolic k");
    if (head === "Sum" || head === "Product") {
      const term = ops[0];
      const partial = findPartial(term);
      if (partial !== undefined) add(CE_0187_DEFECTS.sumNaN, path, `${head} of a term with ${partial}`);
    }
    if (head === "Abs" && [...namesIn(ops[0])].some((name) => hasRange(types[name])))
      add(CE_0187_DEFECTS.absRange, path, "Abs of a range-typed name");

    ops.forEach((child, i) => walk(child, [...path, i + 1], head, frame));
  };

  /** A parameter read by a complex-lowered head. */
  const findComplexReaches = (node: Node, names: readonly string[], path: readonly number[]): void => {
    const head = headOf(node);
    if (head === undefined) return;
    const ops = operandsOf(node);
    if (COMPLEX_LOWERED_HEADS.has(head) && ops.some((op) => names.some((name) => namesIn(op).has(name))))
      add(CE_0187_DEFECTS.complexParameter, path, `${head} reads a complex parameter`);
    ops.forEach((child, i) => findComplexReaches(child, names, [...path, i + 1]));
  };

  const findPartial = (node: Node): string | undefined => {
    const head = headOf(node);
    if (head === undefined) return undefined;
    const ops = operandsOf(node);
    if (head === "Divide" && isNumber(ops[1]))
      return ops
        .slice(0, 1)
        .map(findPartial)
        .find((p) => p !== undefined);
    if (NAN_HEADS.has(head)) return head;
    return ops.map(findPartial).find((p) => p !== undefined);
  };

  walk(json, [], undefined, { params: [] });
  return hits;
}

/** The reason to leave `json` to the interpreter, naming its defect, or undefined when it has no shape a decline covers. */
export function ce0187Decline(json: Node, types: Readonly<Record<string, string>> = {}): string | undefined {
  const hit = findCe0187Defects(json, types).find((h) => CE_0187_DECLINED.has(h.defect));
  return hit === undefined ? undefined : `${hit.defect}: ${hit.detail}`;
}

/** The subexpression at `path` of `json`. */
export function atPath(json: Node, path: readonly number[]): Node {
  let node = json;
  for (const i of path) node = isCall(node) ? node[i] : operandsOf(node)[i - 1];
  return node;
}
