import {
  bigIntegerAt,
  bigRationalAt,
  type Engine,
  type Expr,
  isSymbol,
  operandsOf,
  symbolNameOf,
  wrapOperator,
} from "@notatio/engine";
import type { EvalOptions } from "@notatio/ce-patches";

// Exact values Wolfram folds on sight and compute-engine leaves as calls: the Airy functions
// at 0, and the two Gauss reductions that drop a hypergeometric's parameters. Plus the pieces
// `FunctionExpand` uses: K and E at the lemniscatic parameters, K′, and the Airy rotation laws.
// Each wrapper is a pre-check in front of the native kernel, which still answers everything else.

const finish = (expr: Expr, options: EvalOptions): Expr => (options.numericApproximation ? expr.N() : expr.evaluate());

/** The exact integer `n` at an operand (a float `0.0` is not one: it keeps a float answer). */
const isInteger = (op: Expr | undefined, n: bigint): boolean => bigIntegerAt(op) === n;

/** Ai(0), Ai′(0), Bi(0), Bi′(0) (DLMF 9.2.3-4), as Wolfram writes them. */
const AIRY_AT_ZERO: Readonly<Record<string, unknown>> = {
  AiryAi: ["Divide", 1, ["Multiply", ["Power", 3, ["Rational", 2, 3]], ["Gamma", ["Rational", 2, 3]]]],
  AiryAiPrime: ["Negate", ["Divide", 1, ["Multiply", ["Power", 3, ["Rational", 1, 3]], ["Gamma", ["Rational", 1, 3]]]]],
  AiryBi: ["Divide", 1, ["Multiply", ["Power", 3, ["Rational", 1, 6]], ["Gamma", ["Rational", 2, 3]]]],
  AiryBiPrime: ["Divide", ["Power", 3, ["Rational", 1, 6]], ["Gamma", ["Rational", 1, 3]]],
};

// 2F1(a, b; b; z) = (1−z)^(−a) and 1F1(a; a; z) = e^z: the lower parameter cancels an upper one.
const sameParameter = (x: Expr | undefined, y: Expr | undefined): boolean =>
  x !== undefined && y !== undefined && x.isSame(y);

/** The closed form of `Hypergeometric2F1(a, b, c, z)` once `c` equals `a` or `b`, else undefined. */
const reduce2F1 = (ce: Engine, ops: readonly Expr[]): Expr | undefined => {
  const [a, b, c, z] = ops;
  const survivor = sameParameter(b, c) ? a : sameParameter(a, c) ? b : undefined;
  if (survivor === undefined || z === undefined) return undefined;
  return ce.function("Power", [ce.function("Subtract", [ce.One, z]), ce.function("Negate", [survivor])]);
};

/** n of `Derivative(EllipticK, n)`, for an exact integer n ≥ 1, else undefined. */
function ellipticKDerivativeOrder(op: Expr | undefined): number | undefined {
  if (op?.operator !== "Derivative") return undefined;
  const [head, order] = operandsOf(op);
  const n = head === undefined || symbolNameOf(head) !== "EllipticK" ? undefined : bigIntegerAt(order);
  return n === undefined || n < 1n || n > 10_000n ? undefined : Number(n);
}

/** K⁽ⁿ⁾(0) = (π/2)·((½)ₙ)²/n!, the Taylor coefficients of K(m) = (π/2)·₂F₁(½, ½; 1; m). */
function ellipticKDerivativeAtZero(ce: Engine, n: number): Expr {
  let num = 1n;
  let den = 2n;
  for (let i = 1; i <= n; i++) {
    const odd = BigInt(2 * i - 1);
    num *= odd * odd;
    den *= 4n * BigInt(i);
  }
  let [a, b] = [num, den];
  while (b !== 0n) [a, b] = [b, a % b];
  return ce.function("Multiply", [ce.number([num / a, den / a] as unknown as [number, number]), ce.symbol("Pi")]);
}

/** The most terms of a closed-form Taylor series the `Series` wrappers below build. */
const MAX_SERIES_ORDER = 40n;

/** `Series(EllipticK(x), x, 0, n)` or `Series(EllipticE(x), x, 0, n)`: the order n and the first parameter a of the
 *  ₂F₁(a, ½; 1; x) they are (K = (π/2) ₂F₁(½, ½; 1; x), E = (π/2) ₂F₁(−½, ½; 1; x)), else undefined. */
