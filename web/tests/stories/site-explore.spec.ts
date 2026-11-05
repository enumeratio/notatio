// Behavior of the /explore/ pages that work: what a reader sees and can do on each. Values were
// checked against mpmath or the arithmetic they state (the comments say how). Portraits and the
// zeta surface belong to the plots specs and gpu.spec.ts.
//
// Run: STORIES_PORT=<port> node node_modules/@playwright/test/cli.js test -c tests/stories/playwright.config.ts site-explore

import { expect, test } from "@playwright/test";
import { cellGrid, countBlobs, hoverCell, settled } from "./support.ts";

/** The caption under a figure: its hover readout, or the figure's summary when nothing is hovered. */
const caption = (page: import("@playwright/test").Page) => page.locator(".notatio-frame-below").first();

const WHITE: [number, number, number] = [255, 255, 255];

test.describe("tables of Z/n", () => {
  test("multiplication mod 24 is 24 x 24 with an uncolored zero row, and eight white units", async ({ page }) => {
    await page.goto("/explore/multiplication-mod-n/");
    await expect(caption(page)).toContainText("units 8");
    // The zero row and column are not colored, so 23 x 23 cells are painted.
    const grid = await cellGrid(page, 23);
    await grid.canvas.scrollIntoViewIfNeeded();
    // Hovering one cell before the first painted one is element 0: 0 * 1 = 0 and 1 * 0 = 0.
    await hoverCell(page, grid, -1, 0);
    await expect(caption(page)).toContainText("0 · 1 ≡ 0 (mod 24)");
    await hoverCell(page, grid, 0, -1);
    await expect(caption(page)).toContainText("1 · 0 ≡ 0 (mod 24)");
    await hoverCell(page, grid, 0, 0);
    await expect(caption(page)).toContainText("1 · 1 ≡ 1 (mod 24)");
    // 23 * 23 = 529 = 22 * 24 + 1.
    await hoverCell(page, grid, 22, 22);
    await expect(caption(page)).toContainText("23 · 23 ≡ 1 (mod 24)");
    // 5 * 7 = 35 = 24 + 11.
    await hoverCell(page, grid, 4, 6);
    await expect(caption(page)).toContainText("5 · 7 ≡ 11 (mod 24)");
    // White is the value 1: phi(24) = 8 cells, each unit its own inverse (x^2 = 1 mod 24 for 1,5,7,11,13,17,19,23).
    expect(await countBlobs(grid.canvas, WHITE)).toBe(8);
    for (const unit of [1, 5, 7, 11, 13, 17, 19, 23]) {
      await hoverCell(page, grid, unit - 1, unit - 1);
      await expect(caption(page)).toContainText(`${unit} · ${unit} ≡ 1 (mod 24)`);
    }
  });

  test("addition mod 12 is 12 x 12 with the sums that are zero white", async ({ page }) => {
    await page.goto("/explore/addition-mod-n/");
    const grid = await cellGrid(page, 12);
    await grid.canvas.scrollIntoViewIfNeeded();
    await hoverCell(page, grid, 5, 5);
    await expect(caption(page)).toContainText("5 + 5 ≡ 10 (mod 12)");
    await hoverCell(page, grid, 11, 11);
    await expect(caption(page)).toContainText("11 + 11 ≡ 10 (mod 12)");
    // i + j = 0 mod 12 has one solution per row: 12 white cells.
    expect(await countBlobs(grid.canvas, WHITE)).toBe(12);
  });

  test("lifts mod 27 is 27 x 27 with 18 white units and a uniform top row", async ({ page }) => {
    await page.goto("/explore/lifts-mod-pk/");
    await expect(caption(page)).toContainText("units 18");
    const grid = await cellGrid(page, 27);
    await grid.canvas.scrollIntoViewIfNeeded();
    // Each of the phi(27) = 18 units has one inverse: 18 cells holding 1.
    expect(await countBlobs(grid.canvas, WHITE)).toBe(18);
    // Row 0 (the zero element times anything) is one color across its 27 cells; row 1 (9 times anything: 0, 9 or 18) has two.
    const colorsInRow = (row: number) =>
      grid.canvas.evaluate(
        (c: HTMLCanvasElement, [x0, y0, pitch, r]: [number, number, number, number]) => {
          const scale = c.width / c.getBoundingClientRect().width;
          const ctx = c.getContext("2d")!;
          const seen = new Set<string>();
          for (let col = 0; col < 27; col++) {
            const px = Math.round((x0 + (col + 0.5) * pitch) * scale);
            const py = Math.round((y0 + (r + 0.5) * pitch) * scale);
            seen.add(Array.from(ctx.getImageData(px, py, 1, 1).data).join(","));
          }
          return seen.size;
        },
        [grid.x0, grid.y0, grid.pitch, row] as [number, number, number, number],
      );
    expect(await colorsInRow(0)).toBe(1);
    expect(await colorsInRow(1)).toBeGreaterThan(1);
  });
});

