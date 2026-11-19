import { BigDecimal } from "@cortex-js/compute-engine";
import { bernoulliRational } from "./bernoulli-rational.ts";
import type { Cx } from "./complex-arithmetic.ts";

// ζ(s, a) for complex s and a in compute-engine's BigDecimal, to any number of digits.
//
// The double kernel (hurwitz-zeta.ts) runs on Math.log/exp/sin/cos, whose last ulp differs
// between JS engines, so its answer does too. BigDecimal arithmetic is bigint arithmetic and
// the same everywhere: computed with guard digits and rounded once, a double result is
// correctly rounded and engine-independent.
//
// Same Euler–Maclaurin as the double kernel,
//   ζ(s, a) = Σ_{k<N} (k+a)^{-s} + z^{1-s}/(s-1) + ½z^{-s} + Σ_{j=1}^{M} B₂ⱼ/(2j)! (s)₂ⱼ₋₁ z^{-s-2j+1},
// z = N + a, with N and M planned in doubles from the size of each term. Left of Re(s) = 0
// the direct terms grow like N^(−Re s) and cancel; rather than reflect, the working
// precision is raised by the digits that cancellation eats.

/** A complex number as a pair of BigDecimals. */
export interface BigCx {
  re: BigDecimal;
  im: BigDecimal;
}

/** Digits carried past the ones asked for, so a final rounding is (almost always) correct. */
const GUARD_DIGITS = 8;

/**
 * The most direct terms a plan may sum at `TERM_BUDGET_DIGITS` working digits, past which the kernel
 * declines before summing anything. A BigDecimal term costs about 19 µs there (measured on
 * ζ(1e-12 + it) at 15 digits: 0.4 s at t = 1e5, 1.1 s at 2.5e5, 3.8 s at 1e6, 6.6 s at 1.74e6, which
 * plans 3.4e5 terms), so 1.3e5 terms is about 2.5 s, the one time rule for a bound that declines a
 * call that would have answered. ζ(1e-12 + 5e5 i) plans about 1e5 terms and answers; at 1e6 (2e5
 * terms) and 1.74e6 the call declines from its plan alone (70 ms) instead of summing for seconds.
 */
const MAX_TERMS = 1.3e5;

/** The working digits `MAX_TERMS` is measured at; a term costs more in proportion to the digits past it. */
const TERM_BUDGET_DIGITS = 25;

/** The terms a plan at `digits` may sum: `MAX_TERMS`, scaled down by the digits carried past `TERM_BUDGET_DIGITS`. */
const termBudget = (digits: number): number =>
  Math.floor((MAX_TERMS * TERM_BUDGET_DIGITS) / Math.max(TERM_BUDGET_DIGITS, digits));

/** Past this many working digits the cancellation left of the strip is too costly to carry. */
const MAX_WORKING_DIGITS = 1200;

const LN10 = Math.LN10;
const LN_2PI = Math.log(2 * Math.PI);

// BigDecimal's `add`, `sub` and `mul` are exact, so a loop that doesn't round grows its
// significands every step. Every op below rounds to the working precision.
export const round = (x: BigDecimal): BigDecimal => x.toPrecision(BigDecimal.precision);

export const add = (x: BigCx, y: BigCx): BigCx => ({
  re: round(x.re.add(y.re)),
  im: round(x.im.add(y.im)),
});

export const mul = (x: BigCx, y: BigCx): BigCx => ({
  re: round(x.re.mul(y.re).sub(x.im.mul(y.im))),
  im: round(x.re.mul(y.im).add(x.im.mul(y.re))),
});

export const div = (x: BigCx, y: BigCx): BigCx => {
  const d = y.re.mul(y.re).add(y.im.mul(y.im));
  return {
    re: x.re.mul(y.re).add(x.im.mul(y.im)).div(d),
    im: x.im.mul(y.re).sub(x.re.mul(y.im)).div(d),
  };
};

export const scale = (x: BigCx, k: BigDecimal): BigCx => ({
  re: round(x.re.mul(k)),
  im: round(x.im.mul(k)),
});

export const exp = (z: BigCx): BigCx => {
  const m = z.re.exp();
  if (z.im.isZero()) return { re: m, im: BigDecimal.ZERO };
  return { re: round(m.mul(z.im.cos())), im: round(m.mul(z.im.sin())) };
};

/** Principal log, branch cut on (−∞, 0]. */
export const log = (z: BigCx): BigCx => ({
  re: z.re.mul(z.re).add(z.im.mul(z.im)).ln().div(2),
  im: BigDecimal.atan2(z.im, z.re),
});

