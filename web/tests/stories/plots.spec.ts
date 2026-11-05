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
