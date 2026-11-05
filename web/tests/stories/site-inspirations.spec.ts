// /playground/inspirations/*: the demos whose behavior works today, checked against the values
// their prose states. Inline figures (sage, tangle) and the complex-plot portraits belong to the
// figures-controls spec and gpu.spec.ts. A knob is moved with the arrow keys; its `aria-valuenow`
// is what a reader reads off it.
//
// Run: STORIES_PORT=<port> node node_modules/@playwright/test/cli.js test -c tests/stories/playwright.config.ts site-inspirations

import type { Locator } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { curveOf, keyKnob, peaks, settled } from "./support.ts";

/** The readouts sharing a knob's `dynamic-module-box`, in page order (a readout's `value` attribute holds its result). */
const readouts = (knob: Locator) => knob.locator("xpath=ancestor::dynamic-module-box[1]").locator("dynamic-box");

test.describe("compute-engine", () => {
  test("a cell evaluates exactly, and the knob drives exact and numeric readouts", async ({ page }) => {
    await page.goto("/playground/inspirations/compute-engine/");
    // 1/2 + 1/3 = 5/6, exact.
    expect(await settled(page.locator("notatio-cell").first().locator("notatio-out"))).toBe("5 / 6");
    const knob = page.locator("knob-box[name=n]").first();
    await expect(knob.getByRole("slider")).toHaveAttribute("aria-valuenow", "12");
    const exact = page.locator("dynamic-box[digits='0']").first();
    const numeric = page.locator("dynamic-box[digits='12']").first();
    // sqrt(12) = 2 sqrt(3) = 3.46410161514 (mpmath 3.46410161513775...).
    await expect(exact).toHaveAttribute("value", "2 * sqrt(3)");
    await expect(numeric).toContainText("3.46410161514");
    // Five steps up: sqrt(17) = 4.12310562562 (mpmath 4.12310562561766...).
    await keyKnob(knob.getByRole("slider"), 17);
    await expect(exact).toHaveAttribute("value", "sqrt(17)");
    await expect(numeric).toContainText("4.12310562562");
  });
});

test.describe("wolfram", () => {
  test("A sin(w x): the curve has w periods per 2 pi and A scales it, and the form is Wolfram's", async ({ page }) => {
    await page.goto("/playground/inspirations/wolfram/");
    const manipulate = page.locator("notatio-manipulate").first();
    const svg = manipulate.locator("graphics-box svg[role=img]");
    const sliderA = manipulate.locator("slider-box[name=A] input");
    const sliderW = manipulate.locator("slider-box[name=w] input");
    await expect(sliderA).toBeVisible();
    // A = 1, w = 2 over [-2pi, 2pi]: w * 4pi / 2pi = 4 periods.
    let curve = await curveOf(svg);
    expect(peaks(curve.ys)).toBe(4);
    expect(Math.max(...curve.ys)).toBeCloseTo(1, 1);
    // A = 2 touches the +-2 range.
    await sliderA.fill("2");
    await expect(async () => {
      curve = await curveOf(svg);
      expect(Math.max(...curve.ys)).toBeCloseTo(2, 1);
    }).toPass();
    // w = 6 has 12 periods.
    await sliderW.fill("6");
    await expect(async () => expect(peaks((await curveOf(svg)).ys)).toBe(12)).toPass();
    // Reset: A = 1, w = 2 restores the opening curve.
    await sliderA.fill("1");
    await sliderW.fill("2");
    await expect(async () => expect(peaks((await curveOf(svg)).ys)).toBe(4)).toPass();

    // The binomial's WolframFullForm.
    await expect(page.locator("notatio-out[form=wolfram]")).toContainText("Binomial[n, k]");
  });
});

