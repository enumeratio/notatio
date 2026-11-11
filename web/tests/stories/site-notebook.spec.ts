// The notebook (/notebook/) and the worksheet (/worksheet/): what a reader types and sees.
// Dragging a worksheet slider and the "+ cell" button belong to the figures-controls spec; here
// a slider is set by value and a new cell is reached by focusing it.
//
// Run: STORIES_PORT=<port> node node_modules/@playwright/test/cli.js test -c tests/stories/playwright.config.ts site-notebook

import { expect, test } from "@playwright/test";
import { curveOf, peaks, sineMaxima } from "./support.ts";

test.describe("/notebook/", () => {
  const cell = (page: import("@playwright/test").Page, i: number) => page.locator("notatio-notebook .nb-cell").nth(i);
  const answer = (page: import("@playwright/test").Page, i: number) => cell(page, i).locator("notatio-out");
  // A cell shows typeset; a click opens its editor, and keys typed before the field has focus are lost.
  const retype = async (page: import("@playwright/test").Page, i: number, text: string) => {
    await cell(page, i).locator(".notatio-static.is-editable").first().click();
    await expect(cell(page, i).locator("math-field")).toBeFocused();
    await page.keyboard.press("Control+a");
    await page.keyboard.type(text, { delay: 80 });
    await page.keyboard.press("Enter");
  };

  test("opens on the starter: its cells answer and the plot draws", async ({ page }) => {
    await page.goto("/notebook/");
    // Four starter cells and the trailing blank one.
    await expect(page.locator("notatio-notebook .nb-cell")).toHaveCount(5);
    await expect(answer(page, 0)).toHaveAttribute("input-form", "120");
    // r := Sqrt(8) is kept exact, and the cell after it reads r: 2 * 2 Sqrt(2) + 1.
    await expect(answer(page, 1)).toHaveAttribute("input-form", "2 * Sqrt(2)");
    await expect(answer(page, 2)).toHaveAttribute("input-form", "1 + 4 * Sqrt(2)");
    await expect(cell(page, 3).locator("graphics-box svg[aria-label=plot]")).toBeVisible();
  });

  test("editing the definition re-runs the cell that reads it", async ({ page }) => {
    await page.goto("/notebook/");
    await expect(answer(page, 2)).toHaveAttribute("input-form", "1 + 4 * Sqrt(2)");
    await retype(page, 1, "r:=9");
    // 2 * 9 + 1.
    await expect(answer(page, 2)).toHaveAttribute("input-form", "19");
  });

  test("a reload keeps the reader's edit, and Reset returns to the starter", async ({ page }) => {
    await page.goto("/notebook/");
    await expect(answer(page, 2)).toHaveAttribute("input-form", "1 + 4 * Sqrt(2)");
    await retype(page, 1, "r:=9");
    await expect(answer(page, 2)).toHaveAttribute("input-form", "19");
    // Saved once typing pauses.
    await page.waitForTimeout(800);
    await page.reload();
    await expect(answer(page, 2)).toHaveAttribute("input-form", "19");
    await page.getByRole("button", { name: "Reset" }).click();
    await expect(answer(page, 2)).toHaveAttribute("input-form", "1 + 4 * Sqrt(2)");
  });
});

