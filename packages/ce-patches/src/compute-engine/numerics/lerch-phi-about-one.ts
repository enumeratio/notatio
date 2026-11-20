import { BigDecimal } from "@cortex-js/compute-engine";
import { bernoulliRational } from "./bernoulli-rational.ts";
import { add, atDigits, type BigCx, bigCx, exp, hurwitzZetaBig, log, mul, pow, round } from "./hurwitz-zeta-big.ts";

// Φ(z, s, a) for a z next to 1, in compute-engine's BigDecimal, to any number of digits.
//
// Erdélyi, Higher Transcendental Functions I, §1.11 (8), for |ln z| < 2π and s not a positive integer:
//
//   Φ(z, s, a) = z^(−a) [ Γ(1−s) (−ln z)^(s−1) + Σ_{k≥0} ζ(s−k, a) (ln z)^k / k! ].
//
// At s = m, a positive integer, Γ(1−s) and the term k = m−1 (ζ has its pole there) both blow up and their
// poles cancel. With s = m + ε, Γ(−(m−1)−ε) = (−1)^(m−1)/(m−1)! · (−1/ε + ψ(m) + O(ε)) (DLMF 5.7.1) and
// ζ(1+ε, a) = 1/ε − ψ(a) + O(ε) (DLMF 25.11.3), and (−L)^(m−1+ε) = (−L)^(m−1) (1 + ε ln(−L) + …), so the
// two meet at
//
//   Φ(z, m, a) = z^(−a) [ L^(m−1)/(m−1)! (ψ(m) − ψ(a) − ln(−L)) + Σ_{k≠m−1} ζ(m−k, a) L^k / k! ],  L = ln z
//
// (the limit DLMF 25.14 leaves as a pole in s; Ferreira and López 2004, "Asymptotic expansions of the Hurwitz–Lerch
// zeta function", J. Math. Anal. Appl. 298, eq. (11), has the same one). Φ(z, 1, 1) = −ln(1−z)/z checks it:
// ψ(1) − ψ(1) − ln(−L) with ζ(1−k, 1) = −B_k/k.
//
// −L and every power of it are principal, which puts a real z > 1 (−L < 0) on the lower side of its cut, as
// mpmath's lerchphi reads it. The terms fall like (|L|/2π)ᵏ times (k + |s|)ᵏ⁄ᵏ!, a ratio of at most
// |L| (2 + |s| + |a|) here, so a z within `MAX_RATIO` of that bound is the only one this reads.

/** Digits carried past the ones asked for. */
const GUARD_DIGITS = 10;

/** The most terms of the series a call sums before it declines; each is a Hurwitz ζ at the working digits. */
const MAX_TERMS = 300;

/** The most working digits a call may carry (the digits lost to a near-integer s, then the answer's own). */
const MAX_WORKING_DIGITS = 1500;

/** |L| (2 + |s| + |a|) past this does not fall fast enough for the tail bound |last|·R/(1−R). */
const MAX_RATIO = 1e-3;

/**
 * Passes a call makes, each carrying the digits the last one lost. A part that is rounding noise at one precision (the real
 * part beside 1e75 at z = 1 + 1e-30, s = −3/2, where it is 0 in the closed term) shows its own size only at the next.
 */
const MAX_ATTEMPTS = 4;

/** |s| past this (Γ(1−s) shifted up |s| times) is not worth the cost, and the call declines. */
const MAX_ORDER = 1000;

const ZERO = BigDecimal.ZERO;
const absMax = (x: BigCx): BigDecimal => (x.re.abs().gt(x.im.abs()) ? x.re.abs() : x.im.abs());
const isZeroCx = (x: BigCx): boolean => x.re.isZero() && x.im.isZero();
const neg = (x: BigCx): BigCx => ({ re: x.re.neg(), im: x.im.neg() });
const sub = (x: BigCx, y: BigCx): BigCx => add(x, neg(y));
const divInt = (x: BigCx, n: number): BigCx => ({ re: round(x.re.div(n)), im: round(x.im.div(n)) });
const recip = (x: BigCx): BigCx => {
  const d = x.re.mul(x.re).add(x.im.mul(x.im));
  return { re: round(x.re.div(d)), im: round(x.im.neg().div(d)) };
};
/** log10 of the larger part's size, −∞ for an exact zero, NaN past the double range. */
const log10Size = (x: BigCx): number => {
  const m = absMax(x);
  if (m.isZero()) return Number.NEGATIVE_INFINITY;
  const v = m.toNumber();
  return v > 0 && Number.isFinite(v) ? Math.log10(v) : Number.NaN;
};