/**
 * Principal z^w. A positive real base with a real exponent stays real, and so does a negative
 * one with an integer exponent — e^(iπw) would leave rounding noise in the imaginary part.
 */
export const pow = (z: BigCx, w: BigCx): BigCx => {
  if (!z.im.isZero() || z.re.isZero()) return exp(mul(w, log(z)));
  if (z.re.isNegative()) {
    if (!w.im.isZero() || !w.re.isInteger()) return exp(mul(w, log(z)));
    const r = pow({ re: z.re.neg(), im: z.im }, w);
    return w.re.toBigInt() % 2n === 0n ? r : { re: r.re.neg(), im: r.im };
  }
  const ln = z.re.ln();
  return exp({ re: round(w.re.mul(ln)), im: round(w.im.mul(ln)) });
};

const big = (x: number | BigDecimal): BigDecimal => (typeof x === "number" ? new BigDecimal(x) : x);

/**
 * The double `x` as the exact decimal it is (1055.0729513168335 is 1055.07295131683349609375).
 * A double's shortest decimal moves it by up to half an ulp, which near t = 10^5 on the critical
 * line is already 10^-11 of ζ; every other system reads the binary value, so the answer is ζ at it.
 */
export function exactDouble(x: number): BigDecimal {
  if (!Number.isFinite(x) || Number.isInteger(x) || Math.abs(x) < 1e-290) return new BigDecimal(x);
  const view = new DataView(new ArrayBuffer(8));
  view.setFloat64(0, x);
  const bits = view.getBigUint64(0);
  const biased = Number((bits >> 52n) & 0x7ffn);
  const fraction = bits & ((1n << 52n) - 1n);
  const mantissa = biased === 0 ? fraction : fraction | (1n << 52n);
  // x = ±mantissa · 2^(exponent), with exponent < 0 here; 2^−k = 5^k / 10^k.
  const k = 1075 - Math.max(biased, 1);
  const digits = (mantissa * 5n ** BigInt(k)).toString();
  return new BigDecimal(`${x < 0 ? "-" : ""}${digits}e-${k}`);
}

/** A BigCx from doubles (each taken at its shortest decimal, as compute-engine reads floats). */
export const bigCx = (re: number | BigDecimal, im: number | BigDecimal = 0): BigCx => ({
  re: big(re),
  im: big(im),
});

/** Run `fn` with BigDecimal working at `digits`, restoring the engine's precision after. */
export function atDigits<T>(digits: number, fn: () => T): T {
  const saved = BigDecimal.precision;
  BigDecimal.precision = digits;
  try {
    return fn();
  } finally {
    BigDecimal.precision = saved;
  }
}

// B₂ⱼ/(2j)!, held at the most digits any call has wanted and rounded down to the rest.
let coeffs: BigDecimal[] = [];
let coeffDigits = 0;
function emCoeff(j: number): BigDecimal {
  const p = BigDecimal.precision;
  if (p > coeffDigits) {
    coeffs = [];
    coeffDigits = p;
  }
  if (coeffs[j] === undefined) {
    let fact = 1n;
    for (let i = 2n; i <= BigInt(2 * j); i++) fact *= i;
    const [n, d] = bernoulliRational(2 * j);
    coeffs[j] = atDigits(coeffDigits, () => new BigDecimal(n).div(new BigDecimal(d * fact)));
  }
  return p === coeffDigits ? coeffs[j] : coeffs[j].toPrecision(p);
}

export interface Plan {
  terms: number;
  pairs: number;
  /** log10 of the largest single term, which sets how many digits the sum cancels. */
  largest: number;
}

/** ln |w^(−s)| for complex w, s, from doubles. */
const lnAbsPow = (wr: number, wi: number, s: Cx): number =>
  -s.re * 0.5 * Math.log(wr * wr + wi * wi) + s.im * Math.atan2(wi, wr);

/** ln |x + iy|, without squaring (a part near 1e-200 would underflow to −∞ and read as a zero). */
const lnAbs = (x: number, y: number): number => Math.log(Math.hypot(x, y));

/** The operands a plan reads exactly, where `s` and `a` (doubles) are only their nearest doubles. */
export interface ExactOperands {
  s: BigCx;
  a: BigCx;
}

