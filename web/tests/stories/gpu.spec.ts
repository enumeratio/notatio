// WebGPU portraits, read back as pixels (gpu-support.ts). Run with playwright.gpu.config.ts under
// `xvfb-run -a`; SwiftShader draws the frames. Thresholds are set from what the portraits measure
// there: the least colored portrait on these pages has 33% saturated pixels and 8 hue sectors.
// The zeta surface and the Im a < 0 half of the zeta portrait belong to the plots spec.

import { readFileSync } from "node:fs";
import type { Locator } from "@playwright/test";
import { expect, test } from "@playwright/test";
import {
  emitComplexWGSL,
  type Json,
} from "../../../packages/ce-patches/src/compute-engine/compilation/wgsl-complex.ts";
import { reachableWGSL, zetaWGSL } from "../../../packages/symbols/analysis/analytic/src/shader.ts";
import {
  colorAt,
  evalComplexOnGpu,
  installCapture,
  mirrorMatch,
  paintedStats,
  readCanvas,
  repaintedStats,
} from "./gpu-support.ts";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(installCapture);
});

/** Share of the saturated pixels in the red sectors (hue within 30 degrees of 0, either side). */
const red = (sectors: number[]) => sectors[0] + sectors[11];

for (const path of ["/explore/lerchphi/", "/explore/polylog/", "/explore/zeta/phase-portrait"]) {
  test(`every portrait on ${path} is drawn in color and in many hues`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto(path);
    const canvases = page.locator("notatio-complex-plot canvas");
    await expect(canvases.first()).toBeVisible();
    for (let i = 0; i < (await canvases.count()); i++) {
      const stats = await paintedStats(canvases.nth(i));
      expect(stats.colored, `portrait ${i} saturated share`).toBeGreaterThan(0.25);
      expect(stats.hues, `portrait ${i} hue sectors`).toBeGreaterThanOrEqual(6);
    }
    expect(errors).toEqual([]);
  });
}

test.describe("the Lerch portrait", () => {
  const dial = (page: import("@playwright/test").Page, name: string) => page.locator(`slider-box[name=${name}] input`);

  async function setDial(page: import("@playwright/test").Page, canvas: Locator, name: string, value: string) {
    const before = (await readCanvas(canvas))!.frame;
    await dial(page, name).fill(value);
    return repaintedStats(canvas, before);
  }

  test("is the unit disk, goes one hue at large Re s, shifts with a, and comes back", async ({ page }) => {
    await page.goto("/explore/lerchphi/");
    const canvas = page.locator("notatio-complex-plot canvas").first();
    const opening = await paintedStats(canvas);
    const box = (await canvas.boundingBox())!;
    const aspect = box.width / box.height;
    // The series converges for |z| < 1: the colored disk has radius 1 in a view 2.4 tall,
    // so it fills pi / (2.4 * 2.4 * aspect) of the canvas.
    const diskShare = Math.PI / (2.4 * 2.4 * aspect);
    expect(opening.colored).toBeGreaterThan(diskShare * 0.9);
    expect(opening.colored).toBeLessThan(diskShare * 1.1);
    // On the axes, 0.9 is inside the disk (colored) and 1.1 is outside (dull grey).
    const at = (re: number, im: number) => colorAt(canvas, 0.5 + re / (2.4 * aspect), 0.5 - im / 2.4);
    const spread = ([r, g, b]: number[]) => Math.max(r, g, b) - Math.min(r, g, b);
    for (const [re, im] of [
      [0.9, 0],
      [-0.9, 0],
      [0, 0.9],
      [0, -0.9],
    ])
      expect(spread(await at(re, im)), `inside at ${re}, ${im}`).toBeGreaterThan(40);
    for (const [re, im] of [
      [1.1, 0],
      [-1.1, 0],
      [0, 1.1],
      [0, -1.1],
    ])
      expect(spread(await at(re, im)), `outside at ${re}, ${im}`).toBeLessThan(10);

    // s = 5 + 8i: the n = 0 term a^-s = 1 dominates, so the whole disk is red.
    const large = await setDial(page, canvas, "sr", "5");
    expect(red(large.sectors)).toBeGreaterThan(0.95);
    // a = 3 at the opening s: a^-s = 3^(-0.5 - 8i) has argument -8 ln 3 = -8.79 rad = 216 degrees: hue sector 7.
    await setDial(page, canvas, "sr", "0.5");
    const shifted = await setDial(page, canvas, "a", "3");
    const dominant = shifted.sectors.indexOf(Math.max(...shifted.sectors));
    expect(dominant).toBe(7);
    // Both dials back: the opening picture returns, sector for sector.
    const back = await setDial(page, canvas, "a", "1");
    back.sectors.forEach((share, i) => expect(share).toBeCloseTo(opening.sectors[i], 2));
  });

  test("is mirror-symmetric for real s and not for complex s", async ({ page }) => {
    await page.goto("/explore/lerchphi/");
    const canvas = page.locator("notatio-complex-plot canvas").first();
    await paintedStats(canvas);
    // Phi(conj z, s, a) = conj Phi(z, s, a) when s and a are real: equal brightness above and below the axis.
    // At s = 0.5 + 8i it is not.
    expect(await mirrorMatch(canvas)).toBeLessThan(0.95);
    const before = (await readCanvas(canvas))!.frame;
    await page.locator("slider-box[name=si] input").fill("0");
    await repaintedStats(canvas, before);
    expect(await mirrorMatch(canvas)).toBeGreaterThan(0.99);
  });
});