/** ln(1 + d) for a small d, by its series, so the digits of d itself (not of 1 + d) carry through. */
function log1p(d: BigCx, working: number): BigCx | undefined {
  const floor = absMax(d).mul(new BigDecimal(`1e-${working + 3}`));
  let sum: BigCx = bigCx(0);
  let power = d;
  for (let j = 1; j <= 4 * working; j++) {
    const term = divInt(power, j);
    sum = j % 2 === 1 ? add(sum, term) : sub(sum, term);
    power = mul(power, d);
    if (absMax(power).lt(floor)) return sum;
  }
  return undefined;
}

/** B₂ⱼ as a BigDecimal at the working precision. */
const bernoulli = (j: number): BigDecimal => {
  const [n, d] = bernoulliRational(2 * j);
  return new BigDecimal(n).div(new BigDecimal(d));
};

/** w + N has this magnitude before Stirling's series is summed, enough that it reaches `digits` by 2π|w| ≥ digits·ln 10. */
const stirlingRadius = (digits: number): number => Math.ceil(0.5 * digits) + 10;

/** The shift N for which Re(w + N) reaches Stirling's radius, or undefined where it is past `MAX_ORDER`-ish. */
function shiftFor(w: BigCx, digits: number): number | undefined {
  const n = Math.max(0, Math.ceil(stirlingRadius(digits) - w.re.toNumber()));
  return Number.isFinite(n) && n <= 2 * MAX_ORDER + stirlingRadius(digits) ? n : undefined;
}

/** Γ(w) at `digits` significant digits, by the recurrence up to Stirling's radius; w is not a pole. */
function gammaBig(w: BigCx, digits: number): BigCx | undefined {
  const n = shiftFor(w, digits);
  if (n === undefined) return undefined;
  const reach = Math.hypot(w.re.toNumber(), w.im.toNumber()) + n + 2;
  // exp of ln Γ keeps digits − log10 |ln Γ|; ln Γ(x) ≈ x ln x.
  const working = digits + GUARD_DIGITS + Math.ceil(Math.log10(1 + reach * Math.log(reach)));
  return atDigits(working, () => {
    let shifted = w;
    let product: BigCx = bigCx(1);
    for (let j = 0; j < n; j++) {
      product = mul(product, shifted);
      shifted = add(shifted, bigCx(1));
    }
    // ln Γ(x) = (x − ½) ln x − x + ½ ln 2π + Σ B₂ⱼ / (2j (2j − 1) x^(2j−1))
    const logX = log(shifted);
    const twoPi = BigDecimal.atan2(ZERO, new BigDecimal(-1)).mul(2);
    let lnGamma = add(sub(mul(sub(shifted, bigCx(0.5)), logX), shifted), bigCx(twoPi.ln().div(2)));
    const inverse = recip(shifted);
    const inverseSquare = mul(inverse, inverse);
    let power = inverse;
    const floor = new BigDecimal(`1e-${working + 2}`);
    for (let j = 1; j <= working + 20; j++) {
      const term = mul(power, bigCx(bernoulli(j).div(2 * j * (2 * j - 1))));
      lnGamma = add(lnGamma, term);
      if (absMax(term).lt(floor)) {
        const value = mul(exp(lnGamma), recip(product));
        return { re: round(value.re), im: round(value.im) };
      }
      power = mul(power, inverseSquare);
    }
    return undefined;
  });
}