/**
 * Choose N (direct terms) and M (Bernoulli pairs) so the first omitted tail term is below
 * 10^(−digits). A direct term costs a log, an exp and a sin/cos; a pair costs a few
 * multiplies — so of the N that work, take the one that minimises N + M/8. Undefined where no N
 * within `termBudget(digits)` of the start works (|Im s| past ~2.5e5 at 15 digits): the caller declines.
 *
 * `s` and `a` are doubles, and a double is enough for every size the plan estimates (a relative
 * error of 1e-16 in a logarithm moves a term by far less than the one digit of margin in `target`).
 * It is not enough for a difference that cancels: s + m (the Pochhammer factors, s − 1) reads the
 * exact s when `exact` is given, since s = −2 − 1e-16 is the double −2 and its factor s + 2 would be
 * read as 0, dropping every pair that carries it (terms as large as the result). A direct term
 * (k + a)^(−s) that the double reads as a zero is the sum's largest, so the result's own size sets
 * the working digits and nothing is lost.
 */
export function plan(s: Cx, a: Cx, digits: number, exact?: ExactOperands): Plan | undefined {
  const target = -digits * LN10 - LN10;
  const n0 = Math.max(0, Math.ceil(1 - a.re)); // Re z ≥ 1
  const maxPairs = 4 * digits + 50;
  const budget = termBudget(digits);
  // The real part of s + m. Only m = −round(Re s) can cancel to a small number (every other m is at
  // least ½ from it, where the double sum is good to 1e-16 relative), so that one is read exactly.
  const mZero = Math.round(-s.re);
  const shifted = (m: number): number => (exact !== undefined && m === mZero ? exact.s.re.add(m).toNumber() : s.re + m);
  const lnShift = (m: number): number => lnAbs(shifted(m), s.im);
  // lnPochTable[j] = ln |(s)₂ⱼ₋₁|, (s)₁ = s and (s)₂ⱼ₊₁ = (s)₂ⱼ₋₁ (s+2j−1)(s+2j); it does not depend on N.
  const lnPochTable: number[] = [-Infinity, lnShift(0)];
  for (let j = 1; j <= maxPairs; j++) {
    lnPochTable.push(lnPochTable[j] + lnShift(2 * j - 1) + lnShift(2 * j));
  }
  const lnSMinus1 = lnAbs(shifted(-1), s.im);
  let best: Plan | undefined;
  let bestCost = Infinity;
  let firstN = -1;
  for (let n = n0; firstN < 0 || n <= 2 * firstN + 8; n += Math.max(1, Math.ceil((n - n0) / 16))) {
    if (n > n0 + budget) break;
    const zr = a.re + n;
    const zi = a.im;
    const lnZ = lnAbs(zr, zi);
    const lnZs = lnAbsPow(zr, zi, s); // ln |z^(−s)|
    let largest = lnZs + lnZ - lnSMinus1; // z^{1−s}/(s−1)
    let prev = Infinity;
    let pairs = -1;
    for (let j = 1; j <= maxPairs; j++) {
      // |B₂ⱼ/(2j)!| ≈ 2/(2π)^{2j}; z^{−s−2j+1} = z^{−s}·z^{1−2j}
      const t = Math.LN2 - 2 * j * LN_2PI + lnPochTable[j] + lnZs - (2 * j - 1) * lnZ;
      if (t === -Infinity || t < target) {
        pairs = j - 1;
        break;
      }
      if (t > prev) break; // past the smallest term: this N can't get there
      largest = Math.max(largest, t);
      prev = t;
    }
    if (pairs < 0) continue;
    if (firstN < 0) firstN = n;
    for (let k = 0; k < n; k++) {
      const wr = a.re + k;
      if (wr === 0 && a.im === 0) continue;
      largest = Math.max(largest, lnAbsPow(wr, a.im, s));
    }
    const cost = n + pairs / 8;
    if (cost < bestCost) {
      bestCost = cost;
      best = { terms: n, pairs, largest: largest / LN10 };
    }
  }
  return best;
}

/** Whether ζ(s, a) at `digits` needs more direct terms than `termBudget`, so the kernel declines it. */
export const beyondTermCap = (s: BigCx, a: BigCx, digits: number): boolean =>
  plan(
    { re: s.re.toNumber(), im: s.im.toNumber() },
    { re: a.re.toNumber(), im: a.im.toNumber() },
    digits + GUARD_DIGITS,
    { s, a },
  ) === undefined;