function completeEllipticSeries(ops: readonly Expr[]): { order: number; a: [number, number] } | undefined {
  const [f, x, point, order] = ops;
  const a: [number, number] | undefined =
    f?.operator === "EllipticK" ? [1, 2] : f?.operator === "EllipticE" ? [-1, 2] : undefined;
  const argument = a !== undefined && f !== undefined ? operandsOf(f)[0] : undefined;
  const n = bigIntegerAt(order);
  return a !== undefined &&
    argument !== undefined &&
    x !== undefined &&
    isSymbol(x) &&
    argument.isSame(x) &&
    isInteger(point, 0n) &&
    n !== undefined &&
    n >= 0n &&
    n <= MAX_SERIES_ORDER
    ? { order: Number(n), a }
    : undefined;
}

/** (π/2) ₂F₁(a, ½; 1; x) to O(xⁿ⁺¹), by the exact ratio (a+k−1)(k−½)/k² of its coefficients (DLMF 19.5.1). */
function completeEllipticTaylor(ce: Engine, x: Expr, n: number, a: [number, number]): Expr {
  const half = ce.number([1, 2] as unknown as [number, number]);
  const first = ce.number(a as unknown as [number, number]);
  let coefficient: Expr = ce.function("Multiply", [half, ce.symbol("Pi")]);
  const coefficients: Expr[] = [coefficient];
  for (let k = 1; k <= n; k++) {
    const shift = (p: Expr): Expr => ce.function("Add", [p, ce.number(k - 1)]);
    const ratio = ce.function("Divide", [ce.function("Multiply", [shift(first), shift(half)]), ce.number(k * k)]);
    coefficient = ce.function("Multiply", [coefficient, ratio]).evaluate();
    coefficients.push(coefficient);
  }
  // Highest power first, then the remainder, then the constant: compute-engine's order for a series.
  const terms: Expr[] = [];
  for (let k = n; k >= 1; k--)
    terms.push(ce.function("Multiply", [coefficients[k]!, ce.function("Power", [x, ce.number(k)])]));
  terms.push(ce.function("BigO", [ce.function("Power", [x, ce.number(n + 1)])]));
  terms.push(coefficients[0]!);
  return ce.function("Add", terms);
}

/** ₂F₁(a, b; c; x) as the polynomial it is when a or b is a nonpositive integer, else undefined. */
function terminating2F1(ce: Engine, ops: readonly Expr[]): Expr | undefined {
  const [f, x] = ops;
  if (f?.operator !== "Hypergeometric2F1" || x === undefined || !isSymbol(x)) return undefined;
  const [a, b, c, z] = operandsOf(f);
  if (a === undefined || b === undefined || c === undefined || z === undefined || !z.isSame(x)) return undefined;
  const [na, nb] = [bigIntegerAt(a), bigIntegerAt(b)];
  const degree = na !== undefined && na <= 0n ? -na : nb !== undefined && nb <= 0n ? -nb : undefined;
  if (degree === undefined || degree > MAX_SERIES_ORDER) return undefined;
  const nc = bigIntegerAt(c);
  if ([a, b, c].some((p) => bigRationalAt(p) === undefined) || (nc !== undefined && nc <= 0n)) return undefined;
  const terms: Expr[] = [];
  let coefficient: Expr = ce.One;
  for (let k = 0; k <= Number(degree); k++) {
    if (k > 0) {
      const shift = (p: Expr): Expr => ce.function("Add", [p, ce.number(k - 1)]);
      const ratio = ce.function("Divide", [
        ce.function("Multiply", [shift(a), shift(b)]),
        ce.function("Multiply", [shift(c), ce.number(k)]),
      ]);
      coefficient = ce.function("Multiply", [coefficient, ratio]).evaluate();
    }
    terms.push(ce.function("Multiply", [coefficient, ce.function("Power", [x, ce.number(k)])]));
  }
  return ce.function("Add", terms);
}

