import { expect, test } from "vite-plus/test";
import { DF_OPAQUE_GLSL, DF_PLAIN_GLSL } from "@notatio/analytic/shader";
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

test("a host gets the shader for its device's verdict: plain, opaque two-sums, or df64 off", () => {
  const on = portraitShader("hurwitz(vec2(1.5, 4.0), z)");
  expect(on).toContain("const bool DF64 = true;");
  expect(on).toContain(DF_PLAIN_GLSL);
  expect(on).toContain("dfOne = prm.one;");
  const opaque = portraitShader("hurwitz(vec2(1.5, 4.0), z)", "opaque");
  expect(opaque).toContain(DF_OPAQUE_GLSL);
  expect(opaque).not.toContain(DF_PLAIN_GLSL);
  const off = portraitShader("hurwitz(vec2(1.5, 4.0), z)", "off");
  expect(off).toContain("const bool DF64 = false;");
  expect(off).not.toContain("const bool DF64 = true;");
  expect(complexComputeShader("z", "hurwitz(vec2(1.5, 4.0), z)", "off")).toContain("const bool DF64 = false;");
});

test("a shader is GLSL ES 3.00 with the library declared before the host that calls it", () => {
  const shader = portraitShader("hurwitz(vec2(1.5, 4.0), z)");
  expect(shader.startsWith("#version 300 es\nprecision highp float;")).toBe(true);
  expect(shader.indexOf("vec2 hurwitz(")).toBeGreaterThan(-1);
  expect(shader.indexOf("vec2 hurwitz(")).toBeLessThan(shader.indexOf("void main()"));
});
