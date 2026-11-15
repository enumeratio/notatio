import { BigDecimal } from "@notatio/engine";
import {
  type BigCx,
  atDigits,
  bernoulliRational,
  bigCx,
  bigDiv,
  bigExp,
  bigMul,
  bigRound,
  cx,
  type Cx,
  exactDouble,
} from "@notatio/ce-patches";

// G_k(τ) = 2ζ(k) + 2(2πi)^k/(k−1)! · Σ_{n≥1} σ_{k−1}(n) qⁿ, q = e^{2πiτ}, for even k ≥ 4 (DLMF 23.17,
// with 2ζ(k) = |B_k|(2π)^k/k!), so
//   G_k = (2π)^k/(k−1)! · ( |B_k|/k − 2s·S ),  s = (−1)^{k/2+1} = sign B_k,  S = Σ σ_{k−1}(n) qⁿ.
//
// compute-engine's native EisensteinE stops its q-series on |q|ⁿ alone, but σ_{k−1}(n) grows like
// n^{k−1}: terms rise until n ≈ (k−1)/(2π Im τ) and the native sum stops well before that (k = 50 at
// τ = 0.4 + 0.87i is off by 9e-9, k = 100 off by 0.14 and 20.7 at two points of the fundamental
// domain). This sum runs in BigDecimal, with the reduction to the fundamental domain done there too,
// and stops only when a rigorous tail bound is below the target relative to the sum.

/** Working digits: the sum's cancellation and its rounding stay far below a double's 16. */
const WORKING_DIGITS = 60;
/** The tail is held below 10^-TARGET_DIGITS of the sum, well under a double's last place. */
const TARGET_DIGITS = 25;
/** The target is relative to max(|sum|, FLOOR·|n = 0 term|): where G_k has a zero the sum is
 * the cancellation of larger terms and a relative target would never be met. */
const CANCELLATION_FLOOR = 1e-12;
/** The most q-terms summed; past it (k near the cap at Im τ = √3/2 needs about 300) the kernel declines. */
const MAX_TERMS = 2000;
/** The last few terms must also be falling before the tail bound is trusted. */
const MIN_FALLING_TERMS = 3;
/** ζ(k − 1) ≤ ζ(3) bounds σ_{k−1}(n) ≤ ζ(k−1)·n^{k−1} for k ≥ 4, with a unit of slack. */
const ZETA_BOUND = 1.21;
const REDUCE_EPS = 1e-12;
const MAX_REDUCE_STEPS = 200;

const bigOf = (n: bigint): BigDecimal => new BigDecimal(n.toString());
const lnOf = (x: BigDecimal): number => (x.isZero() ? -Infinity : x.ln().toNumber());
const modulus = (z: BigCx): BigDecimal => z.re.mul(z.re).add(z.im.mul(z.im)).sqrt();

/** σ_{k−1}(n) exactly, from the divisors up to √n; `powers` caches d^{k−1}. */
function sigma(n: number, k: number, powers: Map<number, bigint>): bigint {
  const power = (d: number): bigint => {
    let p = powers.get(d);
    if (p === undefined) powers.set(d, (p = BigInt(d) ** BigInt(k - 1)));
    return p;
  };
  let sum = 0n;
  for (let d = 1; d * d <= n; d++) {
    if (n % d !== 0) continue;
    sum += power(d);
    if (d * d !== n) sum += power(n / d);
  }
  return sum;
}

/** z^k for an integer k ≥ 1 by repeated squaring. */
function bigIntPow(z: BigCx, k: number): BigCx {
  let result = bigCx(1);
  let base = z;
  for (let e = k; e > 0; e >>= 1) {
    if (e & 1) result = bigMul(result, base);
    base = bigMul(base, base);
  }
  return result;
}

/**
 * Whether Σ_{m>N} 2·ζ(k−1)·m^{k−1}·r^m is below `ln(limit)`. With u_m = m^{k−1} r^m the ratio
 * u_{m+1}/u_m = (1 + 1/m)^{k−1} r falls as m grows, so once it is below 1 at m = N + 1 the tail
 * is at most u_{N+1}/(1 − that ratio).
 */
function tailBelow(k: number, lnR: number, n: number, lnLimit: number): boolean {
  const lnRatio = (k - 1) * Math.log1p(1 / (n + 1)) + lnR;
  if (!(lnRatio < 0)) return false;
  const lnTail = Math.log(2 * ZETA_BOUND) + (k - 1) * Math.log(n + 1) + (n + 1) * lnR - Math.log1p(-Math.exp(lnRatio));
  return lnTail < lnLimit;
}

