import { expect, test } from "vite-plus/test";
import {
  cx,
  type Cx,
  dirichletL,
  dirichletLChecked,
  hurwitzZetaWithError,
  MAX_RELATIVE_ERROR,
  zetaGeneralizedWithError,
} from "../src/index.ts";

const relative = (got: { re: number; im: number }, want: { re: number; im: number }): number =>
  Math.hypot(got.re - want.re, got.im - want.im) / Math.hypot(want.re, want.im);

// mpmath.zeta at dps 60, the point BL-350 declines.
const WANT_BAD = cx(-2.611574719192654e-18, -1.210324925299614e-18);

test("the absolute error estimate covers the actual error and says a cancelled sum cannot be vouched for", () => {
  const bad = hurwitzZetaWithError(cx(1.5, 12), cx(-47.85, -7));
  expect(Math.hypot(bad.value.re - WANT_BAD.re, bad.value.im - WANT_BAD.im)).toBeLessThan(bad.error);
  expect(bad.error).toBeGreaterThan(MAX_RELATIVE_ERROR * Math.hypot(WANT_BAD.re, WANT_BAD.im));
  // A sum without cancellation is good to its digits.
  const clean = hurwitzZetaWithError(cx(3, 2), cx(1.5, 0));
  expect(clean.error).toBeLessThan(1e-12 * Math.hypot(clean.value.re, clean.value.im));
});

// mpmath.zeta(1/2 + it) at dps 50. At a = 1 on the critical line (Riemann–Siegel's input) the sum has no
// cancellation: its absolute error stays below 1e-9, the scale a root-finder needs, up to t = 1000.
test("zeta on the critical line carries an absolute error below 1e-9 and holds it", () => {
  const want: [number, Cx][] = [
    [10, cx(1.5448952202967527, -0.11533646527127338)],
    [100, cx(2.692619885681324, -0.020386029602598162)],
    [400, cx(0.04146321761783724, 0.0891065753239292)],
    [1000, cx(0.35633436719439604, 0.9319978312329936)],
  ];
  for (const [t, z] of want) {
    const got = zetaGeneralizedWithError(cx(0.5, t), cx(1));
    expect(got.error, `t = ${t}`).toBeLessThan(1e-9);
    expect(Math.hypot(got.value.re - z.re, got.value.im - z.im), `t = ${t}`).toBeLessThan(got.error);
  }
});

// Dirichlet L(s, χ) = k^(−s) Σ χ(r) ζ(s, r/k); mpmath at dps 50 with the kernel's own characters.
test("dirichletLChecked answers where the Hurwitz sums behind it hold their digits", () => {
  const cases: [number, number, Cx, Cx][] = [
    [13, 5, cx(-2.5, 24), cx(-20540.165306557636, 119049.60385380287)],
    [24, 3, cx(0.5, 12), cx(0.646817999042702, -0.6226921909172416)],
    [97, 10, cx(-10, 60), cx(-3.8600618218391347e30, -1.440693001910117e31)],
    [5, 2, cx(1.5, 24), cx(0.6428168290755605, -0.19904434387188655)],
  ];
  for (const [k, j, s, want] of cases) {
    const got = dirichletLChecked(k, j, s)!;
    expect(got, `L(${k}, ${j}) at ${s.re}+${s.im}i`).toBeDefined();
    expect(relative(got, want)).toBeLessThan(1e-9);
  }
});

test("dirichletLChecked declines where the character sum cancels the Hurwitz values' digits away", () => {
  // Unchecked, these carry relative errors of 1.5e-7, 5e35 and 4e35.
  for (const [k, j, s] of [
    [97, 10, cx(-2.5, 60)],
    [13, 5, cx(-2.5, 100)],
    [97, 10, cx(-2.5, 100)],
  ] as const) {
    expect(dirichletLChecked(k, j, s), `L(${k}, ${j}) at ${s.re}+${s.im}i`).toBeUndefined();
    expect(dirichletL(k, j, s)).toBeDefined();
  }
});
