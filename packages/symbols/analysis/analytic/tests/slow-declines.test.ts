// unstable: a bare engine to declare the analytic library against
import { ComputeEngine } from "@notatio/engine/unstable";
import { expect, test } from "vite-plus/test";
import { declareAnalytic } from "../src/declare.ts";

// A call the numeric kernels decline is declined from its argument, before any summing: ζ at
// |Im s| = 1.74e6 plans 3.4e5 direct terms (past the term budget, 7 s to sum), and Z(iy) has an
// exactly zero part that no working precision settles (2 s of passes before the cap).

const ce = new ComputeEngine();
declareAnalytic(ce);

const zeta = (re: number) => ["Zeta", ["Complex", re, 1.74e6]];

test("Zeta past the term budget stays unevaluated on evaluate, N and the parse route", () => {
  const started = performance.now();
  for (const re of [1e-12, 0.5, 2, -1]) {
    const call = zeta(re);
    expect(ce.box(call as never).evaluate().operator).toBe("Zeta");
    expect(ce.box(call as never).N().operator).toBe("Zeta");
    expect(ce.box(["N", call] as never).evaluate().operator).toBe("Zeta");
    expect(ce.parse(`\\zeta\\left(${re}+1740000i\\right)`).N().operator).toBe("Zeta");
  }
  expect(performance.now() - started).toBeLessThan(1000);
});

test("Zeta under the term budget still answers, to mpmath's digits", () => {
  // mpmath zeta(1e-12 + 1e5 i) at 40 digits: -142.0755893073796 + 199.3064107133090 i.
  const value = ce.box(["Zeta", ["Complex", 1e-12, 1e5]]).N();
  expect(value.re).toBeCloseTo(-142.07558930737957, 12);
  expect(value.im).toBeCloseTo(199.306410713309, 12);
});

test("RiemannSiegelZ at a purely imaginary argument stays unevaluated past a double's digits, at once", () => {
  const started = performance.now();
  for (const digits of [20, 50]) {
    for (const im of [1e-12, 0.3, 1]) {
      const call = ["RiemannSiegelZ", ["Complex", 0, im]];
      expect(ce.box(["N", call, digits] as never).evaluate().operator).toBe("RiemannSiegelZ");
    }
  }
  expect(performance.now() - started).toBeLessThan(1000);
  // Off the imaginary axis it still answers.
  expect(ce.box(["N", ["RiemannSiegelZ", ["Complex", 1e-12, 1e-12]], 20] as never).evaluate().operator).toBe("Complex");
});
