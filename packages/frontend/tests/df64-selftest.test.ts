import { expect, test } from "vite-plus/test";
import { df64Exact } from "../src/df64-selftest.ts";
import { portraitShader } from "../src/complex-plot.ts";
import { complexComputeShader } from "../src/gpu-eval.ts";

// What the self-test shader writes for exact arithmetic, and what a compiler that folds (a + b) - a gives.
const de = Math.fround(Math.fround(1.3) * Math.fround(0.7));
const exact = [
  1,
  Math.fround(1e-8),
  1 + 2 ** -11,
  2 ** -24,
  Math.fround(1e-8),
  1 + 2 ** -11,
  2 ** -24,
  Math.fround(Math.fround(1.3) * Math.fround(0.7) - de),
];

test("the df64 self-test accepts exact error-free transforms and rejects any that collapsed to f32", () => {
  expect(df64Exact(exact)).toBe(true);
  for (let i = 0; i < exact.length; i++) {
    const broken = exact.slice();
    broken[i] = 0;
    expect(df64Exact(broken), `output ${i} zero`).toBe(false);
  }
  expect(df64Exact([1, 0, 1 + 2 ** -11, 0, 0, 1 + 2 ** -11, 0, 0])).toBe(false);
});

test("a host gets the shader for its device's verdict: fma two-products, Dekker's split, or df64 off", () => {
  const on = portraitShader("hurwitz(vec2f(1.5, 4.0), z)");
  expect(on).toContain("const DF64: bool = true;");
  expect(on).toContain("const DF_FMA: bool = true;");
  expect(on).toContain("dfOne = prm.one;");
  const split = portraitShader("hurwitz(vec2f(1.5, 4.0), z)", "split");
  expect(split).toContain("const DF64: bool = true;");
  expect(split).toContain("const DF_FMA: bool = false;");
  const off = portraitShader("hurwitz(vec2f(1.5, 4.0), z)", "off");
  expect(off).toContain("const DF64: bool = false;");
  expect(off).not.toContain("const DF64: bool = true;");
  expect(complexComputeShader("z", "hurwitz(vec2f(1.5, 4.0), z)", "off")).toContain("const DF64: bool = false;");
});