test.describe("the fractals", () => {
  test("the Mandelbrot set is symmetric about the real axis, and the Julia set is not", async ({ page }) => {
    await page.goto("/explore/fractals/");
    const plots = page.locator("notatio-worksheet notatio-complex-plot canvas");
    await expect(plots).toHaveCount(2);
    const mandelbrot = plots.nth(0);
    const julia = plots.nth(1);
    const m = await paintedStats(mandelbrot);
    const j = await paintedStats(julia);
    expect(m.hues).toBeGreaterThanOrEqual(6);
    expect(j.hues).toBeGreaterThanOrEqual(6);
    // z_n(conj c) = conj z_n(c): every pixel row matches its mirror row in brightness (c = -0.5 + 0 i is the center).
    expect(await mirrorMatch(mandelbrot)).toBeGreaterThan(0.99);
    // The Julia set for c = -0.4 + 0.6i is symmetric under z -> -z, not under conjugation.
    expect(await mirrorMatch(julia)).toBeLessThan(0.9);
  });
});

// The heads the complex emitter lowers beyond the first set (BL-335), and the elementary ones whose
// shared helpers (arg, the square root) they changed, evaluated by their emitted WGSL on the GPU at the
// points of complex-heads.golden.json and held to mpmath's values (collect-complex-heads.py). A point the kernel declines (its `uncertain` flag, drawn as hatching) is
// not compared; the rest are, where the value is at least 0.1, to the case's measured tolerance.
test.describe("the complex heads agree with mpmath", () => {
  const file = new URL("../../../packages/symbols/analysis/analytic/tests/complex-heads.golden.json", import.meta.url);
  const golden = JSON.parse(readFileSync(file, "utf8")) as {
    points: [number, number][];
    cases: Record<string, { json: Json; tolerance: number; values: [number, number][] }>;
  };
  for (const [name, c] of Object.entries(golden.cases)) {
    test(name, async ({ page }) => {
      await page.goto("/");
      const emitted = emitComplexWGSL(c.json, "z");
      expect(emitted, `${name} has a complex lowering`).toBeDefined();
      // Only the kernels the code reaches (the harness reads `uncertain`): a missing one fails the compile.
      const library = reachableWGSL(`uncertain ${emitted!.code}`);
      const got = await evalComplexOnGpu(page, library, emitted!.code, emitted!.literals, golden.points);
      let drawn = 0;
      let worst = 0;
      got.forEach(([re, im, declined], i) => {
        if (declined) return;
        drawn++;
        const [wr, wi] = c.values[i]!;
        const mag = Math.hypot(wr, wi);
        if (mag < 0.1 || mag > 1e18) return;
        const err = Math.hypot(re - wr, im - wi) / mag;
        expect(Number.isFinite(err), `${name} at ${golden.points[i]!.join(", ")}`).toBe(true);
        worst = Math.max(worst, err);
      });
      test.info().annotations.push({
        type: "measured",
        description: `worst ${worst.toExponential(1)}, drawn ${drawn}/${got.length}`,
      });
      expect(drawn, "points the kernel vouches for").toBeGreaterThan(0.8 * golden.points.length);
      expect(worst, "worst relative error").toBeLessThan(c.tolerance);
    });
  }
});

