import { ComputeEngine } from "@cortex-js/compute-engine";
import type { BoxNode } from "@enumeratio/boxes";
import { expect, test } from "vite-plus/test";
import { type Complex, complexFunction, Uncertain } from "../src/complex-eval.ts";
import { complexPlotBox } from "../src/complex-plot-box.ts";
import { renderPlot } from "../src/plot-box.ts";
import { imagesIn } from "./png.ts";

const ce = new ComputeEngine();
const fn = (json: unknown) => complexFunction(ce.box(json as never).json, "z")!;
const relative = (got: Complex, want: Complex): number =>
  Math.hypot(got[0] - want[0], got[1] - want[1]) / Math.hypot(want[0], want[1]);

// The double sum behind these loses its digits far below the real axis at large Im s (BL-351); the
// CPU path says so instead of drawing the noise. mpmath at dps 60.
test("HurwitzZeta and Zeta throw Uncertain where the double sum has cancelled its digits away", () => {
  const hurwitz = fn(["HurwitzZeta", ["Complex", 1.5, 12], "z"]);
  expect(() => hurwitz([-47.85, -7])).toThrow(Uncertain);
  expect(() => fn(["Zeta", ["Complex", 0.5, 40], "z"])([0.3, -40])).toThrow(Uncertain);
  // Cancelling by ~1e3 still holds its digits, and so does an ordinary point.
  expect(relative(hurwitz([-32.065, -1.863]), [2.957569811275495e-6, -3.141578904271494e-6])).toBeLessThan(1e-8);
  expect(() => hurwitz([2, 0])).not.toThrow();
});

test("DirichletBeta, a difference of two Hurwitz zetas, answers to its digits (mpmath at dps 40)", () => {
  const beta = fn(["DirichletBeta", "z"]);
  expect(relative(beta([1.5, 4]), [1.1314630791900349, -0.1625016057077166])).toBeLessThan(1e-10);
});

test("the portrait hatches an uncertain pixel as the shader does and leaves any other failure clear", () => {
  const hatched = complexPlotBox(
    () => {
      throw new Uncertain();
    },
    { resolution: 8 },
  );
  const [image] = imagesIn(renderPlot(hatched as BoxNode).svg);
  const reds = new Set(image!.pixels.flat().map((p) => p[0]));
  // 0.2 and 0.32 of full, in diagonal bands; opaque.
  expect([...reds].toSorted((a, b) => a - b)).toEqual([51, 82]);
  expect(image!.pixels.flat().every((p) => p[3] === 255 && p[0] === p[1] && p[1] === p[2])).toBe(true);
});