test.describe("special functions", () => {
  test("the Lerch page's cells give the reductions", async ({ page }) => {
    await page.goto("/explore/lerchphi/");
    const outs = page.locator("notatio-cell notatio-out");
    // Phi(1, 2, 1) = zeta(2) = pi^2/6; Phi(1, -1, 1) = zeta(-1) = -1/12; Phi(z, 0, a) = 1/(1 - z).
    expect(await settled(outs.nth(0))).toBe("1 / 6 * Pi ^ 2");
    expect(await settled(outs.nth(1))).toBe("-1 / 12");
    expect(await settled(outs.nth(2))).toBe("1 / (-z + 1)");
  });

  test("the polylog page's cells give the closed forms and the polygamma digits", async ({ page }) => {
    await page.goto("/explore/polylog/");
    const outs = page.locator("notatio-cell notatio-out");
    expect(await settled(outs.nth(0))).toBe("-Ln(-z + 1)");
    expect(await settled(outs.nth(1))).toBe("1 / 6 * Pi ^ 2");
    expect(await settled(outs.nth(2))).toBe("z / (-z + 1) ^ 2");
    // mpmath: psi'(1) = 1.644934066848226436472415, psi''(1) = -2.404113806319188570799476,
    // psi'(1/2) = 4.934802200544679309417245; the page prints 20 digits or more.
    const digits = (s: string) => s.replace(/_/g, "");
    expect(digits(await settled(outs.nth(3)))).toMatch(/^1\.644934066848226436/);
    expect(digits(await settled(outs.nth(4)))).toMatch(/^-2\.404113806319188570/);
    expect(digits(await settled(outs.nth(5)))).toMatch(/^4\.934802200544679309/);
  });

  test("the zeta page's cells reduce, and the Lerch sheet follows its dial", async ({ page }) => {
    await page.goto("/explore/zeta/");
    const outs = page.locator("notatio-cell notatio-out");
    expect(await settled(outs.nth(0))).toBe("1 / 6 * Pi ^ 2");
    expect(await settled(outs.nth(1))).toBe("-1 + 1 / 6 * Pi ^ 2");
    // zeta(0, a) = 1/2 - a.
    expect(await settled(outs.nth(2))).toBe("-a + 1 / 2");

    // Phi(z, s, a) over s in [2, 5], a in [0.35, 3]. At z = 0 the sheet is a^-s, whose maximum on
    // the box is at s = 5, a = 0.35: 0.35^-5 = 190.397, the top z label.
    const manipulate = page.locator("notatio-manipulate").first();
    const labels = manipulate.locator("svg[aria-label='surface plot'] text");
    const slider = manipulate.locator("input[type=range]");
    await expect(slider).toHaveValue("0");
    await expect(labels.filter({ hasText: /^190\.4$/ }).first()).toBeVisible();
    // z = 0.95: Phi(0.95, 5, 0.35) = 190.62419 (mpmath), 0.95 / 1.35^5 more than a^-s.
    await slider.fill("0.95");
    await expect(labels.filter({ hasText: /^190\.6/ }).first()).toBeVisible();
    // Back to z = 0 and the opening picture returns.
    await slider.fill("0");
    await expect(labels.filter({ hasText: /^190\.4$/ }).first()).toBeVisible();
  });
});

