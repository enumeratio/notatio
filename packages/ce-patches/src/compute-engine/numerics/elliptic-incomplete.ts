import { carlsonRD, carlsonRF } from "./carlson.ts";
import { type Cx, cexp, cx, mul, scale, sub } from "./complex-arithmetic.ts";

// The incomplete Legendre integrals F(φ|m) = ∫₀^φ dθ/√(1 − m sin²θ) and
// E(φ|m) = ∫₀^φ √(1 − m sin²θ) dθ (the parameter m = k²) at a φ far from the real axis, through the
// Carlson forms compute-engine uses (DLMF 19.25.5, 19.25.9), with s = sin φ and c = cos φ:
//   F = s·R_F(c², Y, 1),   E = s·R_F(c², Y, 1) − (m/3)·s³·R_D(c², Y, 1),   Y = 1 − m s².
// There c² and s³ leave the double range at |Im φ| near 355 and 236, though F is bounded and E grows
// only like e^|Im φ|. For Im φ = t > 0 write c = eᵗ·ĉ and s = eᵗ·ŝ with ĉ, ŝ of size 1, and scale the
// arguments by the positive real λ = e^(−2t) (R_F has degree −½, R_D −3/2, so no branch is crossed):
//   F = ŝ·R_F(ĉ², Ŷ, λ),   E = ŝ·R_F(ĉ², Ŷ, λ) − (m/3)·ŝ³·R_D(ĉ², Ŷ, λ),   Ŷ = λ − m ŝ².
// The arguments keep the phases native's carry, so both agree on every branch cut. R_D grows like
// 1/√λ = eᵗ, so its first step takes √λ = e^(−t) exactly, which stays a double up to t ≈ 745.

/** Below this |Im φ| native's own kernel does not overflow, and it answers. */
export const LARGE_IMAGINARY = 100;

/** Past this Im φ, eᴵᵐᶲ no longer fits a double, and neither does E. */
const MAX_IMAGINARY_FOR_E = 709;

/** π − Math.PI: the double's shortfall, which decides which side of an odd multiple of π/2 a double is on. */
const PI_LOW = 1.2246467991473532e-16;

/**
 * Re φ reduced into [−π/2, π/2] by the multiple k of π taken off it (DLMF 19.2.10). A Re φ on an odd
 * multiple of π/2 is on a branch cut; a double there is on the side the true π puts it, as
 * mpmath's reduction does, not where the rounded π ties.
 */
function reduce(phi: Cx): { phi: Cx; k: number } {
  const shifted = (k: number) => phi.re - k * Math.PI - k * PI_LOW;
  let k = Math.round(phi.re / Math.PI);
  let re = shifted(k);
  if (Math.abs(re) > Math.PI / 2 + PI_LOW / 2) {
    k += Math.sign(re);
    re = shifted(k);
  }
  return { phi: cx(re, phi.im), k };
}

const negate = <T extends Cx | undefined>(x: T): T => (x === undefined ? x : ({ re: -x.re, im: -x.im } as T));

/** The complete K(m), or undefined at m = 1 where it diverges. */
export function completeK(m: Cx): Cx | undefined {
  if (m.re === 1 && m.im === 0) return undefined;
  return carlsonRF(cx(0), sub(cx(1), m), cx(1));
}

/** The complete E(m) = K(m) − (m/3)·R_D(0, 1 − m, 1), with E(1) = 1. */
export function completeE(m: Cx): Cx | undefined {
  if (m.re === 1 && m.im === 0) return cx(1);
  const oneMinusM = sub(cx(1), m);
  const rf = carlsonRF(cx(0), oneMinusM, cx(1));
  const rd = carlsonRD(cx(0), oneMinusM, cx(1));
  if (rf === undefined || rd === undefined) return undefined;
  return sub(rf, scale(mul(m, rd), 1 / 3));
}

/** F or E at Im φ > 0 with Re φ in [−π/2, π/2], from the scaled arguments above. */
function base(phi: Cx, m: Cx, withE: boolean): Cx | undefined {
  const t = phi.im;
  const w = cexp({ re: -2 * t, im: 2 * phi.re }); // e^(2iφ), below 1
  const p = cexp({ re: 0, im: -phi.re }); // e^(−iφ) without its size eᵗ
  const chat = scale(mul(p, { re: 1 + w.re, im: w.im }), 0.5);
  const shat = scale(mul(mul({ re: 0, im: 1 }, p), { re: 1 - w.re, im: -w.im }), 0.5);
  const lambda = cx(Math.exp(-2 * t));
  const y = sub(lambda, mul(m, mul(shat, shat)));
  const x = mul(chat, chat);
  const rf = carlsonRF(x, y, lambda);
  if (rf === undefined) return undefined;
  const f = mul(shat, rf);
  if (!withE) return f;
  const sqrtLambda = Math.exp(-t);
  if (t > MAX_IMAGINARY_FOR_E || sqrtLambda === 0) return undefined;
  const rd = carlsonRD(x, y, lambda, cx(sqrtLambda));
  if (rd === undefined) return undefined;
  return sub(f, scale(mul(mul(m, mul(shat, mul(shat, shat))), rd), 1 / 3));
}

/**
 * F(φ|m) or E(φ|m) at |Im φ| ≥ `LARGE_IMAGINARY`, or undefined where the answer is not finite or
 * the kernel cannot vouch for it. Re φ is reduced by the quasi-periodicity F(φ + kπ) = F(φ) + 2k·K(m)
 * and E(φ + kπ) = E(φ) + 2k·E(m), and Im φ < 0 by oddness. F(φ|0) = E(φ|0) = φ.
 */
export function ellipticFarFromReal(kind: "F" | "E", phi: Cx, m: Cx): Cx | undefined {
  if (Math.abs(phi.im) < LARGE_IMAGINARY) return undefined;
  if (m.re === 0 && m.im === 0) return phi;
  const { phi: reduced, k } = reduce(phi);
  const withE = kind === "E";
  const value = reduced.im > 0 ? base(reduced, m, withE) : negate(base(negate(reduced), m, withE));
  if (value === undefined) return undefined;
  let result = value;
  if (k !== 0) {
    const complete = withE ? completeE(m) : completeK(m);
    if (complete === undefined) return undefined;
    result = { re: value.re + 2 * k * complete.re, im: value.im + 2 * k * complete.im };
  }
  return Number.isFinite(result.re) && Number.isFinite(result.im) ? result : undefined;
}
