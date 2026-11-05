// The notebook REPL (/notebook/) and the worksheet (/worksheet/): what a reader types and sees.
// Dragging a worksheet slider and the "+ cell" button belong to the figures-controls spec; here
// a slider is set by value and a new cell is reached by focusing it.
//
// Run: STORIES_PORT=<port> node node_modules/@playwright/test/cli.js test -c tests/stories/playwright.config.ts site-notebook

import { expect, test } from "@playwright/test";
import { curveOf, peaks, sineMaxima } from "./support.ts";

test.describe("/notebook/", () => {
  test("the terminal numbers its lines, refers back by number and reports errors", async ({ page }) => {
    await page.goto("/notebook/");
    const screen = page.locator(".notatio-term__screen");
    const input = page.getByLabel("Terminal input");
    await expect(input).toBeAttached();
    await expect(screen).toContainText("compute-engine REPL");
    const run = async (line: string) => {
      await input.focus();
      await page.keyboard.type(line);
      await page.keyboard.press("Enter");
    };
    // 10 choose 3 = 120; Out(1) + 1 = 121; In(1) is the first input's value.
    await run("Binomial(10, 3)");
    await expect(screen).toContainText("Out[1]= 120");
    await run("Out(1) + 1");
    await expect(screen).toContainText("Out[2]= 121");
    await run("In(1)");
    await expect(screen).toContainText("Out[3]= 120");
    // sqrt(8) = 2 sqrt(2), kept exact.
    await run("Sqrt(8)");
    await expect(screen).toContainText("Out[4]= 2 * Sqrt(2)");
    await run("1/0");
    await expect(screen).toContainText("Out[5]= ComplexInfinity");
    // A malformed line is reported and does not take a number.
    await run("1/");
    await expect(screen).toContainText("error: Epsil: expression-expected");
    await expect(screen).toContainText("In[6]:=");
    await expect(screen).not.toContainText("Out[6]");
  });

  test("the page says nothing is saved: a reload starts a fresh transcript", async ({ page }) => {
    await page.goto("/notebook/");
    const screen = page.locator(".notatio-term__screen");
    const input = page.getByLabel("Terminal input");
    await expect(screen).toContainText("compute-engine REPL");
    await input.focus();
    await page.keyboard.type("2 + 3");
    await page.keyboard.press("Enter");
    await expect(screen).toContainText("Out[1]= 5");
    await page.reload();
    await expect(page.locator(".notatio-term__screen")).toContainText("compute-engine REPL");
    await expect(page.locator(".notatio-term__screen")).not.toContainText("Out[1]= 5");
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
    // BL-319 S#13 (with the plots lane's explicit-range finding): the sheet asks Plot for (x, -pi, pi) and
    // Plot draws its default -6.28..6.28 instead, so the labels do not say the range the sheet chose.
    test.fail();
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
    expect(curve.xRange).toEqual(requested);
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
      await page.locator(".ws-cell").last().locator(".notatio-static").first().focus();
      await page.keyboard.press("Enter");
      // MathLive mounts after Enter; keys typed before it has focus are lost.
      await expect(page.locator("math-field:focus")).toBeAttached();
      await page.keyboard.type(typed, { delay: 80 });
      await page.keyboard.press("Enter");
    };
    await add("c:=3");
    // c := 3 gets a slider at 3.00.
    await expect(cellWith("c := 3").locator(".ws-slider-val")).toHaveText("3.00");
    await page.locator(".ws-cell").last().locator(".notatio-static").first().focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("math-field:focus")).toBeAttached();
    await page.keyboard.type("a*c+b", { delay: 80 });
    await page.keyboard.press("Enter");
    // a * c + b = 2 * 3 + 1 = 7.
    const product = cellWith("a * c + b").locator("notatio-out");
    await expect(product).toHaveAttribute("input-form", "7");
    // a = 5: 5 * 3 + 1 = 16.
    await page.locator('.ws-cell[data-cell="1"] input[type=range]').fill("5");
    await expect(product).toHaveAttribute("input-form", "16");
  });
});