test.describe("mathlib", () => {
  test("strings, partitions and complex numbers order as the prose says", async ({ page }) => {
    await page.goto("/playground/inspirations/mathlib/");
    const out = (value: string) => page.locator(`notatio-cell[value='${value}'] notatio-out`);
    // Strings are a linear order: clamping "zebra" into [cat, moose] gives moose.
    expect(await settled(out('Clamp("zebra", "cat", "moose")'))).toBe('"moose"');
    // [3,1,1,1] and [2,2,2] are incomparable; their meet has partial sums min(3,2), min(4,4), min(5,6), min(6,6)
    // = 2, 4, 5, 6, that is the partition [2,2,1,1].
    expect(await settled(out("Min(IntegerPartition([3, 1, 1, 1]), IntegerPartition([2, 2, 2]))"))).toBe(
      "IntegerPartition([2, 2, 1, 1])",
    );
    // Floor works on the parts of a Gaussian: floor(2.5 + 3.7i) = 2 + 3i.
    expect(await settled(out("Floor(2.5 + 3.7i)"))).toBe("2 + 3i");
  });
});

test.describe("tangle", () => {
  test("knobs in prose drive the numbers they sit in", async ({ page }) => {
    await page.goto("/playground/inspirations/tangle/");
    const doc = page.locator(".vp-doc");
    const knob = (name: string, max: string) => doc.locator(`knob-box[name=${name}][max='${max}']`).getByRole("slider");
    // Cookies: n x 50 calories.
    const cookies = knob("n", "12");
    await expect(cookies).toHaveAttribute("aria-valuenow", "3");
    await expect(readouts(cookies).first()).toContainText("150");
    await keyKnob(cookies, 5);
    await expect(readouts(cookies).first()).toContainText("250");
    // 1.05^10 = 1.628894626777442 (python).
    await expect(readouts(knob("r", "0.25")).first()).toContainText("1.62889");
    // A 25000 loan at 6% over 30 years: 360 payments of 149.8876 = 53959.55 (python).
    await expect(readouts(knob("p", "500000")).first()).toContainText("53959.55");
    // 3 + 2i: |z| = sqrt(13) = 3.60555, arg = atan(2/3) = 0.588003, z^2 = 5 + 12i.
    const z = doc.locator("knob-box[name=z]").getByRole("slider");
    await expect(readouts(z).nth(0)).toContainText("3.60555");
    await expect(readouts(z).nth(1)).toContainText("0.588003");
    await expect(readouts(z).nth(2)).toContainText("5+12i");
    // Ground set of n elements has 2^n subsets: n = 5 gives 32.
    await expect(readouts(knob("n", "9")).first()).toContainText("32");
    // A graph on v vertices has C(v, 2) edges: 4 vertices give 6, 10 give 45.
    const vertices = knob("v", "10");
    await expect(readouts(vertices).first()).toContainText("6");
    await keyKnob(vertices, 10);
    await expect(readouts(vertices).first()).toContainText("45");
    // sin(kx) crosses zero 2k + 1 times on [-pi, pi]: k = 3 gives 7, k = 8 gives 17.
    const crossings = knob("k", "8");
    await expect(readouts(crossings).first()).toContainText("7");
    await keyKnob(crossings, 8);
    await expect(readouts(crossings).first()).toContainText("17");
  });
});