test.describe("rings of integers", () => {
  test("quadratic primes: the d stepper walks the fields with the right invariants", async ({ page }) => {
    await page.goto("/explore/quadratic-primes/");
    const below = caption(page);
    await expect(below).toContainText("ℚ(√−5)");
    await expect(below).toContainText("discriminant −20");
    await expect(below).toContainText("class number 2");
    await expect(below).toContainText("units 2");
    const next = page.locator("button[aria-label=Next]").first();
    const stepper = page.locator("span.stepper-box[aria-label=d]");
    // d = -4 is Q(i): disc -4 (4d, as -4 = 0 mod 4), four units.
    await next.click();
    await expect(below).toContainText("ℚ(i)");
    await expect(below).toContainText("discriminant −4");
    await expect(below).toContainText("units 4");
    // d = -3: Eisenstein, disc -3 (-3 = 1 mod 4), six units.
    await next.click();
    await expect(stepper).toContainText("−3");
    await expect(below).toContainText("ℤ[ω]");
    await expect(below).toContainText("discriminant −3");
    await expect(below).toContainText("units 6");
    // d = -2: disc -8, two units.
    await next.click();
    await expect(below).toContainText("ℚ(√−2)");
    await expect(below).toContainText("discriminant −8");
    await expect(below).toContainText("units 2");
    // d = -1 is Q(i) again, then d = 2 jumps over 0 and 1 (squares): disc 8, fundamental unit 1 + sqrt 2 of norm -1.
    await next.click();
    await expect(below).toContainText("ℚ(i)");
    await next.click();
    await expect(stepper).toContainText("2");
    await expect(below).toContainText("ℚ(√2)");
    await expect(below).toContainText("discriminant 8");
    await expect(below).toContainText("ε = 1 + √2 (norm −1)");
    // d = 3: disc 12 (3 = 3 mod 4), epsilon = 2 + sqrt 3 of norm 1 (4 - 3 = 1).
    await next.click();
    await expect(below).toContainText("discriminant 12");
    await expect(below).toContainText("ε = 2 + √3 (norm 1)");
    // The arrow keys step too.
    await stepper.focus();
    await page.keyboard.press("ArrowLeft");
    await expect(below).toContainText("discriminant 8");
  });

  test("quadratic primes: the six tiles around zero in Z[omega] are its units, and 2 is prime", async ({ page }) => {
    await page.goto("/explore/quadratic-primes/");
    const below = caption(page);
    const next = page.locator("button[aria-label=Next]").first();
    await expect(below).toContainText("units 2");
    // d = -3: six units, the hexagons around 0, one lattice step (14 px at the opening scale) out.
    await next.click();
    await next.click();
    await expect(below).toContainText("units 6");
    const axes = page.locator("canvas.graphics-box-axes").first();
    await axes.scrollIntoViewIfNeeded();
    const box = (await axes.boundingBox())!;
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    const step = 14;
    const read = async (dx: number, dy: number) => {
      await page.mouse.move(cx + dx, cy + dy);
      return below;
    };
    await expect(await read(0, 0)).toContainText("kind zero");
    for (const [dx, dy] of [
      [step, 0],
      [-step, 0],
      [step / 2, -step * 0.866],
      [-step / 2, step * 0.866],
      [step / 2, step * 0.866],
      [-step / 2, -step * 0.866],
    ]) {
      await expect(await read(dx, dy)).toContainText("kind unit");
    }
    // Two steps out along the real axis is 2: norm 4, inert, so prime.
    await expect(await read(2 * step, 0)).toContainText("kind prime");
  });

  test("complex bases: the setters give the systems and their expansion counts", async ({ page }) => {
    await page.goto("/explore/complex-bases/");
    const below = caption(page);
    // The opening system, 3 + omega, has 7 digits; at 5 places that is 7^5 = 16,807 numerals.
    await expect(below).toContainText("expansions 16,807");
    // The twindragon: base -1 + i, digits 0 and 1, 12 places: 2^12.
    await page.getByText("the twindragon", { exact: true }).click();
    await expect(below).toContainText("base −1+i");
    await expect(below).toContainText("digits 0, 1");
    await expect(below).toContainText("expansions 4,096");
    // Base -2 + i: five digits 0..4 (its norm is 5), 5^6 numerals.
    await page.getByText("base −2 + i", { exact: true }).click();
    await expect(below).toContainText("digits 0, 1, 2, 3, 4");
    await expect(below).toContainText("expansions 15,625");
    // Quater-imaginary: base 2i, digits 0..3, 4^7 numerals.
    await page.getByText("the quater-imaginary base", { exact: true }).click();
    await expect(below).toContainText("base 2i");
    await expect(below).toContainText("digits 0, 1, 2, 3");
    await expect(below).toContainText("expansions 16,384");
  });
});