export function declareSpecialValues(ce: Engine): void {
  for (const [head, value] of Object.entries(AIRY_AT_ZERO)) {
    // compile builtin: the closed form at an exact 0; every other operand reaches the numeric kernel
    wrapOperator(
      ce,
      [head, 0],
      (ops) => isInteger(ops[0], 0n),
      () => (_ops, options) => finish(ce.box(value as never), options),
      { arity: 1, compile: "builtin" },
    );
  }

  // compile builtin: the closed form at an exact 0; every other point stays the inert `Derivative` call
  wrapOperator(
    ce,
    ["Apply", ["Derivative", "EllipticK", 1], 0],
    (ops) => ellipticKDerivativeOrder(ops[0]) !== undefined && isInteger(ops[1], 0n),
    () => (ops, options) => finish(ellipticKDerivativeAtZero(ce, ellipticKDerivativeOrder(ops[0])!), options),
    { arity: 2, compile: "builtin" },
  );

  // compute-engine's `Derivative(EllipticK, n)` is the closed form of K⁽ⁿ⁾(m), which is 0/0 at the
  // removable singularity m = 0 (NaN there) and a symbolic n-th derivative that costs seconds at n = 4;
  // it stays the inert call, which the rule above gives its exact value at 0
  // (cortex-js/compute-engine#591, fixed by #600).
  // compile builtin: an inert call compiles as compute-engine's lowering does
  wrapOperator(
    ce,
    ["Derivative", "EllipticK", 1],
    (ops) => {
      const n = symbolNameOf(ops[0]) === "EllipticK" ? bigIntegerAt(ops[1]) : undefined;
      return n !== undefined && n >= 1n && n <= 10_000n;
    },
    () => () => undefined,
    { arity: 2, compile: "builtin" },
  );

  // compute-engine leaves a `Series` unevaluated where it cannot differentiate at the point. The
  // Taylor coefficients of K and E at 0 are exact, and a terminating ₂F₁ is a polynomial
  // (cortex-js/compute-engine#597, fixed by #603).
  // compile builtin: Series has no lowering of ours
  wrapOperator(
    ce,
    ["Series", 1, 1, 1],
    (ops) => completeEllipticSeries(ops) !== undefined,
    () => (ops) => {
      const { order, a } = completeEllipticSeries(ops)!;
      return completeEllipticTaylor(ce, ops[1]!, order, a);
    },
    { arity: 4, compile: "builtin" },
  );
  // compile builtin: Series has no lowering of ours
  wrapOperator(
    ce,
    ["Series", 1, 1, 1],
    (ops) => terminating2F1(ce, ops) !== undefined,
    () => (ops, options) => finish(ce.function("Series", [terminating2F1(ce, ops)!, ...ops.slice(1)]), options),
    { arity: 4, compile: "builtin" },
  );

  // compile builtin: the reduction at matching exact parameters; the numeric kernel answers the rest
  wrapOperator(
    ce,
    ["Hypergeometric1F1", 1, 1, 1],
    (ops) => sameParameter(ops[0], ops[1]),
    () => (ops, options) => finish(ce.function("Exp", [ops[2]!]), options),
    { arity: 3, compile: "builtin" },
  );
  // compile builtin: the reduction at matching exact parameters; the numeric kernel answers the rest
  wrapOperator(
    ce,
    ["Hypergeometric2F1", 1, 1, 1, 1],
    (ops) => reduce2F1(ce, ops) !== undefined,
    () => (ops, options) => finish(reduce2F1(ce, ops)!, options),
    { arity: 4, compile: "builtin" },
  );
}

// --- FunctionExpand ------------------------------------------------------------------

/** Γ(¼)², the constant every lemniscatic value below is written in. */
const GAMMA_QUARTER_SQUARED: unknown = ["Power", ["Gamma", ["Rational", 1, 4]], 2];

/** K(m) and E(m) at m = −1 and m = ½ (the lemniscatic and the singular-value parameters), by Γ(¼). */
const COMPLETE_ELLIPTIC: Readonly<Record<string, Readonly<Record<"K" | "E", unknown>>>> = {
  "-1/1": {
    K: ["Divide", GAMMA_QUARTER_SQUARED, ["Multiply", 4, ["Sqrt", ["Multiply", 2, "Pi"]]]],
    E: [
      "Add",
      ["Divide", ["Multiply", ["Sqrt", 2], ["Power", "Pi", ["Rational", 3, 2]]], GAMMA_QUARTER_SQUARED],
      ["Divide", GAMMA_QUARTER_SQUARED, ["Multiply", 4, ["Sqrt", ["Multiply", 2, "Pi"]]]],
    ],
  },
  "1/2": {
    K: ["Divide", GAMMA_QUARTER_SQUARED, ["Multiply", 4, ["Sqrt", "Pi"]]],
    E: [
      "Add",
      ["Divide", ["Power", "Pi", ["Rational", 3, 2]], GAMMA_QUARTER_SQUARED],
      ["Divide", GAMMA_QUARTER_SQUARED, ["Multiply", 8, ["Sqrt", "Pi"]]],
    ],
  },
};

