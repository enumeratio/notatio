// What a reader sees on the plot pages (BL-322): surfaces that draw, portraits that agree with the
// kernel, ranges that are honored, frames in proportion. Each test names the audit finding it holds
// (S# = site audit, E# = elements audit, BL-319).
//
// WebGPU tests need a headed Chromium with a software adapter, so they skip where there is none:
//
//   xvfb-run -a pnpm exec playwright test -c tests/stories/playwright.config.ts plots

import { fileURLToPath } from "node:url";
import type { Locator, Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

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
  ["/docs/components/out#gpushaderform", /fn plotFn\(/],
  ["/playground/inspirations/compute-engine", /fn plotFn\(/],
  ["/reference/formats/output/wgsl", /@fragment/],
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

// --- WebGPU ---------------------------------------------------------------------------------
// Headless Chromium has no adapter, and destroys a device whose canvas is configured; these run
// headed on a software adapter (WEBGPU=1, under xvfb-run) and skip otherwise.
// Copies each presented WebGPU canvas texture to a buffer, so `window.__grab(canvas)` reads its pixels:
// a screenshot of a WebGPU canvas is blank.
const CAPTURE_CANVAS = `// init script: makes WebGPU canvases readable by copying each presented texture to a buffer
(()=>{
 if(!window.GPUCanvasContext) return;
 const P=GPUCanvasContext.prototype;
 const conf=P.configure, gct=P.getCurrentTexture;
 const ctxs=new Set();
 P.configure=function(cfg){this.__cfg=cfg;this.__dev=cfg.device;ctxs.add(this);return conf.call(this,{...cfg,usage:(cfg.usage||0x10)|0x01|0x04|0x10});};
 P.getCurrentTexture=function(){const t=gct.call(this);this.__tex=t;this.__pending=true;return t;};
 const sub=GPUQueue.prototype.submit;
 window.__pix=new WeakMap();
 GPUQueue.prototype.submit=function(cmds){
  sub.call(this,cmds);
  for(const c of ctxs){
   if(!c.__pending||!c.__tex) continue;
   const dev=c.__dev; if(dev.queue!==this) continue;
   const t=c.__tex; c.__pending=false;
   try{
    const w=t.width,h=t.height,bpr=Math.ceil(w*4/256)*256;
    const buf=dev.createBuffer({size:bpr*h,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST});
    const enc=dev.createCommandEncoder();enc.copyTextureToBuffer({texture:t},{buffer:buf,bytesPerRow:bpr},[w,h]);
    sub.call(this,[enc.finish()]);
    const fmt=t.format;
    buf.mapAsync(GPUMapMode.READ).then(()=>{const src=new Uint8Array(buf.getMappedRange().slice(0));const out=new Uint8ClampedArray(w*h*4);
      for(let y=0;y<h;y++)for(let x=0;x<w;x++){const s=y*bpr+x*4,d=(y*w+x)*4;if(fmt.startsWith('bgra')){out[d]=src[s+2];out[d+1]=src[s+1];out[d+2]=src[s];}else{out[d]=src[s];out[d+1]=src[s+1];out[d+2]=src[s+2];}out[d+3]=255;}
      window.__pix.set(c.canvas,{w,h,out,n:(window.__pix.get(c.canvas)?.n||0)+1});buf.unmap();buf.destroy()}).catch(e=>console.log('capture fail '+e));
   }catch(e){console.log('capture err '+e)}
  }
 };
 window.__grab=(canvas)=>{const r=window.__pix.get(canvas);if(!r)return null;const c=document.createElement('canvas');c.width=r.w;c.height=r.h;c.getContext('2d').putImageData(new ImageData(r.out,r.w,r.h),0,0);return c.toDataURL('image/png')};
})();
`;

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

  /** `hurwitz(s, a)` on the GPU and the double-precision kernel, over a grid of a: both values, and whether the shader declined. */
  async function hurwitzGrid(page: Page, s: [number, number], step: number, span: number) {
    return page.evaluate(
      async ([sr, si, step, span, repo]) => {
        const { zetaWGSL } = await import(`/@fs${repo}packages/symbols/analysis/analytic/src/shader.ts` as string);
        const cpu = await import(
          `/@fs${repo}packages/ce-patches/src/compute-engine/numerics/hurwitz-zeta.ts` as string
        );
        const points: number[][] = [];
        for (let y = -span; y <= span; y += step)
          for (let x = -span; x <= span; x += step) points.push([sr!, si!, x + 0.013, y - 0.0071]);
        const n = points.length;
        const code = `${zetaWGSL}
@group(0) @binding(0) var<storage, read> inp : array<vec4f>;
@group(0) @binding(1) var<storage, read_write> outp : array<vec4f>;
@compute @workgroup_size(1) fn main(@builtin(global_invocation_id) g : vec3u) {
  let p = inp[g.x]; uncertain = 0.0; let v = hurwitz(p.xy, p.zw); outp[g.x] = vec4f(v, uncertain, 0.0);
}`;
        const adapter = await navigator.gpu.requestAdapter();
        const device = await adapter!.requestDevice();
        const pipeline = device.createComputePipeline({
          layout: "auto",
          compute: { module: device.createShaderModule({ code }), entryPoint: "main" },
        });
        const input = device.createBuffer({ size: n * 16, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST });
        device.queue.writeBuffer(input, 0, new Float32Array(points.flat()));
        const output = device.createBuffer({ size: n * 16, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC });
        const read = device.createBuffer({ size: n * 16, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ });
        const bind = device.createBindGroup({
          layout: pipeline.getBindGroupLayout(0),
          entries: [
            { binding: 0, resource: { buffer: input } },
            { binding: 1, resource: { buffer: output } },
          ],
        });
        const encoder = device.createCommandEncoder();
        const pass = encoder.beginComputePass();
        pass.setPipeline(pipeline);
        pass.setBindGroup(0, bind);
        pass.dispatchWorkgroups(n);
        pass.end();
        encoder.copyBufferToBuffer(output, 0, read, 0, n * 16);
        device.queue.submit([encoder.finish()]);
        await read.mapAsync(GPUMapMode.READ);
        const gpu = new Float32Array(read.getMappedRange().slice(0));
        return points.map(([sr, si, ar, ai], i) => {
          const exact = cpu.hurwitzZeta({ re: sr, im: si }, { re: ar, im: ai }) as { re: number; im: number };
          const err = Math.hypot(gpu[4 * i]! - exact.re, gpu[4 * i + 1]! - exact.im) / Math.hypot(exact.re, exact.im);
          return { a: [ar, ai], err, declined: gpu[4 * i + 2]! > 0.5 };
        });
      },
      [s[0], s[1], step, span, REPO] as const,
    );
  }

  for (const si of [4, 12]) {
    test(`the GPU HurwitzZeta kernel at s = 1.5 + ${si}i agrees with the CPU kernel wherever it draws (S#5)`, async ({
      page,
    }) => {
      await page.goto("/explore/zeta/phase-portrait");
      const grid = await hurwitzGrid(page, [1.5, si], 0.5, 6);
      const drawn = grid.filter((p) => !p.declined && Number.isFinite(p.err));
      // Above the real axis every point is drawn, below it the kernel declines where its sum has lost the digits.
      expect(grid.filter((p) => p.a[1]! > 0 && p.declined)).toEqual([]);
      expect(grid.filter((p) => p.a[1]! < 0 && p.declined).length).toBeGreaterThan(0);
      expect(drawn.length).toBeGreaterThan(grid.length / 3);
      // A drawn value is within 0.05 of the exact one: no terraces of noise below the axis.
      for (const p of drawn) expect(p.err).toBeLessThan(0.05);
    });
  }

  test("the HurwitzZeta portrait hatches what the kernel declines below the real axis, and nothing above it (S#5)", async ({
    page,
  }) => {
    await page.addInitScript(CAPTURE_CANVAS);
    await page.goto("/explore/zeta/phase-portrait");
    const canvas = page.locator('notatio-complex-plot[value^="HurwitzZeta"] canvas').first();
    await canvas.scrollIntoViewIfNeeded();
    const share = async () =>
      canvas.evaluate(async (c: HTMLCanvasElement) => {
        const url = (window as unknown as { __grab(c: HTMLCanvasElement): string | null }).__grab(c);
        if (!url) return undefined;
        const img = new Image();
        img.src = url;
        await img.decode();
        const flat = document.createElement("canvas");
        flat.width = img.width;
        flat.height = img.height;
        const ctx = flat.getContext("2d")!;
        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, img.width, img.height).data;
        // The view is centered on the real axis: the top half of the canvas is Im a > 0.
        const half = Math.floor(img.height / 2);
        const grey = [0, 0];
        for (let y = 0; y < img.height; y++)
          for (let x = 0; x < img.width; x++) {
            const k = 4 * (y * img.width + x);
            const [r, g, b] = [data[k]!, data[k + 1]!, data[k + 2]!];
            if (Math.max(r, g, b) - Math.min(r, g, b) <= 2 && r >= 40 && r <= 95) grey[y < half ? 0 : 1]!++;
          }
        return { above: grey[0]! / (half * img.width), below: grey[1]! / ((img.height - half) * img.width) };
      });
    await expect.poll(share, { timeout: 90_000 }).toBeDefined();
    const { above, below } = (await share())!;
    expect(above).toBeLessThan(0.01);
    expect(below).toBeGreaterThan(0.1);
  });
});
