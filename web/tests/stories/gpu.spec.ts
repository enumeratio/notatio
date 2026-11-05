// WebGPU portraits, read back as pixels. A screenshot of a WebGPU canvas is blank, so an init
// script copies each presented texture into a buffer (the way the audits' gpucap.js did) and
// exposes the pixels per canvas. Run with playwright.gpu.config.ts under `xvfb-run -a`.

import type { Locator, Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

/** Makes every configured WebGPU canvas readable: COPY_SRC on its usage and a copy of each frame. */
function installCapture(): void {
  if (!("GPUCanvasContext" in window)) return;
  const proto = GPUCanvasContext.prototype as any;
  const configure = proto.configure;
  const getCurrentTexture = proto.getCurrentTexture;
  const contexts = new Set<any>();
  proto.configure = function (cfg: any) {
    this.__device = cfg.device;
    contexts.add(this);
    return configure.call(this, { ...cfg, usage: (cfg.usage ?? 0x10) | 0x01 | 0x04 | 0x10 });
  };
  proto.getCurrentTexture = function () {
    const texture = getCurrentTexture.call(this);
    this.__texture = texture;
    this.__pending = true;
    return texture;
  };
  const pixels = new WeakMap<HTMLCanvasElement, { w: number; h: number; rgba: Uint8ClampedArray }>();
  (window as any).__pixels = pixels;
  const submit = Reflect.get(GPUQueue.prototype, "submit") as (
    this: GPUQueue,
    commands: Iterable<GPUCommandBuffer>,
  ) => undefined;
  GPUQueue.prototype.submit = function (commands) {
    submit.call(this, commands);
    for (const c of contexts) {
      const device: GPUDevice = c.__device;
      if (!c.__pending || !c.__texture || device.queue !== this) continue;
      c.__pending = false;
      const texture: GPUTexture = c.__texture;
      const w = texture.width;
      const h = texture.height;
      const bytesPerRow = Math.ceil((w * 4) / 256) * 256;
      const buffer = device.createBuffer({
        size: bytesPerRow * h,
        usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
      });
      const encoder = device.createCommandEncoder();
      encoder.copyTextureToBuffer({ texture }, { buffer, bytesPerRow }, [w, h]);
      submit.call(this, [encoder.finish()]);
      const bgra = texture.format.startsWith("bgra");
      void buffer.mapAsync(GPUMapMode.READ).then(() => {
        const src = new Uint8Array(buffer.getMappedRange().slice(0));
        const rgba = new Uint8ClampedArray(w * h * 4);
        for (let y = 0; y < h; y++)
          for (let x = 0; x < w; x++) {
            const s = y * bytesPerRow + x * 4;
            const d = (y * w + x) * 4;
            rgba[d] = src[s + (bgra ? 2 : 0)];
            rgba[d + 1] = src[s + 1];
            rgba[d + 2] = src[s + (bgra ? 0 : 2)];
            rgba[d + 3] = 255;
          }
        pixels.set(c.canvas, { w, h, rgba });
        buffer.unmap();
        buffer.destroy();
      });
    }
  };
}

interface PixelStats {
  /** Pixels that are not black. */
  lit: number;
  total: number;
  /** Distinct 30-degree hue sectors holding at least 1% of the saturated pixels. */
  hues: number;
}

/** What a canvas has drawn, from the captured frame; null until one has been presented. */
async function readCanvas(canvas: Locator): Promise<PixelStats | null> {
  return canvas.evaluate((node) => {
    const frame = (window as any).__pixels?.get(node) as { w: number; h: number; rgba: Uint8ClampedArray } | undefined;
    if (!frame) return null;
    const sectors = new Array<number>(12).fill(0);
    let lit = 0;
    let saturated = 0;
    for (let i = 0; i < frame.rgba.length; i += 4) {
      const r = frame.rgba[i];
      const g = frame.rgba[i + 1];
      const b = frame.rgba[i + 2];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      if (max > 16) lit++;
      if (max < 64 || max - min < 48) continue;
      const d = max - min;
      const hue = max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
      sectors[Math.min(11, Math.floor(hue * 2))]++;
      saturated++;
    }
    const hues = sectors.filter((n) => n >= Math.max(1, saturated * 0.01)).length;
    return { lit, total: frame.w * frame.h, hues };
  });
}

async function paintedStats(page: Page, canvas: Locator): Promise<PixelStats> {
  // A WebGPU canvas off screen is not drawn until it scrolls into view.
  await canvas.scrollIntoViewIfNeeded();
  let stats: PixelStats | null = null;
  await expect(async () => {
    stats = await readCanvas(canvas);
    expect(stats).not.toBeNull();
  }).toPass();
  return stats!;
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(installCapture);
});

for (const path of ["/explore/lerchphi/", "/explore/polylog/", "/explore/zeta/phase-portrait"]) {
  test(`phase portrait on ${path} has pixels and more than one hue`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto(path);
    const canvas = page.locator("notatio-complex-plot canvas").first();
    await expect(canvas).toBeVisible();
    const stats = await paintedStats(page, canvas);
    expect(stats.lit).toBeGreaterThan(stats.total * 0.2);
    expect(stats.hues).toBeGreaterThan(1);
    expect(errors).toEqual([]);
  });
}