test.describe("/worksheet/", () => {
  test("the seed binds sliders, draws the curve, and a slider rewrites every cell that reads it", async ({ page }) => {
    await page.goto("/worksheet/");
    const a = page.locator('.ws-cell[data-cell="1"]');
    const slider = a.locator("input[type=range]");
    await expect(slider).toBeVisible();
    // a := 2 and b := 1 get sliders over -10..10, opening at 2.00 and 1.00.
    await expect(slider).toHaveAttribute("min", "-10");
    await expect(slider).toHaveAttribute("max", "10");
    await expect(a.locator(".ws-slider-val")).toHaveText("2.00");
    await expect(page.locator('.ws-cell[data-cell="2"] .ws-slider-val')).toHaveText("1.00");
    await expect(page.locator('.ws-cell[data-cell="3"] notatio-out')).toHaveAttribute("input-form", "Sin(2x) + 1");
    // Its humps: the maxima of sin(2x) + 1 inside the plotted range (4 over [-2pi, 2pi]).
    const curve = page.locator("notatio-worksheet graphics-box svg[aria-label=plot]");
    const humps = async (a: number) => {
      const c = await curveOf(curve);
      return { drawn: peaks(c.ys), expected: sineMaxima(a, c.xRange[0], c.xRange[1]) };
    };
    const opening = await humps(2);
    expect(opening.expected).toBeGreaterThan(0);
    expect(opening.drawn).toBe(opening.expected);

    await slider.fill("5");
    await expect(a.locator("notatio-out")).toHaveAttribute("input-form", "5");
    await expect(page.locator('.ws-cell[data-cell="3"] notatio-out')).toHaveAttribute("input-form", "Sin(5x) + 1");
    await expect(page.locator('.ws-cell[data-cell="4"] notatio-out')).toHaveAttribute("input-form", "Sin(5x) * Cos(y)");
    // And 5 * (range) / 2 pi of them for a = 5 (10 over [-2pi, 2pi]).
    await expect(async () => {
      const { drawn, expected } = await humps(5);
      expect(expected).toBeGreaterThan(0);
      expect(drawn).toBe(expected);
    }).toPass();
  });

  test("the curve and the surface are asked for the same x range", async ({ page }) => {
    // BL-319 S#13: the sheet asks Plot for (x, -pi, pi) and Plot3D for (x, -1.5, 1.5), so at a = 4 the
    // curve has 8 humps over its range and the surface about 2 ridges over its: the two do not share an x scale.
    test.fail();
    await page.goto("/worksheet/");
    await expect(page.locator('.ws-cell[data-cell="1"] input[type=range]')).toBeVisible();
    const requested = async (tag: string) => {
      const source = await page
        .locator(`notatio-worksheet ${tag}`)
        .first()
        .evaluate((n) => String((n as any).value));
      return /\(x, (-?[\d.]+), (-?[\d.]+)\)/.exec(source)!.slice(1).map(Number);
    };
    const curve = await requested("graphics-box");
    expect(await requested("graphics-3d-box")).toEqual(curve);
    expect(curve[1] - curve[0]).toBeGreaterThan(0);
  });

  test("the curve is drawn over the range the sheet's view asks for", async ({ page }) => {
    // BL-319 S#13: the labels say the range the sheet chose, not Plot's default -6.28..6.28.
    await page.goto("/worksheet/");
    await expect(page.locator('.ws-cell[data-cell="1"] input[type=range]')).toBeVisible();
    const svg = page.locator("notatio-worksheet graphics-box svg[aria-label=plot]");
    const requested = await page
      .locator("notatio-worksheet graphics-box")
      .first()
      .evaluate((n) =>
        /\(x, (-?[\d.]+), (-?[\d.]+)\)/
          .exec(String((n as any).value))!
          .slice(1)
          .map(Number),
      );
    const curve = await curveOf(svg);
    // The range is read from the axis labels, which print three significant digits.
    expect(curve.xRange[0]).toBeCloseTo(requested[0], 2);
    expect(curve.xRange[1]).toBeCloseTo(requested[1], 2);
  });

  test("a new binding makes a slider, and a cell reading it follows the other slider", async ({ page }) => {
    await page.goto("/worksheet/");
    await expect(page.locator('.ws-cell[data-cell="1"] input[type=range]')).toBeVisible();
    const cellWith = (text: string) =>
      page.locator(".ws-cell").filter({ has: page.locator(`notatio-in[input-form="${text}"]`) });
    const add = async (typed: string) => {
      const before = await page.locator(".ws-cell").count();
      await page.getByRole("button", { name: "+ cell" }).click();
      await expect(page.locator(".ws-cell")).toHaveCount(before + 1);
      // A new cell opens in the editor with focus; MathLive mounts a moment later, and keys
      // typed before it has focus are lost.
      await expect(page.locator(".ws-cell").last().locator("math-field")).toBeFocused();
      await page.keyboard.type(typed, { delay: 80 });
      await page.keyboard.press("Enter");
    };
    await add("c:=3");
    // c := 3 gets a slider at 3.00.
    await expect(cellWith("c := 3").locator(".ws-slider-val")).toHaveText("3.00");
    await add("a*c+b");
    // a * c + b = 2 * 3 + 1 = 7.
    const product = cellWith("a * c + b").locator("notatio-out");
    await expect(product).toHaveAttribute("input-form", "7");
    // a = 5: 5 * 3 + 1 = 16.
    await page.locator('.ws-cell[data-cell="1"] input[type=range]').fill("5");
    await expect(product).toHaveAttribute("input-form", "16");
  });
});