/** ψ(w) at `working` digits (the caller's), by the recurrence up to Stirling's radius; w is not a pole. */
function digammaBig(w: BigCx, working: number): BigCx | undefined {
  const n = shiftFor(w, working);
  if (n === undefined) return undefined;
  let shifted = w;
  let sum: BigCx = bigCx(0);
  for (let j = 0; j < n; j++) {
    sum = add(sum, recip(shifted));
    shifted = add(shifted, bigCx(1));
  }
  // ψ(x) = ln x − 1/(2x) − Σ B₂ⱼ / (2j x^(2j))
  const inverse = recip(shifted);
  const inverseSquare = mul(inverse, inverse);
  let value = sub(log(shifted), mul(inverse, bigCx(0.5)));
  let power = inverseSquare;
  const floor = new BigDecimal(`1e-${working + 2}`);
  for (let j = 1; j <= working + 20; j++) {
    const term = mul(power, bigCx(bernoulli(j).div(2 * j)));
    value = sub(value, term);
    if (absMax(term).lt(floor)) return sub(value, sum);
    power = mul(power, inverseSquare);
  }
  return undefined;
}

/**
 * ζ(−n, a) = −B_(n+1)(a)/(n+1) for a whole number n ≥ 0 (DLMF 25.11.14), B_m(a) = Σⱼ C(m, j) Bⱼ a^(m−j). It is exact at the
 * trivial zeros (ζ(−2, 1) = ζ(−2, ½) = 0), which the Euler–Maclaurin kernel reads as rounding noise and declines.
 */
function hurwitzAtNonPositiveInteger(n: number, a: BigCx): BigCx {
  const m = n + 1;
  let binomial = 1n; // C(m, j)
  let power: BigCx = bigCx(1); // a^(m−j), built from j = m down
  const powers: BigCx[] = [power];
  for (let i = 1; i <= m; i++) {
    power = mul(power, a);
    powers.push(power);
  }
  let sum: BigCx = bigCx(0);
  for (let j = 0; j <= m; j++) {
    const [num, den] = bernoulliRational(j);
    if (num !== 0n) {
      const coefficient = new BigDecimal(binomial * num).div(new BigDecimal(den));
      sum = add(sum, mul(powers[m - j]!, bigCx(coefficient)));
    }
    binomial = (binomial * BigInt(m - j)) / BigInt(j + 1);
  }
  return mul(sum, bigCx(new BigDecimal(-1).div(m)));
}

/** ζ(s − k, a): the closed form at a whole number s − k ≤ 0 for a real s, else the Euler–Maclaurin kernel. */
function hurwitzAt(s: BigCx, k: number, a: BigCx, working: number): BigCx | undefined {
  const exponent = s.re.sub(k);
  if (s.im.isZero() && exponent.isInteger() && !exponent.isPositive()) {
    return hurwitzAtNonPositiveInteger(-Number(exponent.toBigInt()), a);
  }
  return hurwitzZetaBig({ re: exponent, im: s.im }, a, working);
}

/** What one pass at a working precision gives: the value and log10 of the largest thing summed. */
interface Pass {
  readonly value: BigCx;
  readonly largest: number;
}

/**
 * One pass at `working` digits: z^(−a) times the bracket of the header. `integer` is m for s = m, else 0.
 * Undefined where a Hurwitz ζ declines, a term is past the double range, or the series is out of terms.
 */
