import { ComputeEngine } from "@cortex-js/compute-engine";
import { JavaScriptTarget } from "@cortex-js/compute-engine/compile";
import { expect, test } from "vite-plus/test";
import { ellipticFarFromReal, LARGE_IMAGINARY } from "../src/compute-engine/numerics/elliptic-incomplete.ts";
import { applyPatch, ellipticOverflow } from "../src/index.ts";

// F(φ|m) and E(φ|m) at |Im φ| ≥ 100 against mpmath 1.3.0 (`ellipf`, `ellipe` at 40 digits). Native's
// Carlson forms overflow there: F from |Im φ| near 355, E from near 236, and at some points
// native's answer is 0 or ComplexInfinity where the integral is finite.

const ce = new ComputeEngine();
applyPatch(ce, ellipticOverflow);
const native = new ComputeEngine();

// [head, Re φ, Im φ, Re m, Im m, Re value, Im value]
const POINTS: [string, number, number, number, number, number, number][] = [
  ["F", 0.3, 400, 0.5, 0, 7.573050564797153e-45, 1.8540746773013719],
  ["F", 0, 355, 2, 0, 0.0, 1.3110287771460598],
  ["F", 0.3, -1000, -2, 0, 1.17142008414677, -1.0010773804561062],
  ["F", -1, 400, -2, 0, -1.17142008414677, 1.0010773804561062],
  ["F", 10, 700, 0.5, 0.3, 10.9256007995458, 3.1385820519293466],
  ["F", 2, 10000, 0.9, 0, 5.156184226696347, 1.6124413487202194],
  ["F", 1.5707963267948966, 150, 0.5, 0.3, 0.2258826146294364, 1.783286364152728],
  ["F", 4.71238898038469, -120, 0.5, 0, 3.7081493546027438, -1.8540746773013719],
  ["E", 0.3, 300, 0.5, 0, 2.0294892688728802e129, 6.560787076956092e129],
  ["E", 2, 400, -2, 0, 1.5364709767568244e173, 3.357250332958024e173],
  ["E", 10, -700, 0.9, 0, 2.6172447919413532e303, -4.036710240805701e303],
  ["E", 1.2, 200, 0.5, 0.3, 2.2112440414169254e86, 1.6498286076589977e86],
  ["E", 3.5, 355, 1.5, -0.2, 3.787921451938061e153, 8.37662457086319e153],
  ["E", -1, 236, 1, 0, -1.3107108030107863e102, 8.41597728238583e101],
  ["E", 0.3, 150, 2, 0, 2.9123560561340374e64, 9.414855387331352e64],
];

const call = (engine: ComputeEngine, head: string, re: number, im: number, mr: number, mi: number) =>
  engine.box([`Elliptic${head}`, ["Complex", re, im], mi === 0 ? mr : ["Complex", mr, mi]] as never);

const relative = (got: { re: number; im: number }, re: number, im: number) =>
  Math.hypot(got.re - re, got.im - im) / Math.hypot(re, im);

test("a φ far from the real axis agrees with mpmath, never ∞", () => {
  for (const [head, a, t, mr, mi, re, im] of POINTS) {
    const where = `${head} ${a}+${t}i | ${mr}+${mi}i`;
    const call_ = call(ce, head, a, t, mr, mi);
    // `evaluate` of exact operands stays symbolic; a float operand asks for a number.
    const floats = [a, t, mr, mi].some((x) => !Number.isInteger(x));
    for (const value of floats ? [call_.evaluate(), call_.N()] : [call_.N()]) {
      expect(Number.isFinite(value.re) && Number.isFinite(value.im), where).toBe(true);
      expect(relative(value, re, im), where).toBeLessThan(1e-12);
    }
  }
});

test("native overflows at these points, which is what the patch fixes", () => {
  expect(call(native, "F", 0.3, 400, 0.5, 0).N().toString()).toBe("~oo");
  expect(call(native, "F", 0, 355, 2, 0).N().im).toBe(0);
  expect(call(native, "E", 0.3, 300, 0.5, 0).N().toString()).toBe("~oo");
});

test("below the height where native overflows, native answers", () => {
  expect(ellipticFarFromReal("F", { re: 0.3, im: LARGE_IMAGINARY - 1 }, { re: 0.5, im: 0 })).toBeUndefined();
  const [a, b] = [call(ce, "F", 0.3, 50, 0.5, 0.2).N(), call(native, "F", 0.3, 50, 0.5, 0.2).N()];
  expect([a.re, a.im]).toEqual([b.re, b.im]);
});

test("F(φ|0) and E(φ|0) are φ at any height (native is ∞ from Im φ = −50)", () => {
  for (const head of ["F", "E"]) {
    const value = call(ce, head, 0.3, -50, 0, 0).N();
    expect(relative(value, 0.3, -50)).toBeLessThan(1e-15);
  }
});

test("a value past the double range, or a precision past a double's, declines rather than answering ∞", () => {
  expect(call(ce, "E", 0.3, 800, 0.5, 0).N().operator).toBe("EllipticE");
  const precise = ce.box(["N", ["EllipticF", ["Complex", 0.3, 400], ["Rational", 1, 2]], 30] as never).evaluate();
  expect(precise.operator).toBe("EllipticF");
});

test("the JavaScript lowering stays native's real-only one", () => {
  const compiled = new JavaScriptTarget().compile(ce.box(["EllipticF", "x", "y"] as never)) as {
    run: (vars: Record<string, number>) => number;
  };
  expect(compiled.run({ x: 0.3, y: 0.5 })).toBeCloseTo(0.3022546685750176, 14);
});