export interface EisensteinGValue {
  readonly value: Cx;
  /** The rounding error in `value`, absolute: the working digits' worth of the largest term. */
  readonly noise: number;
}

/**
 * G_k(τ) for even k in [4, ~400] and Im τ > 0 as a double pair, or `undefined` where the series would
 * need more than `MAX_TERMS` terms (the caller declines). The reduction to the fundamental domain
 * (T: τ → τ − round(Re τ), S: τ → −1/τ, with G_k(τ) = G_k(−1/τ)/τ^k undone step by step) is exact in
 * BigDecimal on the double the caller passed.
 */
export function eisensteinGBig(k: number, tauRe: number, tauIm: number): EisensteinGValue | undefined {
  return atDigits(WORKING_DIGITS, (): EisensteinGValue | undefined => {
    const pi = BigDecimal.PI;
    let tau = bigCx(exactDouble(tauRe), exactDouble(tauIm));
    const pre: BigCx[] = [];
    for (let i = 0; i < MAX_REDUCE_STEPS; i++) {
      const shift = Math.round(tau.re.toNumber());
      if (shift !== 0) tau = { re: tau.re.sub(shift), im: tau.im };
      if (Math.hypot(tau.re.toNumber(), tau.im.toNumber()) >= 1 - REDUCE_EPS) break;
      pre.push(tau);
      const norm = tau.re.mul(tau.re).add(tau.im.mul(tau.im));
      tau = { re: bigRound(tau.re.neg().div(norm)), im: bigRound(tau.im.div(norm)) };
    }
    if (!(tau.im.toNumber() > 0)) return undefined;

    const q = bigExp({ re: bigRound(tau.im.mul(pi).mul(2).neg()), im: bigRound(tau.re.mul(pi).mul(2)) });
    const lnR = lnOf(modulus(q));
    const [bn, bd] = bernoulliRational(k);
    const sign = bn < 0n ? -1 : 1;
    const absB = bigOf(bn < 0n ? -bn : bn).div(bigOf(bd));
    const lead = absB.div(k); // |B_k|/k, the n = 0 term of the bracket

    // bracket = |B_k|/k − 2s·S, summed term by term
    let sum: BigCx = { re: BigDecimal.ZERO, im: BigDecimal.ZERO };
    let qn: BigCx = bigCx(1);
    const powers = new Map<number, bigint>();
    let lnLargest = lnOf(lead);
    let falling = 0;
    let prevLn = Infinity;
    let done = false;
    for (let n = 1; n <= MAX_TERMS && !done; n++) {
      qn = bigMul(qn, q);
      const term = bigOf(sigma(n, k, powers));
      sum = { re: bigRound(sum.re.add(term.mul(qn.re))), im: bigRound(sum.im.add(term.mul(qn.im))) };
      const lnTerm = lnOf(term) + n * lnR;
      lnLargest = Math.max(lnLargest, lnTerm);
      falling = lnTerm < prevLn ? falling + 1 : 0;
      prevLn = lnTerm;
      if (falling < MIN_FALLING_TERMS) continue;
      const bracket: BigCx = { re: lead.sub(sum.re.mul(2 * sign)), im: sum.im.mul(-2 * sign) };
      const lnBracket = Math.max(lnOf(modulus(bracket)), lnOf(lead) + Math.log(CANCELLATION_FLOOR));
      done = tailBelow(k, lnR, n, lnBracket - TARGET_DIGITS * Math.LN10);
    }
    if (!done) return undefined;

    // G = (2π)^k/(k−1)! · bracket, then each S step divides by its τ^k
    let factorial = 1n;
    for (let i = 2n; i < BigInt(k); i++) factorial *= i;
    const factor = bigRound(pi.mul(2).pow(k)).div(bigOf(factorial));
    const bracket: BigCx = { re: lead.sub(sum.re.mul(2 * sign)), im: sum.im.mul(-2 * sign) };
    let value: BigCx = { re: bigRound(bracket.re.mul(factor)), im: bigRound(bracket.im.mul(factor)) };
    let lnNoise = lnLargest + lnOf(factor) - WORKING_DIGITS * Math.LN10 + Math.log(MAX_TERMS);
    for (let i = pre.length - 1; i >= 0; i--) {
      const tauK = bigIntPow(pre[i]!, k);
      value = bigDiv(value, tauK);
      lnNoise -= lnOf(modulus(tauK));
    }
    const out = cx(value.re.toNumber(), value.im.toNumber());
    if (!Number.isFinite(out.re) || !Number.isFinite(out.im)) return undefined;
    return { value: out, noise: Math.exp(lnNoise) };
  });
}