test.describe("ganja", () => {
  test("p, q, r choose the algebra: its dimension and basis follow", async ({ page }) => {
    await page.goto("/playground/inspirations/ganja/");
    const knob = (name: string) => page.locator(`knob-box[name=${name}]`).first().getByRole("slider");
    const [p, q, r] = [knob("p"), knob("q"), knob("r")];
    const [basis, dimension] = [readouts(p).nth(0), readouts(p).nth(1)];
    // Cl(2,0,1): dimension 2^3 = 8, basis 1, e1, e2, theta1, e1e2, e1theta1, e2theta1, e1e2theta1.
    await expect(p).toHaveAttribute("aria-valuenow", "2");
    await expect(dimension).toHaveText(/8/);
    await expect(basis).toHaveAttribute(
      "value",
      /^\[1, e_1, e_2, theta_1, e_1 \* e_2, e_1 \* theta_1, e_2 \* theta_1, e_1 \* e_2 \*\s+theta_1\]$/,
    );
    // Cl(0,2,0): dimension 4, generators f1, f2.
    await keyKnob(p, 0);
    await keyKnob(q, 2);
    await keyKnob(r, 0);
    await expect(dimension).toHaveText(/4/);
    await expect(basis).toHaveAttribute("value", /^\[1, f_1, f_2/);
    // Cl(3,0,0): dimension 8 again.
    await keyKnob(q, 0);
    await keyKnob(p, 3);
    await expect(dimension).toHaveText(/8/);
  });

  test("the wedge anticommutes and squares to zero", async ({ page }) => {
    await page.goto("/playground/inspirations/ganja/");
    // The first module without a knob is the four operator examples, in order.
    const boxes = page
      .locator("dynamic-module-box")
      .filter({ hasNot: page.locator("knob-box") })
      .first()
      .locator("dynamic-box");
    // e1 ^ e2 = e1e2, e2 ^ e1 = -e1e2, e1 ^ e1 = 0, e1 * e1 = 1 in Cl(2,0).
    await expect(boxes.nth(0)).toHaveText(/^\s*\S*e\s*1\s*e\s*2/);
    await expect(boxes.nth(1)).toHaveText(/^\s*−/);
    await expect(boxes.nth(2)).toHaveText(/^[\s\u200b]*0[\s\u200b0]*$/);
    await expect(boxes.nth(3)).toHaveText(/^[\s\u200b]*1[\s\u200b1]*$/);
  });

  test("duals: the pseudoscalar, the dual of e1 and their wedge in dimension n; PGA's pseudoscalar squares to zero", async ({
    page,
  }) => {
    await page.goto("/playground/inspirations/ganja/");
    const n = page.locator("knob-box[name=n][max='5']").getByRole("slider");
    const dual = readouts(n);
    // n = 2: I = e1e2, the dual of e1 is e2, and e1 ^ e2 = I.
    await keyKnob(n, 2);
    await expect(dual.nth(0)).toHaveAttribute("value", "e_1 * e_2");
    await expect(dual.nth(1)).toHaveAttribute("value", "e_2");
    await expect(dual.nth(2)).toHaveAttribute("value", "e_1 * e_2");
    // n = 3: the same e1 dualizes to e2e3, and wedging back gives e1e2e3.
    await keyKnob(n, 3);
    await expect(dual.nth(0)).toHaveAttribute("value", "e_1 * e_2 * e_3");
    await expect(dual.nth(1)).toHaveAttribute("value", "e_2 * e_3");
    await expect(dual.nth(2)).toHaveAttribute("value", "e_1 * e_2 * e_3");
  });

  test("grade parts and the two involutions of 1 + 2e1 + 3e1e2", async ({ page }) => {
    await page.goto("/playground/inspirations/ganja/");
    const k = page.locator("knob-box[name=k]").first().getByRole("slider");
    const boxes = readouts(k);
    await expect(k).toHaveAttribute("aria-valuenow", "1");
    await expect(boxes.nth(0)).toHaveAttribute("value", "2 * e_1");
    await keyKnob(k, 2);
    await expect(boxes.nth(0)).toHaveAttribute("value", "3 * e_1 * e_2");
    await keyKnob(k, 0);
    await expect(boxes.nth(0)).toHaveAttribute("value", "1");
    // Reversion flips the bivector (e2e1 = -e1e2); the grade involution flips the vector.
    await expect(boxes.nth(1)).toContainText("−3");
    await expect(boxes.nth(2)).toContainText("−2");
  });

  test("the pseudoscalar of Cl(2,0,1) has no inverse: its square is zero, and its complement dual still exists", async ({
    page,
  }) => {
    await page.goto("/playground/inspirations/ganja/");
    // The second module without a knob: I, I * I, and the dual of theta1.
    const boxes = page
      .locator("dynamic-module-box")
      .filter({ hasNot: page.locator("knob-box") })
      .nth(1)
      .locator("dynamic-box");
    await expect(boxes.nth(0)).toHaveText(/e\s*1\s*e\s*2\s*θ\s*1/);
    await expect(boxes.nth(1)).toHaveText(/^[\s\u200b]*0[\s\u200b0]*$/);
    // theta1 ^ (e1e2) = e1e2theta1 = I, so the dual of theta1 is e1e2.
    await expect(boxes.nth(2)).toHaveText(/e\s*1\s*e\s*2/);
  });
});