// The corners of a hand-written range are the portrait's view (BL-335): the Gamma page draws
// ComplexPlot(Gamma(z), {z, -5 - 3*I, 5 + 3*I}), so its view is centered on 0 and 10 tall.
test("a portrait is drawn over the corners it was written with", async ({ page }) => {
  await page.goto("/reference/symbol/Gamma");
  const plot = page.locator("notatio-complex-plot").first();
  await expect(plot).toHaveAttribute("center", "0,0");
  await expect(plot).toHaveAttribute("extent", "10");
  const canvas = plot.locator("canvas");
  await paintedStats(canvas);
  const box = (await canvas.boundingBox())!;
  const aspect = box.width / box.height;
  const at = (re: number, im = 0.005) => colorAt(canvas, 0.5 + re / (10 * aspect), 0.5 - im / 10);
  // Gamma is real on the real axis: positive (red) at 2.5 and between -2 and -1, negative (cyan) between -1 and 0 and
  // between -3 and -2, and so on, each pole a hue flip. Only the right view puts these signs at these places.
  const redness = ([r, g, b]: number[]) => r - (g + b) / 2;
  for (const [re, sign] of [
    [2.5, 1],
    [-0.5, -1],
    [-1.5, 1],
    [-2.5, -1],
    [-3.5, 1],
  ] as const)
    expect(Math.sign(redness(await at(re))), `Gamma(${re}) hue`).toBe(sign);
});

// Symbol pages whose portrait the emitter was widened to draw (BL-335): each is the function's own
// picture, in color and in several hues, not blank, hatched or one color. (A purely real function such
// as Re draws two hues, and is left out.)
for (const head of [
  "BarnesG",
  "BesselJ",
  "Binomial",
  "Digamma",
  "DirichletEta",
  "EllipticK",
  "Erfc",
  "ExpIntegralEi",
  "FresnelC",
  "Hypergeometric1F1",
  "LambertW",
  "Log",
  "LogGamma",
  "Pochhammer",
  "Sinc",
]) {
  test(`the ${head} page draws a portrait in color and in several hues`, async ({ page }) => {
    await page.goto(`/reference/symbol/${head}`);
    const plot = page.locator("notatio-complex-plot").first();
    await expect(plot).toBeAttached();
    const stats = await paintedStats(plot.locator("canvas"));
    expect(stats.colored, "saturated share").toBeGreaterThan(0.4);
    expect(stats.hues, "hue sectors").toBeGreaterThanOrEqual(4);
    await expect(page.getByText("No complex GPU lowering")).toHaveCount(0);
  });
}

// Two things a portrait read wrong before: a magnitude past 1e19 (length squares, so it overflowed and
// read as a pole) and a −0 imaginary part (SwiftShader's atan2(−0, x > 0) is π, a half turn of hue).
test("a huge value keeps its magnitude, and a negative zero its argument", async ({ page }) => {
  await page.goto("/");
  // |G(-5.3 + 4i)| = e^64.83 (mpmath), 1e28.
  const [[logMag]] = await evalComplexOnGpu(page, zetaWGSL, "vec2f(clogPolar(cbarnesG(z)).z, 0.0)", [], [[-5.3, 4]]);
  expect(logMag).toBeCloseTo(64.83, 0);
  // conj(2) = (2, -0): its argument is 0, not π.
  const [[arg]] = await evalComplexOnGpu(page, zetaWGSL, "vec2f(argOf(cconj(z)), 0.0)", [], [[2, 0]]);
  expect(arg).toBe(0);
});
