// Inline figures, controls and the worksheet, as a reader meets them in the browser (BL-320).
// Each test asserts what the reader sees or can do -- a figure with a box, a drag that moves a
// value, a badge with its text -- never the element's internals.
//
// Run with: STORIES_PORT=<port> node node_modules/@playwright/test/cli.js test \
//   -c tests/stories/playwright.config.ts figures-controls

import type { Locator, Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

/** A docs story's card, by its anchor. */
const story = (page: Page, id: string): Locator => page.locator(`[id="${id}"]`);

/** A box a reader can see: wider and taller than a hairline. */
async function boxOf(el: Locator): Promise<{ x: number; y: number; width: number; height: number }> {
  await el.scrollIntoViewIfNeeded();
  const box = await el.boundingBox();
  return box ?? { x: 0, y: 0, width: 0, height: 0 };
}

/** A canvas's pixels, to tell one drawing from another. */
const pixels = (canvases: Locator): Promise<string> =>
  canvases.evaluateAll((all) => all.map((c) => (c as HTMLCanvasElement).toDataURL()).join("|"));

// --- 1. inline figures ------------------------------------------------------------------

const FIGURE_PAGES = [
  ["/docs/components/manipulate", 2],
  ["/docs/combinatorics/ranking-and-unranking", 3],
  ["/playground/inspirations/tangle", 4],
  ["/playground/inspirations/sage", 1],
] as const;

test.describe("an inline figure beside a control", () => {
  for (const [path, count] of FIGURE_PAGES) {
    test(`${path} draws every figure with a width`, async ({ page }) => {
      await page.goto(path);
      const figures = page.locator("graphics-box.inline-figure");
      await expect(figures).toHaveCount(count, { timeout: 120_000 });
      for (let i = 0; i < count; i++) {
        const figure = figures.nth(i);
        await expect
          .poll(async () => (await boxOf(figure)).width, { message: `figure ${i} width` })
          .toBeGreaterThan(16);
        expect((await boxOf(figure)).height).toBeGreaterThan(30);
        await expect
          .poll(() =>
            figure
              .locator("canvas")
              .first()
              .evaluate((c: HTMLCanvasElement) => c.clientWidth),
          )
          .toBeGreaterThan(16);
      }
    });
  }

  test("the subset glyph grows with the ground set", async ({ page }) => {
    await page.goto("/docs/components/manipulate");
    const card = story(page, "grow-a-subset");
    const figure = card.locator("graphics-box.inline-figure");
    await expect.poll(async () => (await boxOf(figure)).width).toBeGreaterThan(16);
    const narrow = (await boxOf(figure)).width;
    await card.locator("input[type=range]").first().fill("8");
    await expect.poll(async () => (await boxOf(figure)).width).toBeGreaterThan(narrow + 10);
  });

  test("the harmonic-index glyph follows k", async ({ page }) => {
    await page.goto("/docs/components/manipulate");
    const card = story(page, "a-curve-and-its-harmonic-index");
    const canvas = card.locator("graphics-box.inline-figure canvas");
    await expect.poll(async () => (await boxOf(canvas.first())).width).toBeGreaterThan(16);
    const before = await pixels(canvas);
    await card.locator("input[type=range]").first().fill("5");
    await expect.poll(() => pixels(canvas)).not.toBe(before);
  });
});

// --- 3. locator --------------------------------------------------------------------------

test("a locator is a visible dot at its value on the plot, and dragging it moves the readout", async ({ page }) => {
  await page.goto("/docs/components/controls");
  const card = story(page, "locator-on-a-plot");
  const dot = card.locator(".locator-box-dot");
  const svg = card.locator("graphics-box svg:not(.notatio-prerendered svg)").first();
  await expect(svg).toBeVisible({ timeout: 120_000 });
  await expect(dot).toBeVisible();
  const readout = card.locator("dynamic-box").last();
  await expect(readout).toContainText("0.5");

  // x = 1, y = 0.5 on a window of [-6.283, 6.283] across the plot's frame (viewBox 340 x 200).
  const place = async (): Promise<{ fx: number; fy: number }> => {
    const d = await boxOf(dot);
    const s = await boxOf(svg);
    return { fx: (d.x + d.width / 2 - s.x) / s.width, fy: (d.y + d.height / 2 - s.y) / s.height };
  };
  await expect.poll(async () => (await boxOf(dot)).width).toBeGreaterThan(4);
  await expect
    .poll(async () => {
      const { fx } = await place();
      return Math.abs(fx - (38 + ((1 + 6.283) / 12.566) * 292) / 340);
    })
    .toBeLessThan(0.02);
  const { fy } = await place();
  expect(fy).toBeGreaterThan(0.1);
  expect(fy).toBeLessThan(0.9);

  const before = await readout.innerText();
  const d = await boxOf(dot);
  const s = await boxOf(svg);
  await page.mouse.move(d.x + d.width / 2, d.y + d.height / 2);
  await page.mouse.down();
  await page.mouse.move(s.x + s.width * 0.3, s.y + s.height * 0.3, { steps: 6 });
  await page.mouse.up();
  await expect.poll(() => readout.innerText()).not.toBe(before);
  const moved = await boxOf(dot);
  expect(Math.abs(moved.x + moved.width / 2 - (s.x + s.width * 0.3))).toBeLessThan(6);
});

// --- 4. interval slider --------------------------------------------------------------------

test("an interval slider's thumbs never cross, drawn or bound", async ({ page }) => {
  await page.goto("/docs/components/controls");
  const card = story(page, "intervalslider");
  const slider = card.locator("interval-slider-box").first();
  await expect(slider.locator("input")).toHaveCount(2, { timeout: 120_000 });
  const lo = slider.locator("input[data-thumb=lo]");
  const hi = slider.locator("input[data-thumb=hi]");
  const values = async (): Promise<[number, number]> => [Number(await lo.inputValue()), Number(await hi.inputValue())];

  // Drag the low thumb well past the high one, with the mouse.
  const track = await boxOf(slider.locator(".interval-slider-box-track"));
  const [a, b] = await values();
  const max = Number(await lo.getAttribute("max"));
  const min = Number(await lo.getAttribute("min"));
  const at = (v: number): number => track.x + 7 + ((v - min) / (max - min)) * (track.width - 14);
  await page.mouse.move(at(a), track.y + track.height / 2);
  await page.mouse.down();
  await page.mouse.move(at(max), track.y + track.height / 2, { steps: 8 });
  await page.mouse.up();

  const [nlo, nhi] = await values();
  expect(nlo).toBeLessThanOrEqual(nhi);
  expect(nhi).toBeGreaterThanOrEqual(b - 1e-9);
  // The control's readout and the bound width (hi - lo) say the same as the thumbs.
  const shown = ((await slider.locator(".control-readout").innerText()).match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
  expect(shown).toHaveLength(2);
  expect(shown[0]!).toBeCloseTo(nlo, 6);
  expect(shown[1]!).toBeCloseTo(nhi, 6);
  await expect(card.locator("dynamic-box")).toContainText(String(nhi - nlo));
});

// --- 5. animator ---------------------------------------------------------------------------

test("an animator plays by default, as Wolfram's Animator does", async ({ page }) => {
  await page.goto("/docs/components/controls");
  const card = story(page, "animator-and-verticalslider");
  const animator = card.locator("animator-box");
  await animator.scrollIntoViewIfNeeded();
  const play = animator.locator("button.control-play");
  await expect(play).toHaveAttribute("aria-pressed", "true", { timeout: 120_000 });
  const readout = animator.locator(".control-readout");
  const first = await readout.innerText();
  await expect.poll(() => readout.innerText()).not.toBe(first);
});

/** True when the animator's readout holds still for `ms`, then moves once its button is pressed. */
async function holdsUntilPlayed(animator: Locator, ms = 2500): Promise<void> {
  await animator.scrollIntoViewIfNeeded();
  const play = animator.locator("button.control-play");
  await expect(play).toBeVisible({ timeout: 120_000 });
  const slider = animator.locator("input[type=range]");
  const first = await slider.inputValue();
  await animator.page().waitForTimeout(ms);
  expect(await slider.inputValue()).toBe(first);
  await expect(play).toHaveAttribute("aria-pressed", "false");
  await play.click();
  await expect.poll(() => slider.inputValue()).not.toBe(first);
}

test.describe("AnimationRunning -> False", () => {
  test("an animator element with animation-running=false waits to be played", async ({ page }) => {
    await page.goto("/docs/components/controls");
    await holdsUntilPlayed(story(page, "a-held-animator-element").locator("animator-box"));
  });

  // The preview remounts its tree when the engine arrives, so the card is held to what the
  // element is told; the element's own behavior is the first test.
  test("an Animator's option reaches its element, held or not", async ({ page }) => {
    await page.goto("/docs/components/environments");
    const card = story(page, "a-held-animator");
    const animator = card.locator("animator-box");
    await expect(animator).toHaveAttribute("animation-running", "false", { timeout: 120_000 });
    await card.locator(".env-source").fill("Row([Animator(t, (0, 1, 0.25)), Dynamic(Sin(Pi * t))])");
    await expect(animator).not.toHaveAttribute("animation-running", /.*/);
  });
});

test.describe("prefers-reduced-motion: reduce", () => {
  test.use({ reducedMotion: "reduce" });

  test("an animator does not sweep on its own, and its play button still works", async ({ page }) => {
    await page.goto("/docs/components/controls");
    const animator = story(page, "animator-and-verticalslider").locator("animator-box");
    await holdsUntilPlayed(animator);
  });
});

// --- 2, 6. the worksheet --------------------------------------------------------------------

test.describe("the worksheet", () => {
  test("dragging a cell's slider follows the pointer and recomputes the cells that read it", async ({ page }) => {
    await page.goto("/worksheet/");
    const slider = page.locator(".ws-slider input[type=range]").first();
    await expect(slider).toBeVisible({ timeout: 120_000 });
    const handle = await slider.elementHandle();
    const box = await boxOf(slider);
    const min = Number(await slider.getAttribute("min"));
    const max = Number(await slider.getAttribute("max"));
    const before = Number(await slider.inputValue());

    await page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.9, box.y + box.height / 2, { steps: 12 });
    await page.mouse.up();

    // The drag ended on the same, still-attached input, near where the pointer let go.
    expect(await handle!.evaluate((n) => n.isConnected)).toBe(true);
    // Cell 3 (`Sin(a * x) + b`) reads the new `a`, and the thumb ends where the cell says.
    const out = page.locator("[data-cell]").nth(2);
    const coefficient = async (): Promise<number> => {
      const m = (await out.innerText()).match(/sin\(\s*(-?\d+(?:\.\d+)?)\s*x/i);
      return m ? Number(m[1]) : Number.NaN;
    };
    await expect
      .poll(async () => Math.abs((await coefficient()) - Number(await slider.inputValue())))
      .toBeLessThan(0.05);
    const after = Number(await slider.inputValue());
    expect(after).toBeGreaterThan(before);
    expect(after).toBeGreaterThan(min + (max - min) * 0.7);
  });

  test("a press that moves nothing leaves the thumb following the binding", async ({ page }) => {
    await page.goto("/worksheet/");
    const slider = page.locator(".ws-slider input[type=range]").first();
    await expect(slider).toBeVisible({ timeout: 120_000 });
    const box = await boxOf(slider);
    const at = await slider.inputValue();
    // Press on the thumb and let go off the input: no value change, so no `change` event.
    const lo = Number(await slider.getAttribute("min"));
    const fraction = (Number(at) - lo) / (Number(await slider.getAttribute("max")) - lo);
    const thumbX = box.x + 8 + (box.width - 16) * fraction; // a 16 px thumb travels the rest of the track
    await page.mouse.move(thumbX, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(thumbX, box.y - 80);
    await page.mouse.up();
    expect(await slider.inputValue()).toBe(at);
    // Type a new binding in the first cell (`a := 2`).
    const cell = page.locator("[data-cell]").first();
    await cell.locator("notatio-in").first().click();
    const field = cell.locator("notatio-in math-field").first();
    await expect(field).toBeVisible({ timeout: 60_000 });
    // The element is visible before MathLive upgrades it; a keystroke sent earlier lands on the page.
    await expect(field).toBeFocused({ timeout: 60_000 });
    await page.keyboard.press("ControlOrMeta+A");
    await page.keyboard.type("a:=3", { delay: 80 });
    await expect.poll(() => field.evaluate((f) => (f as HTMLInputElement).value)).toMatch(/coloneq.*3/);
    await page.keyboard.press("Enter");
    await expect.poll(() => slider.inputValue(), { timeout: 30_000 }).toBe("3");
  });

  test("a default range holds still while its slider is dragged", async ({ page }) => {
    await page.goto("/explore/fractals/");
    const slider = page.locator(".ws-slider input[type=range]").nth(1); // n := 64, in -100..100
    await expect(slider).toBeVisible({ timeout: 120_000 });
    await slider.scrollIntoViewIfNeeded();
    const box = await boxOf(slider);
    expect(await slider.getAttribute("min")).toBe("-100");
    await page.mouse.move(box.x + box.width * 0.82, box.y + box.height / 2);
    await page.mouse.down();
    for (let i = 1; i <= 10; i++) {
      await page.mouse.move(box.x + box.width * (0.82 - 0.04 * i), box.y + box.height / 2, { steps: 8 });
      await page.waitForTimeout(300);
      expect([await slider.getAttribute("min"), await slider.getAttribute("max")]).toEqual(["-100", "100"]);
    }
    await page.mouse.up();
    expect(Number(await slider.inputValue())).toBeLessThan(40);
  });

  test("+ cell adds a cell the reader can see and type in", async ({ page }) => {
    await page.goto("/worksheet/");
    const cells = page.locator("[data-cell]");
    await expect(cells.first()).toBeVisible({ timeout: 120_000 });
    const count = await cells.count();
    await page.getByRole("button", { name: "+ cell" }).click();
    await expect(cells).toHaveCount(count + 1);
    const fresh = cells.last();
    const target = fresh.locator("notatio-in math-field, notatio-in .notatio-static");
    await expect.poll(async () => (await boxOf(target.first())).width).toBeGreaterThan(8);
    expect((await boxOf(target.first())).height).toBeGreaterThan(8);
    // Focus is in the new cell, so typing goes there.
    const id = await fresh.getAttribute("data-cell");
    await expect
      .poll(() =>
        page.evaluate(
          (cellId) => document.activeElement?.closest("[data-cell]")?.getAttribute("data-cell") === cellId,
          id,
        ),
      )
      .toBe(true);
  });
});

// --- 7. verification ------------------------------------------------------------------------

test.describe("VerificationTest badges", () => {
  const badge = (page: Page, id: string): Locator => story(page, id).locator(".ntr-badge");

  test("a failure names what was expected", async ({ page }) => {
    await page.goto("/docs/components/verification");
    await expect(badge(page, "failure")).toContainText("Failure", { timeout: 120_000 });
    await expect(badge(page, "failure")).toContainText("expected");
    await expect(badge(page, "failure")).toContainText("[1, 2]");
  });

  test("an unenforceable bound makes the test itself an Error", async ({ page }) => {
    await page.goto("/docs/components/verification");
    await expect(badge(page, "error-from-a-bound-that-cannot-be-enforced")).toContainText("Error", {
      timeout: 120_000,
    });
  });

  test("a TestID is shown with its test", async ({ page }) => {
    await page.goto("/docs/components/verification");
    await expect(story(page, "testid").locator(".ntr-id")).toHaveText("arithmetic-sanity", { timeout: 120_000 });
  });
});

// --- 8. environments and ui-generation ---------------------------------------------------------

test.describe("environments", () => {
  test("an Animator's filmstrip prints the evaluated frames", async ({ page }) => {
    await page.goto("/docs/components/environments");
    const out = story(page, "an-animator-becomes-a-filmstrip").locator(".env-out");
    await expect(out).toContainText(/sqrt\{2\}|√/, { timeout: 120_000 });
    await expect(out).not.toContainText("sin(");
  });

  // The vdom of `Cell(...)` carries its held expression as children, so the cell has no source.
  test.fail("a control in a cell shows its In and Out when printed", async ({ page }) => {
    await page.goto("/docs/components/environments");
    const cell = story(page, "a-control-in-a-cell").locator(".env-out notatio-cell");
    await expect(cell).toBeVisible({ timeout: 120_000 });
    await expect(cell.locator("notatio-in")).not.toHaveText("", { timeout: 20_000 });
  });

  // The vdom puts the Plot and the Slider in a Column outside any dynamic module, so the
  // slider's `k` never reaches the plot.
  test.fail("a narrow column's plot follows its slider", async ({ page }) => {
    await page.goto("/docs/components/environments");
    const out = story(page, "a-narrow-column").locator(".env-out");
    const curve = out.locator("graphics-box svg path");
    await expect(curve.first()).toBeVisible({ timeout: 20_000 });
  });
});

test("a plot of an unbound symbol is a plot or says why not, never a blank frame", async ({ page }) => {
  await page.goto("/docs/components/ui-generation");
  const plot = story(page, "only-b-is-a-control").locator("graphics-box");
  await expect(plot).toBeVisible({ timeout: 120_000 });
  await expect
    .poll(async () => {
      const drawn = await plot.locator("svg path, svg polyline").count();
      return drawn > 0 || (await plot.innerText()).trim().length > 0;
    })
    .toBe(true);
});
