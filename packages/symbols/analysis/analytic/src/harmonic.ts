import { type Expression, type ComputeEngine, isNumber } from "@cortex-js/compute-engine";
import type { Json } from "@notatio/ce-patches";
import { bernoulliRational, type BoxInput, doublesForFloats, inDoublesIfComplex, isRealInt } from "@notatio/ce-patches";
import { numerically } from "./finish.ts";

// HarmonicNumber(n) = Σ_{k=1}^n 1/k and HarmonicNumber(n, r) = Σ_{k=1}^n k^{-r} — exact
// rationals for a non-negative integer n (r any integer, either arity). Off the integer
// lattice — a non-integer or complex first argument, or a non-integer order — Wolfram's
// convention is the analytic continuation: HarmonicNumber(z) = ψ(z+1) + γ and
// HarmonicNumber(z, r) = ζ(r) − ζ(r, z+1). Both continuations reduce to the same exact
// values at the integers (ψ(n+1) + γ = H_n is the standard digamma identity), so this
// kernel only needs the exact path where it beats double precision.

type Rat = readonly [bigint, bigint]; // [num, den], den > 0, reduced

const gcd = (a: bigint, b: bigint): bigint => {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b) [a, b] = [b, a % b];
  return a;
};

const normalize = ([n, d]: Rat): Rat => {
  if (d < 0n) [n, d] = [-n, -d];
  const g = gcd(n, d) || 1n;
  return [n / g, d / g];
};

const rAdd = (x: Rat, y: Rat): Rat => normalize([x[0] * y[1] + y[0] * x[1], x[1] * y[1]]);

const intNode = (v: bigint): Json =>
  v <= BigInt(Number.MAX_SAFE_INTEGER) && v >= BigInt(Number.MIN_SAFE_INTEGER) ? Number(v) : { num: v.toString() };

const ratNode = ([n, d]: Rat): Json => (d === 1n ? intNode(n) : ["Rational", intNode(n), intNode(d)]);

/** base^e for a bigint base and a non-negative integer exponent e. */
const ipow = (base: bigint, e: number): bigint => {
  let r = 1n;
  for (let i = 0; i < e; i++) r *= base;
  return r;
};

/**
 * Exact generalized harmonic number Σ_{k=1}^n k^{-r}, n ≥ 0 and r an integer of either
 * sign, as a reduced bigint rational. n = 0 is the empty sum, 0.
 */
function harmonicRational(n: number, r: number): Rat {
  let sum: Rat = [0n, 1n];
  for (let k = 1; k <= n; k++) {
    const term: Rat = r >= 0 ? normalize([1n, ipow(BigInt(k), r)]) : [ipow(BigInt(k), -r), 1n];
    sum = rAdd(sum, term);
  }
  return sum;
}

/**
 * Largest integer z whose H_z^(r) is summed as one exact fraction: the reduced sum costs about
 * z³ (z = 3000 takes 1 s, z = 6000 takes 11 s), so a larger z is left to the continuation below,
 * which answers a number and leaves the exact form unevaluated.
 */
const EXACT_SUM_MAX = 1000;

/** Largest z summed term by term at a non-integer order -- Wolfram's own cut-off. */
const FINITE_SUM_MAX = 4;

/** Largest k for which H_z^(−k) expands to its Faulhaber polynomial. */
const FAULHABER_MAX = 20;

/**
 * Below this |z| the ζ(r) − ζ(r, z+1) difference loses all its digits (z = 1e-20 answers 0 at
 * 50 digits, the value being about z·ζ(r+1)), so the Taylor series in z takes over.
 */
const SERIES_MAX_ARG = 1e-3;

/** Cap on series terms; past it the difference stands. */
const SERIES_MAX_TERMS = 400;

/** Digits carried beyond the engine's: `numerically` evaluates with this guard and rounds back. */
const SERIES_GUARD = 14;

/**
 * H_z^(r) = Σ_{k≥1} (−1)^(k+1) (r)_k/k! ζ(r+k) z^k for |z| < 1 (ζ(r, 1+z)'s expansion at z = 0,
 * the binomial series of (1+z)^(−s) summed over the Hurwitz terms), as an expression with enough terms for the engine's
 * digits; undefined where ζ(r+k) has a pole (r a non-positive integer) or the terms don't
 * shrink within the cap.
 */
function smallArgumentSeries(z: Expression, r: Json, order: number, digits: number): Json | undefined {
  const x = Math.abs(z.re);
  const target = 10 ** -(digits + SERIES_GUARD + 2);
  const zJson = z.json as unknown as Json;
  const terms: Json[] = [];
  const factors: Json[] = [];
  let bound = 1; // |(r)_k/k!·z^k|, in doubles
  const first = x * Math.max(Math.abs(order), 1e-300);
  for (let k = 1; k <= SERIES_MAX_TERMS; k++) {
    factors.push(k === 1 ? r : ["Add", r, k - 1]);
    bound *= (Math.abs(order + k - 1) / k) * x;
    const coefficient: Json = [
      "Divide",
      factors.length === 1 ? factors[0]! : ["Multiply", ...factors],
      ["Factorial", k],
    ];
    terms.push(["Multiply", k % 2 === 1 ? 1 : -1, coefficient, ["Zeta", ["Add", r, k]], ["Power", zJson, k]]);
    if (bound * 4 < first * target) return ["Add", ...terms];
  }
  return undefined;
}

