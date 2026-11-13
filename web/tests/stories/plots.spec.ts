// What a reader sees on the plot pages (BL-322): surfaces that draw, portraits that agree with the
// kernel, ranges that are honored, frames in proportion. Each test names the audit finding it holds
// (S# = site audit, E# = elements audit, BL-319).
//
// WebGL2 tests need a headed Chromium on software GL, so they skip where there is none:
//
//   xvfb-run -a pnpm exec playwright test -c tests/stories/playwright.config.ts plots

import { fileURLToPath } from "node:url";
import type { Locator, Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { withGLSL } from "../../../packages/symbols/analysis/analytic/src/shader.ts";
import { runShader } from "./gpu-support.ts";

/** This checkout's root, which the dev server serves under `/@fs/`. */
const REPO = fileURLToPath(new URL("../../../", import.meta.url));

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

for (const head of ["BesselY", "AiryAi"]) {
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

// --- GPUShaderForm (S#8, E#11) --------------------------------------------------------------------

for (const [url, shader] of [
  ["/docs/components/out#gpushaderform", /float plotFn\(/],
  ["/playground/inspirations/compute-engine", /float plotFn\(/],
  ["/reference/formats/output/glsl", /void main\(\)/],
] as const) {
  test(`GPUShaderForm on ${url} shows the shader, not a dash`, async ({ page }) => {
    await page.goto(url);
    const out = page.locator('notatio-out[form="gpushader"]').first();
    await out.scrollIntoViewIfNeeded();
    await expect(out).toContainText(shader, { timeout: 90_000 });
  });
}

// --- ListPlot3D of scattered points (E#12) ---------------------------------------------------------

test("scattered triples with N -> 3 are binned onto a 3 x 3 grid: 4 quads, axes 0 to 2 (E#12)", async ({ page }) => {
  await page.goto("/reference/component/ListPlot3D#story/scattered-triples-surfaced");
  const box = page.locator('[id="story/scattered-triples-surfaced"] graphics-3d-box').first();
  await box.scrollIntoViewIfNeeded();
  // The floor is one polygon, and each cell of the 3 x 3 grid's mesh another.
  await expect(box.locator("svg polygon")).toHaveCount(1 + 4, { timeout: 60_000 });
  const labels = await box.locator("svg text").allTextContents();
  expect(labels).toContain("2");
  expect(labels).not.toContain("10");
});

// --- Inline notatio-out with format="latex" (S#10) -------------------------------------------------

for (const value of ["e_1", "1 + 2e_1 + 3e_1e_2"]) {
  test(`an inline notatio-out of the LaTeX ${value} draws it (S#10)`, async ({ page }) => {
    await page.goto("/playground/inspirations/ganja");
    const out = page.locator(`notatio-out[inline][format="latex"][value="${value}"]`);
    await out.scrollIntoViewIfNeeded();
    await expect(out).toBeVisible();
    await expect.poll(async () => (await out.boundingBox())?.width ?? 0, { timeout: 60_000 }).toBeGreaterThan(8);
    // Its math is typeset: an element, not an empty span.
    await expect(out.locator(".katex, math, svg").first()).toBeAttached();
  });
}

// --- Prose that disagrees with its own figure (S#12, E#17) --------------------------------------------

test("the tangle's permutation knob says it walks 24 permutations (S#12)", async ({ page }) => {
  await page.goto("/playground/inspirations/tangle");
  const sentence = page.locator('dynamic-module-box:has(knob-box[max="24"]) p', { hasText: "Permutation" }).first();
  await sentence.scrollIntoViewIfNeeded();
  await expect(sentence).toContainText("of 24", { timeout: 60_000 });
  await expect(sentence).not.toContainText(/of 4\b/);
});

test("pressing 0 on a zoomed 2-D plot returns it to its whole range, as the Plot page says (E#17)", async ({
  page,
}) => {
  await page.goto("/reference/component/Plot#story/a-cubic");
  const box = page.locator('[id="story/a-cubic"] graphics-box').first();
  await box.scrollIntoViewIfNeeded();
  const labels = () => box.locator("svg text").allTextContents();
  await expect.poll(async () => (await labels()).length, { timeout: 60_000 }).toBeGreaterThan(1);
  const whole = await labels();
  // Zoom in on the plot with ctrl + wheel.
  const rect = (await box.locator("svg").first().boundingBox())!;
  await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
  await page.keyboard.down("Control");
  for (let i = 0; i < 5; i++) await page.mouse.wheel(0, -200);
  await page.keyboard.up("Control");
  await expect.poll(labels).not.toEqual(whole);
  // The plot takes the key from the keyboard, as a reader tabbing to it does.
  await box.locator(".graphics-box-plot").focus();
  await page.keyboard.press("0");
  // With the pointer off the plot, its hover readout is not among the labels.
  await page.mouse.move(0, 0);
  await expect.poll(labels).toEqual(whole);
});

test("a contour plot zooms about the pointer and keeps its levels; 0 returns it to its whole range", async ({
  page,
}) => {
  await page.goto("/reference/component/ContourPlot#story/concentric-circles");
  const box = page.locator('[id="story/concentric-circles"] graphics-box').first();
  await box.scrollIntoViewIfNeeded();
  const labels = () => box.locator("svg text").allTextContents();
  const rings = () => box.locator("svg g[clip-path] path").count();
  await expect.poll(rings, { timeout: 60_000 }).toBeGreaterThan(1);
  const [whole, all] = [await labels(), await rings()];
  // Zoom in on the middle with ctrl + wheel: the window narrows both ways, about the circles' center.
  const rect = (await box.locator("svg").first().boundingBox())!;
  await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
  await page.keyboard.down("Control");
  for (let i = 0; i < 5; i++) await page.mouse.wheel(0, -200);
  await page.keyboard.up("Control");
  await expect.poll(labels).not.toEqual(whole);
  // The levels are the whole plot's: the outer circles leave the window, and none is refitted into it.
  const inner = await rings();
  expect(inner).toBeGreaterThan(0);
  expect(inner).toBeLessThan(all);
  await box.locator(".graphics-box-plot").focus();
  await page.keyboard.press("0");
  await expect.poll(labels).toEqual(whole);
  await expect.poll(rings).toBe(all);
});

// --- WebGL2 ---------------------------------------------------------------------------------
// Headless Chromium draws WebGL2 on SwiftShader when it is told to (GPU_ARGS); these run headed under
// xvfb-run (WEBGL=1) and skip otherwise, as the portraits are heavy to shade in software.
// `window.__grab(canvas)` is the canvas's current frame as a PNG, null until it has drawn one: a portrait
// keeps its drawing buffer, so the frame is there to read.
const CAPTURE_CANVAS = `// init script: counts a canvas's own draws, and reads its frame back
(()=>{
 if(!window.WebGL2RenderingContext) return;
 const P=WebGL2RenderingContext.prototype, draw=P.drawArrays, drawn=new WeakSet();
 P.drawArrays=function(...a){draw.apply(this,a);if(this.getParameter(this.FRAMEBUFFER_BINDING)===null)drawn.add(this.canvas)};
 window.__grab=(canvas)=>{if(!drawn.has(canvas))return null;return canvas.toDataURL('image/png')};
})();
`;

const GPU_ARGS = ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"];

if (process.env["WEBGL"]) test.use({ headless: false, launchOptions: { args: GPU_ARGS } });

test.describe("on the GPU", () => {
  test.skip(!process.env["WEBGL"], "needs a headed browser with software WebGL2: WEBGL=1 xvfb-run -a …");

  test("a region plot is drawn per pixel under its frame, and stays sharp zoomed in (BL-396)", async ({ page }) => {
    await page.goto("/reference/symbol/RegionPlot#example/disk");
    const box = page.locator('[id="example/disk"] graphics-box[data-plot]').first();
    await box.scrollIntoViewIfNeeded();
    const canvas = box.locator("canvas.graphics-box-field");
    await expect(canvas).toBeVisible({ timeout: 60_000 });
    // The frame is the SVG's; the region and its boundary are the canvas's.
    await expect(box.locator("svg text")).not.toHaveCount(0);
    await expect(box.locator("svg image")).toHaveCount(0);
    /** The alpha of the canvas's pixels along its middle row, as [at the left edge, in the middle]. */
    const alphas = () =>
      canvas.evaluate((el) => {
        const c = el as HTMLCanvasElement;
        const row = c.getContext("2d")!.getImageData(0, c.height >> 1, c.width, 1).data;
        return [row[4 * 2 + 3]!, row[4 * (c.width >> 1) + 3]!];
      });
    // The disk x² + y² < 4 on [-3, 3]²: filled in the middle, clear at the edge.
    await expect.poll(alphas).toEqual([0, expect.any(Number)]);
    expect((await alphas())[1]).toBeGreaterThan(0);
    // Its edge covers a pixel or two of the row, not a grid cell: count the partly covered pixels on the left half.
    const soft = () =>
      canvas.evaluate((el) => {
        const c = el as HTMLCanvasElement;
        const row = c.getContext("2d")!.getImageData(0, c.height >> 1, c.width >> 1, 1).data;
        let fill = 0;
        for (let i = (c.width >> 1) - 1; i >= 0 && fill === 0; i--) fill = row[4 * i + 3]!;
        let count = 0;
        for (let i = 0; i < c.width >> 1; i++) if (row[4 * i + 3]! > 0 && row[4 * i + 3]! < fill) count++;
        return count;
      });
    expect(await soft()).toBeLessThanOrEqual(4);
    // Zoomed in on the middle, the window is inside the disk: the left edge is filled too.
    const rect = (await box.locator("svg").first().boundingBox())!;
    await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
    await page.keyboard.down("Control");
    for (let i = 0; i < 8; i++) await page.mouse.wheel(0, -200);
    await page.keyboard.up("Control");
    await expect.poll(async () => (await alphas())[0]).toBeGreaterThan(0);
    await box.locator(".graphics-box-plot").focus();
    await page.keyboard.press("0");
    await expect.poll(async () => (await alphas())[0]).toBe(0);
  });

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

  /**
   * `hurwitz(s, a)` on the GPU and the double-precision kernel, over a grid of a (x over ±xSpan, y over
   * [-ySpan, ySpan]): the error of one against the other, whether the shader declined, and how many times
   * the sum the double kernel's largest term is (its own cancellation, which its digits go with).
   */
  async function hurwitzGrid(page: Page, s: [number, number], step: number, xSpan: number, ySpan = xSpan) {
    const points: [number, number][] = [];
    for (let y = -ySpan; y <= ySpan; y += step)
      for (let x = -xSpan; x <= xSpan; x += step) points.push([Math.fround(x + 0.013), Math.fround(y - 0.0071)]);
    return hurwitzAt(page, s, points);
  }

  async function hurwitzAt(page: Page, s: [number, number], a: [number, number][]) {
    const host = `uniform sampler2D inp;
out vec4 fragColor;
void main() {
  vec4 p = texelFetch(inp, ivec2(gl_FragCoord.xy), 0);
  uncertain = 0.0;
  vec2 v = hurwitz(p.xy, p.zw);
  fragColor = vec4(v, uncertain, 0.0);
}`;
    const gpu = await runShader(
      page,
      withGLSL(host),
      a.map(([ar, ai]) => [s[0], s[1], ar, ai] as const),
    );
    return page.evaluate(
      async ([gpu, sr, si, points, repo]) => {
        const cpu = await import(
          `/@fs${repo}packages/ce-patches/src/compute-engine/numerics/hurwitz-zeta.ts` as string
        );
        return points.map(([ar, ai], i) => {
          const exact = cpu.hurwitzZeta({ re: sr, im: si }, { re: ar!, im: ai! }) as { re: number; im: number };
          const { value, largest } = cpu.hurwitzEMWithLargest({ re: sr, im: si }, { re: ar!, im: ai! }) as {
            value: { re: number; im: number };
            largest: number;
          };
          const err = Math.hypot(gpu[4 * i]! - exact.re, gpu[4 * i + 1]! - exact.im) / Math.hypot(exact.re, exact.im);
          return { a: [ar, ai], err, declined: gpu[4 * i + 2]! > 0.5, cond: largest / Math.hypot(value.re, value.im) };
        });
      },
      [gpu, s[0], s[1], a, REPO] as const,
    );
  }

  // Measured on the GPU (swiftshader) over a in [-6, 6]^2 and [-58, 58] x [-32, 32], the portrait's zoom range: f32 hatched
  // 40% of the lower half at s = 1.5 + 4i and 70% at 12i, 0 above. The df64 sum hatches none at 4i and 10% (the
  // small window) and 21% (the whole range) at 12i, where e^(-12 |arg a|) is below 1e-9 of the terms.
  for (const [si, hatchedSmall, hatchedWide] of [
    [4, 0, 0],
    [12, 0.15, 0.25],
  ] as const) {
    test(`the GPU HurwitzZeta kernel at s = 1.5 + ${si}i agrees with the CPU kernel wherever it draws and declines only where its df64 sum cannot vouch (S#5, BL-336)`, async ({
      page,
    }) => {
      await page.goto("/explore/zeta/phase-portrait");
      const small = await hurwitzGrid(page, [1.5, si], 0.5, 6);
      const wide = await hurwitzGrid(page, [1.5, si], 2, 58, 32);
      for (const [grid, hatched] of [
        [small, hatchedSmall],
        [wide, hatchedWide],
      ] as const) {
        const below = grid.filter((p) => p.a[1]! < 0);
        // Above the real axis every point is drawn; below it only a share is hatched, and nothing is drawn where
        // the sum has lost more than the 1e9 the kernel vouches to: its terms are cond times the sum.
        expect(grid.filter((p) => p.a[1]! > 0 && p.declined)).toEqual([]);
        expect(below.filter((p) => p.declined).length / below.length).toBeLessThanOrEqual(hatched);
        for (const p of grid) {
          if (p.declined) expect(p.cond).toBeGreaterThan(1e8);
          else if (Number.isFinite(p.err)) {
            expect(p.cond).toBeLessThan(1e10);
            // A drawn value is within 0.05 of the exact one (measured 0.023 at most, at a sum f32 still draws), no
            // terraces of noise below the axis; one that needed df64 to be drawn is good to 1e-3 (measured 3e-4).
            expect(p.err).toBeLessThan(0.05);
            if (p.cond > 1e3) expect(p.err).toBeLessThan(1e-3);
          }
        }
        // The df64 sum draws most of what f32 declined: past the real axis hatching is the exception.
        expect(below.filter((p) => !p.declined).length).toBeGreaterThan(below.length * 0.7);
      }
      if (si === 12) expect(wide.some((p) => p.declined)).toBe(true);
    });
  }

  test("the GPU HurwitzZeta kernel declines past its 96 direct terms, where the Euler–Maclaurin tail would start under 0.75 of emEdge (S#5, BL-336)", async ({
    page,
  }) => {
    await page.goto("/explore/zeta/phase-portrait");
    // s = 1.5 + 12i: emEdge is 19, so the direct sum from a reaches 19 only for Re a above 19 - 96 = -77, and the
    // tail may start at 0.75 * 19 = 14, Re a above -82. Above the real axis nothing cancels, so any hatch there is the cap.
    const at = await hurwitzAt(
      page,
      [1.5, 12],
      [
        [-60.3, 2.5],
        [-80.3, 2.5],
        [-90.3, 2.5],
        [-100.3, 2.5],
        [-90.3, 30.5],
      ],
    );
    expect(at.map((p) => p.declined)).toEqual([false, false, true, true, true]);
    for (const p of at.filter((p) => !p.declined)) expect(p.err).toBeLessThan(0.05);
  });

  // A portrait of HurwitzZeta(1.5 + si i, a) over a window of height `extent`, read back as pixels: for a lattice of
  // pixels below the real axis, whether it is the grey hatch and how many times its sum the double kernel's largest term is.
  async function hatchedPixels(page: Page, si: number, extent: number, selfTest?: "fail") {
    await page.addInitScript(CAPTURE_CANVAS);
    if (selfTest) await page.addInitScript((v) => ((globalThis as any).__notatioDf64SelfTest = v), selfTest);
    await page.goto("/explore/zeta/phase-portrait");
    await page.evaluate(
      ([si, extent]) => {
        const el = document.createElement("notatio-complex-plot");
        el.setAttribute("value", `HurwitzZeta(1.5 + ${si} * i, z)`);
        el.setAttribute("extent", String(extent));
        el.setAttribute("height", "380");
        el.id = "hurwitz-portrait";
        document.querySelector("main, .vp-doc, body")!.prepend(el);
      },
      [si, extent] as const,
    );
    const canvas = page.locator("#hurwitz-portrait canvas").first();
    await canvas.scrollIntoViewIfNeeded();
    const read = () =>
      canvas.evaluate(
        async (c: HTMLCanvasElement, [si, extent, repo]) => {
          const url = (window as unknown as { __grab(c: HTMLCanvasElement): string | null }).__grab(c);
          if (!url) return undefined;
          const cpu = await import(
            `/@fs${repo}packages/ce-patches/src/compute-engine/numerics/hurwitz-zeta.ts` as string
          );
          const img = new Image();
          img.src = url;
          await img.decode();
          const flat = document.createElement("canvas");
          flat.width = img.width;
          flat.height = img.height;
          const ctx = flat.getContext("2d")!;
          ctx.drawImage(img, 0, 0);
          const data = ctx.getImageData(0, 0, img.width, img.height).data;
          const out: { grey: boolean; cond: number; above: boolean; re: number }[] = [];
          // The window is centered on the origin, y up, and as wide as its aspect says.
          for (let py = 3; py < img.height; py += 7)
            for (let px = 3; px < img.width; px += 7) {
              const k = 4 * (py * img.width + px);
              const [r, g, b] = [data[k]!, data[k + 1]!, data[k + 2]!];
              const re = ((px + 0.5) / img.width - 0.5) * extent! * (img.width / img.height);
              const im = (0.5 - (py + 0.5) / img.height) * extent!;
              const { value, largest } = cpu.hurwitzEMWithLargest({ re: 1.5, im: si! }, { re, im }) as {
                value: { re: number; im: number };
                largest: number;
              };
              out.push({
                grey: Math.max(r, g, b) - Math.min(r, g, b) <= 2 && r >= 40 && r <= 95,
                cond: largest / Math.hypot(value.re, value.im),
                above: im > 0,
                re,
              });
            }
          return out;
        },
        [si, extent, REPO] as const,
      );
    await expect.poll(read, { timeout: 120_000 }).toBeDefined();
    return (await read())!;
  }

  // Hatched where the df64 sum cannot vouch (the double kernel's terms 1e9 times its sum), drawn elsewhere: the lattice
  // is read off the pixels, the cancellation off the double kernel at the pixel's a. Measured on the GPU, the lower
  // half of a 1263 x 380 portrait: f32 hatched 35% (4i) and 42% (12i) of a window 8 high, 52% of one 64 high (the
  // whole zoom range); df64 hatches none of the first two and 34% of the third, 12% of the width of it being the
  // term cap, left of Re a = -82.
  for (const [si, extent, hatched] of [
    [4, 8, 0],
    [12, 8, 0],
    [12, 64, 0.4],
  ] as const) {
    test(`the HurwitzZeta portrait at s = 1.5 + ${si}i over a window ${extent} high hatches what the df64 kernel cannot vouch for, and nothing above the real axis (S#5, BL-336)`, async ({
      page,
    }) => {
      const pixels = await hatchedPixels(page, si, extent);
      const below = pixels.filter((p) => !p.above);
      // (Left of Re a = -82 the kernel declines for want of direct terms, above the axis as well.)
      const near = pixels.filter((p) => p.above && p.re > -80);
      expect(near.filter((p) => p.grey).length / near.length).toBeLessThan(0.01);
      expect(below.filter((p) => p.grey).length / below.length).toBeLessThanOrEqual(hatched);
      // A hatched pixel is one the kernel's terms dwarf; a drawn one is not past the kernel's limit.
      expect(below.filter((p) => p.grey && p.cond < 1e8 && p.re > -80)).toEqual([]);
      expect(below.filter((p) => !p.grey && p.cond > 1e10)).toEqual([]);
      if (hatched > 0) expect(below.filter((p) => p.grey).length / below.length).toBeGreaterThan(hatched / 3);
    });
  }

  // A device that fails the df64 self-test draws the f32 kernel: it hatches what f32 hatched (35% of the lower half
  // at 4i and 42% at 12i, window 8 high, measured), every pixel whose terms dwarf the sum 100-fold, and draws no df64.
  for (const [si, least] of [
    [4, 0.25],
    [12, 0.3],
  ] as const) {
    test(`the HurwitzZeta portrait at s = 1.5 + ${si}i on a device that fails the df64 self-test hatches what f32 cannot vouch for (S#5, BL-336)`, async ({
      page,
    }) => {
      const logs: string[] = [];
      page.on("console", (m) => logs.push(m.text()));
      const pixels = await hatchedPixels(page, si, 8, "fail");
      const below = pixels.filter((p) => !p.above);
      expect(logs.some((l) => l.includes("df64 self-test failed"))).toBe(true);
      expect(below.filter((p) => p.grey).length / below.length).toBeGreaterThan(least);
      // f32's bar is a ratio of 100 (the measured f32 sum is good to 2.6e-2 there): nothing past 1e4 is drawn, nothing under 10 hatched.
      expect(below.filter((p) => !p.grey && p.cond > 1e4)).toEqual([]);
      expect(below.filter((p) => p.grey && p.cond < 10)).toEqual([]);
      expect(pixels.filter((p) => p.above && p.grey).length / pixels.filter((p) => p.above).length).toBeLessThan(0.01);
    });
  }

  test("the df64 self-test passes on this device and the portrait draws df64 (S#5, BL-336)", async ({ page }) => {
    const logs: string[] = [];
    page.on("console", (m) => logs.push(m.text()));
    const pixels = await hatchedPixels(page, 12, 8);
    expect(logs.some((l) => l.includes("df64 self-test passed"))).toBe(true);
    const below = pixels.filter((p) => !p.above);
    expect(below.filter((p) => p.grey).length).toBe(0);
  });
});
