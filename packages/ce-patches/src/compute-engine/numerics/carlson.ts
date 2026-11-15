import { abs, add, type Cx, cpow, csqrt, cx, mul, scale, sub } from "./complex-arithmetic.ts";

// Carlson's symmetric elliptic integrals R_F and R_D (DLMF 19.16, 19.36) at complex arguments, by
// the duplication theorem (Carlson 1995). The square roots are principal, so an argument on the
// negative reals takes its value from above.

const MAX_ITERS = 100;
const TOL = 1e-15;

/** Are all the values within `TOL` of their mean, i.e. has the duplication converged? */
function converged(...values: Cx[]): boolean {
  const mu = scale(values.reduce(add), 1 / values.length);
  const size = abs(mu) || 1;
  return values.every((v) => abs(sub(v, mu)) <= TOL * size);
}

/** The duplication step λ = √x√y + √y√z + √z√x. */
const lambda = (sx: Cx, sy: Cx, sz: Cx): Cx => add(add(mul(sx, sy), mul(sy, sz)), mul(sz, sx));

/** R_F(x, y, z) = ½∫₀^∞ dt / √((t+x)(t+y)(t+z)), or undefined where the duplication does not converge. */
export function carlsonRF(x0: Cx, y0: Cx, z0: Cx): Cx | undefined {
  let [x, y, z] = [x0, y0, z0];
  let steps = 0;
  while (!converged(x, y, z)) {
    if (++steps > MAX_ITERS) return undefined;
    const lam = lambda(csqrt(x), csqrt(y), csqrt(z));
    x = scale(add(x, lam), 0.25);
    y = scale(add(y, lam), 0.25);
    z = scale(add(z, lam), 0.25);
  }
  return cpow(scale(add(add(x, y), z), 1 / 3), cx(-0.5));
}

/**
 * R_D(x, y, z) = (3/2)∫₀^∞ dt / [(t+z)√((t+x)(t+y)(t+z))], or undefined where the duplication does
 * not converge. `sqrtZ` is √z when the caller holds it more exactly than `z` (a z below the double
 * range is 0, whose √ would lose the factor 1/√z that R_D grows by).
 */
export function carlsonRD(x0: Cx, y0: Cx, z0: Cx, sqrtZ?: Cx): Cx | undefined {
  let [x, y, z] = [x0, y0, z0];
  let sum = cx(0);
  let fac = 1;
  let steps = 0;
  while (!converged(x, y, z)) {
    if (++steps > MAX_ITERS) return undefined;
    const sz = steps === 1 && sqrtZ !== undefined ? sqrtZ : csqrt(z);
    const lam = lambda(csqrt(x), csqrt(y), sz);
    const denominator = mul(sz, add(z, lam));
    if (denominator.re === 0 && denominator.im === 0) return undefined;
    sum = add(sum, scale(reciprocal(denominator), 3 * fac));
    fac *= 0.25;
    x = scale(add(x, lam), 0.25);
    y = scale(add(y, lam), 0.25);
    z = scale(add(z, lam), 0.25);
  }
  const mu = scale(add(add(x, y), z), 1 / 3);
  return add(sum, scale(cpow(mu, cx(-1.5)), fac));
}

/** 1/w without squaring a component, which underflows for |w| near 1e-160. */
function reciprocal(w: Cx): Cx {
  if (Math.abs(w.re) >= Math.abs(w.im)) {
    const r = w.im / w.re;
    const d = w.re + w.im * r;
    return { re: 1 / d, im: -r / d };
  }
  const r = w.re / w.im;
  const d = w.re * r + w.im;
  return { re: r / d, im: -1 / d };
}