/** `EllipticK(m)` / `EllipticE(m)` in Γ(¼) at m = −1 or ½, else undefined. */
export function expandCompleteElliptic(ce: Engine, head: string, ops: readonly Expr[]): Expr | undefined {
  if (ops.length !== 1 || (head !== "EllipticK" && head !== "EllipticE")) return undefined;
  const m = bigRationalAt(ops[0]);
  const form = m === undefined ? undefined : COMPLETE_ELLIPTIC[`${m[0]}/${m[1]}`];
  return form === undefined ? undefined : ce.box(form[head === "EllipticK" ? "K" : "E"] as never);
}

/** K′(m) = (E(m) − (1−m)K(m)) / (2m(1−m)) for `Apply(Derivative(EllipticK, 1), m)`, else undefined. */
export function expandEllipticKPrime(ce: Engine, e: Expr): Expr | undefined {
  const [derivative, m] = operandsOf(e);
  if (e.operator !== "Apply" || derivative?.operator !== "Derivative" || m === undefined) return undefined;
  const [head, order] = operandsOf(derivative);
  if (head === undefined || symbolNameOf(head) !== "EllipticK" || !isInteger(order, 1n)) return undefined;
  const k = ce.function("EllipticK", [m]);
  const oneMinusM = ce.function("Subtract", [ce.One, m]);
  return ce.function("Divide", [
    ce.function("Subtract", [ce.function("EllipticE", [m]), ce.function("Multiply", [oneMinusM, k])]),
    ce.function("Multiply", [ce.number(2), m, oneMinusM]),
  ]);
}

/** A real `c` is e^(2πi/3)'s (`+1`) or its conjugate's (`-1`), within rounding; else undefined. */
const cubeRootOfUnity = (c: Expr): 1 | -1 | undefined => {
  const value = c.N();
  if (Math.abs(value.re + 0.5) > 1e-12 || Math.abs(Math.abs(value.im) - Math.sqrt(3) / 2) > 1e-12) return undefined;
  return value.im > 0 ? 1 : -1;
};

/**
 * Ai(ωz) and Bi(ωz) with ω = e^(±2πi/3) (DLMF 9.2.11-12), the rotation Wolfram's FunctionExpand
 * applies, for an argument `z·ω` whose ω is the one constant factor; else undefined.
 */
export function expandAiryRotation(ce: Engine, head: string, arg: Expr): Expr | undefined {
  if ((head !== "AiryAi" && head !== "AiryBi") || arg.operator !== "Multiply") return undefined;
  const factors = operandsOf(arg);
  const at = factors.findIndex((f) => f.symbols.length === 0 && cubeRootOfUnity(f) !== undefined);
  if (at < 0) return undefined;
  const sign = cubeRootOfUnity(factors[at]!)!;
  const rest = factors.filter((_, i) => i !== at);
  const z = rest.length === 1 ? rest[0]! : ce.function("Multiply", rest);
  const [ai, bi] = [ce.function("AiryAi", [z]), ce.function("AiryBi", [z])];
  const i = ce.symbol("ImaginaryUnit");
  const mul = (...xs: Expr[]) => ce.function("Multiply", xs);
  const add = (...xs: Expr[]) => ce.function("Add", xs);
  const s3 = ce.function("Sqrt", [ce.number(3)]);
  // ω = e^(2πi/3) (`sign` = 1) and its conjugate: the sign of every imaginary unit flips.
  const j = sign === 1 ? i : ce.function("Negate", [i]);
  const neg = (x: Expr) => ce.function("Negate", [x]);
  const four = ce.number(4);
  // Bi(ωz) = (√3 − i)(3Ai(z) + iBi(z))/4
  if (head === "AiryBi")
    return ce.function("Divide", [mul(add(s3, neg(j)), add(mul(ce.number(3), ai), mul(j, bi))), four]);
  // Ai(ωz) = (1 + i√3)(Ai(z) − iBi(z))/4
  return ce.function("Divide", [mul(add(ce.One, mul(j, s3)), add(ai, neg(mul(j, bi)))), four]);
}