const isExactRational = (x: Expression): boolean => isNumber(x) && x.isExact && x.im === 0 && !isRealInt(x);

const binomial = (n: number, k: number): bigint => {
  let r = 1n;
  for (let i = 0; i < k; i++) r = (r * BigInt(n - i)) / BigInt(i + 1);
  return r;
};

/** Σ_{j=1}^z j^k = (1/(k+1)) Σ_{i=0}^{k} C(k+1, i) B⁺ᵢ z^(k+1−i), with B⁺₁ = +1/2. */
function faulhaber(k: number, z: Json): Json {
  const terms: Json[] = [];
  for (let i = 0; i <= k; i++) {
    const [bn, bd] = i === 1 ? [1n, 2n] : bernoulliRational(i);
    if (bn === 0n) continue;
    const coeff = normalize([binomial(k + 1, i) * bn, bd * BigInt(k + 1)]);
    const e = k + 1 - i;
    terms.push(["Multiply", ratNode(coeff), e === 1 ? z : ["Power", z, e]]);
  }
  return ["Add", ...terms];
}

/**
 * Evaluate HarmonicNumber(z) / HarmonicNumber(z, r). Exact rational at a non-negative
 * integer z with an integer (or absent) r; ComplexInfinity at a negative integer z,
 * matching Wolfram (the sum has no value there); the ψ/ζ continuation otherwise, numeric
 * only — plain `evaluate()` leaves a non-integer-order or non-integer-z call symbolic,
 * the same gate the other analytic heads use.
 */
export function evaluateHarmonicNumber(
  ce: ComputeEngine,
  ops: readonly Expression[],
  numeric: boolean,
  options: { readonly numericApproximation?: boolean } = {},
): Expression | undefined {
  const z = ops[0];
  const r = ops[1];
  if (z === undefined) return undefined;
  const box = (expr: Json) => ce.box(expr as unknown as BoxInput);
  const finish = (expr: Expression) => (numeric ? numerically(expr) : expr.evaluate());

  // An infinite operand reaches ψ(∞), which is NaN for ComplexInfinity; PositiveInfinity is reduced
  // before this kernel, so what is left stays unevaluated.
  if ((z as Partial<{ isInfinity: boolean }>).isInfinity === true) return undefined;

  if (isRealInt(z) && z.re < 0) return ce.symbol("ComplexInfinity"); // no sum below n = 0

  if (isRealInt(z) && z.re === 0) return finish(box(0)); // empty sum, any r

  if (isRealInt(z) && z.re > 0 && z.re <= EXACT_SUM_MAX && (r === undefined || isRealInt(r))) {
    return finish(box(ratNode(harmonicRational(z.re, r === undefined ? 1 : r.re))));
  }

  // A positive integer z and an exact non-integer order: still a finite sum, of radicals.
  if (isRealInt(z) && z.re > 0 && z.re <= FINITE_SUM_MAX && r !== undefined && isExactRational(r)) {
    const terms: Json[] = [];
    for (let k = 1; k <= z.re; k++) terms.push(["Power", k, ["Negate", r.json as unknown as Json]]);
    return finish(box(["Add", ...terms]));
  }

  // A negative integer order is Faulhaber's polynomial in z for every z, the continuation
  // included (H_z^(−k) = ζ(−k) − ζ(−k, z+1) is a Bernoulli-polynomial difference).
  if (!numeric && r !== undefined && isRealInt(r) && r.re < 0 && r.re >= -FAULHABER_MAX) {
    if (isNumber(z)) return undefined;
    return box(faulhaber(-r.re, z.json as unknown as Json)).evaluate();
  }

  // Everything else — non-integer/complex z, or a non-integer order — is the continuation,
  // reached through the native heads it is built from rather than a second numeric kernel.
  if (numeric) {
    if (
      isNumber(z) &&
      z.im === 0 &&
      Math.abs(z.re) <= SERIES_MAX_ARG &&
      (r === undefined || (isNumber(r) && r.im === 0))
    ) {
      const order = r === undefined ? 1 : r.re;
      let small: Json | undefined;
      if (Number.isInteger(order) && order <= 0) {
        // r = 0, −1, …: H is Faulhaber's polynomial, with no ζ pole in the series to dodge.
        if (order >= -FAULHABER_MAX) small = faulhaber(-order, z.json as unknown as Json);
      } else if (Number.isFinite(order)) {
        small = smallArgumentSeries(z, (r?.json ?? 1) as unknown as Json, order, ce.precision);
      }
      if (small !== undefined) return doublesForFloats(ce, ops, options, () => finish(box(small)));
    }
    const zJson = z.json as unknown as Json;
    const rJson = r?.json as unknown as Json;
    // A complex operand runs ψ and ζ in doubles.
    return doublesForFloats(ce, ops, options, () =>
      inDoublesIfComplex(ce, ops, options, () =>
        r === undefined
          ? finish(box(["Add", ["PolyGamma", 0, ["Add", zJson, 1]], "EulerGamma"]))
          : finish(box(["Subtract", ["Zeta", rJson], ["HurwitzZeta", rJson, ["Add", zJson, 1]]])),
      ),
    );
  }

  return undefined; // stay symbolic
}
