// What a reader sees on the plot pages (BL-322): surfaces that draw, portraits that agree with the
// kernel, ranges that are honored, frames in proportion. Each test names the audit finding it holds
// (S# = site audit, E# = elements audit, BL-319).
//
// WebGPU tests need a headed Chromium with a software adapter, so they skip where there is none:
//
//   xvfb-run -a pnpm exec playwright test -c tests/stories/playwright.config.ts plots

import type { Locator, Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

/** A `<graphics-3d-box>` whose expression contains `needle`, scrolled into view so it draws. */
async function surface(page: Page, needle: string): Promise<Locator> {
  const box = page.locator(`graphics-3d-box[value*="${needle}"]`).first();
  await box.scrollIntoViewIfNeeded();
  return box;
}

test.describe("Plot3D of HurwitzZeta (S#3)", () => {
  for (const [name, needle] of [
    ["on the CPU", "HurwitzZeta(x, y), (x, 2, 5), (y, 0.35, 3), PlotLabel"],
    ["with Gpu -> 120", "HurwitzZeta(x, y), (x, 2, 5), (y, 0.35, 3), Gpu"],
  ] as const) {
    test(`draws a surface ${name}`, async ({ page }) => {
      await page.goto("/explore/zeta/");
      const box = await surface(page, needle);
      // The surface is a mesh of polygons, not just its title.
      await expect(box.locator("svg polygon, svg path")).not.toHaveCount(0);
      // The legend runs from the smallest value, ζ(5, 3) = 0.00568, to the largest, ζ(5, 0.35) = 190.64.
      await expect.poll(() => box.locator("svg text").allTextContents()).toContain("5.7e-3");
      const legend = await box.locator("svg text").allTextContents();
      expect(legend.some((t) => Math.abs(Number(t) - 190.64) < 0.1)).toBe(true);
    });
  }
});

test("a surface with no real value says so instead of drawing only its title (S#3)", async ({ page }) => {
  await page.goto("/explore/zeta/");
  await page.evaluate(() => {
    const el = document.createElement("graphics-3d-box");
    el.id = "empty-surface";
    el.setAttribute("value", 'Plot3D(Sqrt(-1 - x^2 - y^2), (x, 0, 1), (y, 0, 1), PlotLabel -> "nothing")');
    document.body.prepend(el);
  });
  const box = page.locator("#empty-surface");
  await expect(box.locator(".notatio-error")).toBeVisible();
  await expect(box.locator(".notatio-error")).toContainText("no real value");
});

// --- Symbol pages (S#4) ---------------------------------------------------------------------------

for (const head of ["BesselJ", "AiryAi"]) {
  test(`${head}'s page never shows the complex plot's raw status text (S#4)`, async ({ page }) => {
    await page.goto(`/reference/symbol/${head}`);
    // Its real slice draws, and no portrait is offered that the GPU emitter cannot lower.
    const plot = page.locator("graphics-box[data-plot]").first();
    await plot.scrollIntoViewIfNeeded();
    await expect(plot.locator("svg").first()).toBeVisible({ timeout: 60_000 });
    await expect(page.locator("notatio-complex-plot")).toHaveCount(0);
    await expect(page.getByText("No complex GPU lowering")).toHaveCount(0);
  });
}

// --- 2-D Plot ranges (S#11) -------------------------------------------------------------------

/** A graphics box's x-axis end labels: the first two numbers its SVG prints. */
async function xEnds(box: Locator): Promise<number[]> {
  await expect(box.locator("svg text").first()).toBeVisible({ timeout: 60_000 });
  const texts = await box.locator("svg text").allTextContents();
  return texts.slice(0, 2).map(Number);
}

test("the real slice on the Zeta page is drawn over its own range (S#11)", async ({ page }) => {
  await page.goto("/reference/symbol/Zeta");
  const box = page.locator('graphics-box[value*="zeta(x)"]').first();
  await box.scrollIntoViewIfNeeded();
  await expect.poll(() => xEnds(box), { timeout: 60_000 }).toEqual([-5, 5]);
});

test("the tangle's sine curve is drawn over [-3.1416, 3.1416] (S#11)", async ({ page }) => {
  await page.goto("/playground/inspirations/tangle");
  const box = page.locator('graphics-box[value*="Sin(_k * x)"]').first();
  await box.scrollIntoViewIfNeeded();
  await expect
    .poll(async () => (await xEnds(box)).map((v) => Math.round(v * 100) / 100), { timeout: 60_000 })
    .toEqual([-3.14, 3.14]);
});

// --- Field plot frames (E#8) ---------------------------------------------------------------------
// The default AspectRatio of a contour, density, vector or stream plot is 1, so its plot area is square.

/** The ratio of the plot area's width to its height, from the clip rectangle the marks sit in. */
async function frameRatio(card: Locator): Promise<number> {
  const rect = card.locator("graphics-box svg clipPath rect").first();
  await expect(rect).toBeAttached({ timeout: 60_000 });
  const [w, h] = await rect.evaluate((r) => [Number(r.getAttribute("width")), Number(r.getAttribute("height"))]);
  return (w! - 6) / h!;
}

for (const [component, story] of [
  ["ContourPlot", "concentric-circles"],
  ["DensityPlot", "saddle-colour-bar"],
  ["VectorPlot", "rigid-rotation"],
  ["VectorPlot", "rotation-as-streamlines"],
] as const) {
  test(`${component}: ${story} has a square frame (E#8)`, async ({ page }) => {
    await page.goto(`/reference/component/${component}#story/${story}`);
    const card = page.locator(`[id="story/${story}"]`);
    await card.scrollIntoViewIfNeeded();
    expect(await frameRatio(card)).toBeCloseTo(1, 1);
  });
}

test("ContourPlot: concentric circles are drawn as circles (E#8)", async ({ page }) => {
  await page.goto("/reference/component/ContourPlot#story/concentric-circles");
  const card = page.locator('[id="story/concentric-circles"]');
  await card.scrollIntoViewIfNeeded();
  const rings = card.locator("graphics-box svg g[clip-path] path");
  await expect(rings.first()).toBeAttached({ timeout: 60_000 });
  const ratios = await rings.evaluateAll((paths) =>
    paths.map((p) => {
      const box = (p as SVGGraphicsElement).getBBox();
      return box.width / box.height;
    }),
  );
  expect(ratios.length).toBeGreaterThan(1);
  for (const ratio of ratios) expect(ratio).toBeCloseTo(1, 1);
});

// --- WebGPU ---------------------------------------------------------------------------------
// Headless Chromium has no adapter, and destroys a device whose canvas is configured; these run
// headed on a software adapter (WEBGPU=1, under xvfb-run) and skip otherwise.
const GPU_ARGS = [
  "--enable-unsafe-webgpu",
  "--use-webgpu-adapter=swiftshader",
  "--enable-features=Vulkan",
  "--use-angle=swiftshader",
  "--enable-unsafe-swiftshader",
];

if (process.env["WEBGPU"]) test.use({ headless: false, launchOptions: { args: GPU_ARGS } });

test.describe("on the GPU", () => {
  test.skip(!process.env["WEBGPU"], "needs a headed browser with a WebGPU adapter: WEBGPU=1 xvfb-run -a …");

  test("Plot3D with Gpu -> 100 compiles its shader and wears the GPU badge (E#7)", async ({ page }) => {
    await page.goto("/reference/component/Plot3D#surface-evaluated-on-gpu");
    const box = await surface(page, "Gpu -> 100");
    await expect(box.locator(".graphics-3d-box-badge")).toHaveText("GPU");
    // 100 x 100 samples, not the 25 x 25 of the CPU path: 99 x 99 quads.
    await expect(box.locator("svg polygon")).toHaveCount(99 * 99 + 1, { timeout: 60_000 });
  });

  test("the Hurwitz surface on the GPU wears the badge and spans the same values (S#3)", async ({ page }) => {
    await page.goto("/explore/zeta/");
    const box = await surface(page, "HurwitzZeta(x, y), (x, 2, 5), (y, 0.35, 3), Gpu");
    await expect(box.locator(".graphics-3d-box-badge")).toHaveText("GPU");
    await expect.poll(() => box.locator("svg text").allTextContents()).toContain("5.7e-3");
  });
});