function pass(delta: BigCx, s: BigCx, a: BigCx, integer: number, working: number): Pass | undefined {
  const L = log1p(delta, working);
  if (L === undefined) return undefined;
  const minusL = neg(L);
  const logMinusL = log(minusL);
  let sum: BigCx;
  let largest: number;
  let skip = -1;
  let lk: BigCx = bigCx(1); // Lᵏ / k!
  if (integer > 0) {
    // k = m−1 carries the limit's digamma and logarithm.
    skip = integer - 1;
    const bracketDigamma = digammaBig(bigCx(integer), working);
    const digammaA = digammaBig(a, working);
    if (bracketDigamma === undefined || digammaA === undefined) return undefined;
    for (let j = 1; j <= skip; j++) lk = divInt(mul(lk, L), j);
    const bracket = sub(sub(bracketDigamma, digammaA), logMinusL);
    sum = mul(lk, bracket);
    largest = Math.max(log10Size(mul(lk, bracketDigamma)), log10Size(mul(lk, digammaA)), log10Size(mul(lk, logMinusL)));
    lk = bigCx(1);
  } else {
    const g = gammaBig(sub(bigCx(1), s), working);
    if (g === undefined) return undefined;
    sum = mul(g, pow(minusL, sub(s, bigCx(1))));
    largest = log10Size(sum);
  }
  let small = 0;
  for (let k = 0; k < MAX_TERMS; k++) {
    if (k !== skip) {
      const h = hurwitzAt(s, k, a, working);
      if (h === undefined) return undefined;
      const term = mul(h, lk);
      sum = add(sum, term);
      largest = Math.max(largest, log10Size(term));
      // Two in a row: a ζ(s − k, a) can sit at a zero (ζ(−2, 1)), and the ratio bound makes the tail theirs times R/(1−R).
      if (absMax(term).lt(absMax(sum).mul(new BigDecimal(`1e-${working + 2}`)))) {
        if (++small === 2) {
          const value = mul(exp(mul(neg(a), L)), sum);
          return Number.isNaN(largest) ? undefined : { value, largest };
        }
      } else small = 0;
    }
    lk = divInt(mul(lk, L), k + 1);
  }
  return undefined;
}

/**
 * Φ(z, s, a) for the exact z, s and a, to `digits` significant digits in each nonzero part: the series about z = 1 of
 * the header. Undefined (a decline) for z = 1 itself, an a with no positive real part, a z whose |ln z| (2 + |s| + |a|)
 * passes `MAX_RATIO`, an |s| past `MAX_ORDER`, a series out of terms (`MAX_TERMS`), an s so near a positive integer that
 * its cancellation passes `MAX_WORKING_DIGITS`, or a Hurwitz ζ that declines.
 */
export function lerchPhiAboutOne(z: BigCx, s: BigCx, a: BigCx, digits: number): BigCx | undefined {
  if (!a.re.isPositive()) return undefined;
  const delta: BigCx = { re: z.re.sub(1), im: z.im };
  if (isZeroCx(delta)) return undefined;
  const distance = Math.hypot(delta.re.toNumber(), delta.im.toNumber());
  const order = Math.hypot(s.re.toNumber(), s.im.toNumber());
  const reach = Math.hypot(a.re.toNumber(), a.im.toNumber());
  if (!(distance > 0) || !(order <= MAX_ORDER) || !(distance * (2 + order + reach) < MAX_RATIO)) return undefined;

  // s = m, a positive integer: the limit. Near m (not at it) the two poles still cancel, and the answer keeps
  // log10(1/|s − m|) fewer digits than the terms carry.
  const m = Math.round(s.re.toNumber());
  let integer = 0;
  let extra = 0;
  if (m >= 1) {
    const offset = s.re.sub(m);
    const away = Math.hypot(offset.toNumber(), s.im.toNumber());
    if (offset.isZero() && s.im.isZero()) integer = m;
    else if (away < 1e-3) {
      if (!(away > 0)) return undefined;
      extra = Math.ceil(-Math.log10(away));
    }
  }

  let working = digits + GUARD_DIGITS + extra;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (working > MAX_WORKING_DIGITS) return undefined;
    const r = atDigits(working, () => pass(delta, s, a, integer, working));
    if (r === undefined) return undefined;
    // The digits the sum cancelled, and those the smaller part of the answer keeps relative to its own size.
    const size = log10Size(r.value);
    if (Number.isNaN(size)) return undefined;
    const cancelled = Math.max(0, r.largest - size);
    const [x, y] = [r.value.re.abs(), r.value.im.abs()];
    let partLoss = 0;
    if (!x.isZero() && !y.isZero()) {
      const ratio = (x.lt(y) ? x.div(y) : y.div(x)).toNumber();
      partLoss = ratio > 0 ? Math.ceil(-Math.log10(ratio)) : Number.POSITIVE_INFINITY;
    }
    const lost = Math.ceil(cancelled) + partLoss;
    if (working - lost >= digits + GUARD_DIGITS / 2) return r.value;
    if (!Number.isFinite(lost)) return undefined;
    working += lost;
  }
  return undefined;
}