/** Euler–Maclaurin at the working precision, for a plan made for it. */
function eulerMaclaurin(s: BigCx, a: BigCx, { terms, pairs }: Plan): BigCx {
  const negS: BigCx = { re: s.re.neg(), im: s.im.neg() };
  let sum: BigCx = { re: BigDecimal.ZERO, im: BigDecimal.ZERO };
  for (let k = 0; k < terms; k++) {
    const w: BigCx = { re: a.re.add(k), im: a.im };
    if (w.re.isZero() && w.im.isZero()) continue; // Wolfram's HurwitzZeta drops (k+a) = 0
    sum = add(sum, pow(w, negS));
  }
  const z: BigCx = { re: a.re.add(terms), im: a.im };
  const zNegS = pow(z, negS);
  sum = add(sum, div(mul(zNegS, z), { re: s.re.sub(1), im: s.im })); // z^{1−s}/(s−1)
  sum = add(sum, scale(zNegS, BigDecimal.HALF)); // ½ z^{−s}
  const zInv2 = div(bigCx(1), mul(z, z));
  let zPow = div(zNegS, z); // z^{−s−2j+1}, from j = 1
  let poch = s; // (s)₂ⱼ₋₁
  for (let j = 1; j <= pairs; j++) {
    sum = add(sum, scale(mul(poch, zPow), emCoeff(j)));
    const u: BigCx = { re: s.re.add(2 * j - 1), im: s.im };
    const v: BigCx = { re: s.re.add(2 * j), im: s.im };
    poch = mul(poch, mul(u, v));
    zPow = mul(zPow, zInv2);
  }
  return sum;
}

/**
 * log10 |x|, +∞ for an exact zero (which has no digits to lose), and NaN for a nonzero value past the
 * double range, whose size this cannot read.
 */
const log10Abs = (x: BigDecimal): number => {
  if (x.isZero()) return Infinity;
  const magnitude = Math.abs(x.toNumber());
  return magnitude > 0 && Number.isFinite(magnitude) ? Math.log10(magnitude) : NaN;
};

/**
 * The relative digits a complex value keeps when its parts were computed to a common working precision:
 * the smaller nonzero part has lost `log10(larger / smaller)` of them. Infinity where the ratio underflows.
 */
function digitsLost(r: BigCx): number {
  const [x, y] = [r.re.abs(), r.im.abs()];
  if (x.isZero() || y.isZero()) return 0;
  const ratio = (x.lt(y) ? x.div(y) : y.div(x)).toNumber();
  return ratio > 0 ? Math.ceil(-Math.log10(ratio)) : Infinity;
}

/**
 * `compute(working)` to `digits` significant digits in each nonzero part: the first pass carries `extra` digits for a
 * part that is small next to the other (Φ(0, 2 + 1e-20, −½) is 4 − 1.3e-19i), and a second carries the digits the
 * first lost. A part that still lacks them is noise, so the answer is undefined.
 */
export function atRelativeDigits(
  digits: number,
  extra: number,
  compute: (working: number) => BigCx | undefined,
): BigCx | undefined {
  let working = digits + GUARD_DIGITS + extra;
  for (let attempt = 0; attempt < 2; attempt++) {
    const r = compute(working);
    if (r === undefined) return undefined;
    const lost = digitsLost(r);
    if (working - lost >= digits + GUARD_DIGITS / 2) return r;
    if (!Number.isFinite(lost) || working + lost > MAX_WORKING_DIGITS) return undefined;
    working += lost;
  }
  return undefined;
}

/**
 * Principal base^exponent to `digits` significant digits in each nonzero part, from the exact base and exponent. The
 * exponential loses the digits of the exponent's own size, |exponent · ln base|, so past 1e6 the answer is undefined.
 */
export function principalPower(base: BigCx, exponent: BigCx, digits: number): BigCx | undefined {
  const size = atDigits(GUARD_DIGITS + 20, () => {
    const w = mul(exponent, log(base));
    return Math.max(Math.abs(w.re.toNumber()), Math.abs(w.im.toNumber()));
  });
  if (!(size < 1e6)) return undefined;
  return atRelativeDigits(digits, Math.ceil(Math.log10(1 + size)), (working) =>
    atDigits(working, () => pow(base, exponent)),
  );
}

/**
 * ζ(s, a) for a positive real a whose double is 0 (1e-400): the plan reads a as the double, drops the k = 0 term
 * a^(−s), which is the largest, and answers ζ(s, 1). ζ(s, a) = a^(−s) + ζ(s, 1 + a) holds exactly, the first term from
 * the exact a and the second at 1 + a, which at the working digits is 1. The value is carried as a BigDecimal
 * (ζ(2, 1e-400) is 1e800). A negative or complex a that small is undefined.
 */
