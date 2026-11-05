// WebGPU portraits, read back as pixels (gpu-support.ts). Run with playwright.gpu.config.ts under
// `xvfb-run -a`; SwiftShader draws the frames. Thresholds are set from what the portraits measure
// there: the least colored portrait on these pages has 33% saturated pixels and 8 hue sectors.
// The zeta surface and the Im a < 0 half of the zeta portrait belong to the plots spec.

import type { Locator } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { colorAt, installCapture, mirrorMatch, paintedStats, readCanvas, repaintedStats } from "./gpu-support.ts";

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