function hurwitzAtTinyShift(s: BigCx, a: BigCx, digits: number): BigCx | undefined {
  if (!a.im.isZero() || !a.re.isPositive()) return undefined;
  const negS = { re: s.re.neg(), im: s.im.neg() };
  return atRelativeDigits(digits, 0, (working) => {
    const first = principalPower(a, negS, working);
    const rest = hurwitzZetaBig(
      s,
      atDigits(working, () => add(a, bigCx(1))),
      working,
    );
    if (first === undefined || rest === undefined) return undefined;
    return atDigits(working, () => {
      const sum = add(first, rest);
      // The two terms cancel (|sum| ≪ the larger): the digits that takes are not there to give.
      const norm = (x: BigCx): BigDecimal => x.re.mul(x.re).add(x.im.mul(x.im));
      const [nf, nr] = [norm(first), norm(rest)];
      return norm(sum).lt((nf.gt(nr) ? nf : nr).div(1e10)) ? undefined : sum;
    });
  });
}

/**
 * ζ(s, a) to `digits` significant digits in each nonzero part, or undefined where it would
 * cost more working precision than it is worth (far left of the strip). The s = 1 pole gives
 * undefined as well; the caller has the exact answer there.
 *
 * Terms where k + a = 0 (a a nonpositive integer) are dropped, as in `hurwitzZeta`.
 */
export function hurwitzZetaBig(s: BigCx, a: BigCx, digits: number): BigCx | undefined {
  // An a below the double's range reads as 0 in the plan below: ζ(s, a) = a^(−s) + ζ(s, 1 + a).
  if (a.re.toNumber() === 0 && a.im.toNumber() === 0 && !(a.re.isZero() && a.im.isZero())) {
    return hurwitzAtTinyShift(s, a, digits);
  }
  // ζ(0, a) = 1/2 − a with the (k+a)=0 term kept (see `hurwitzAtZero`).
  if (s.re.isZero() && s.im.isZero()) return { re: bigCx(0.5).re.sub(a.re), im: a.im.neg() };
  if (s.re.eq(1) && s.im.isZero()) return undefined;
  const sd: Cx = { re: s.re.toNumber(), im: s.im.toNumber() };
  const ad: Cx = { re: a.re.toNumber(), im: a.im.toNumber() };

  // Plan for `digits` absolute. A part smaller than 1 then has fewer correct significant
  // digits than asked for; once its size is known, go again if that ate half the guard.
  let absolute = digits + GUARD_DIGITS;
  for (let attempt = 0; attempt < 2; attempt++) {
    const p = plan(sd, ad, absolute, { s, a });
    if (p === undefined) return undefined;
    const working = absolute + Math.max(0, Math.ceil(p.largest)) + 4;
    if (working > MAX_WORKING_DIGITS) return undefined;
    const r = atDigits(working, () => eulerMaclaurin(s, a, p));
    const smallest = Math.min(log10Abs(r.re), log10Abs(r.im));
    if (Number.isNaN(smallest)) return undefined;
    const short = Math.ceil(-smallest);
    // The digits the smaller part keeps, relative to its own size.
    if (absolute - short >= digits + GUARD_DIGITS / 2) return r;
    // A value next to a zero (ζ(−2 − 1e-60)) is as small as its distance from it: the second plan
    // carries every digit the first lost, and a part that still lacks them is noise, not an answer.
    if (attempt > 0) return undefined;
    absolute += short;
  }
  return undefined; // unreachable
}

/**
 * Wolfram's generalized ζ(s, a) (see `zetaGeneralized`): the terms with Re(k+a) < 0 as
 * ((k+a)²)^(−s/2), then ζ(s, ·) from the first k with Re(k+a) ≥ 0, a zero there dropped.
 */
export function zetaGeneralizedBig(s: BigCx, a: BigCx, digits: number): BigCx | undefined {
  if (s.re.isZero() && s.im.isZero()) return hurwitzZetaBig(s, a, digits);
  const front: BigCx[] = [];
  let rest = a;
  while (rest.re.isNegative()) {
    front.push(rest);
    rest = { re: rest.re.add(1), im: rest.im };
  }
  if (rest.re.isZero() && rest.im.isZero()) rest = bigCx(1);
  const tail = hurwitzZetaBig(s, rest, digits);
  if (tail === undefined || front.length === 0) return tail;
  return atDigits(digits + GUARD_DIGITS + 10, () => {
    const negHalfS: BigCx = { re: s.re.div(-2), im: s.im.div(-2) };
    return front.reduce((acc, w) => add(acc, pow(mul(w, w), negHalfS)), tail);
  });
}
