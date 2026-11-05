// Reading WebGPU canvases back as pixels. A screenshot of a WebGPU canvas is blank, so an init
// script copies each presented texture into a buffer and keeps the pixels per canvas; the helpers
// below read them. Used by gpu.spec.ts, run under playwright.gpu.config.ts.

import type { Locator } from "@playwright/test";
import { expect } from "@playwright/test";

/** Makes every configured WebGPU canvas readable: COPY_SRC on its usage and a copy of each frame. */
export function installCapture(): void {
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
  const pixels = new WeakMap<HTMLCanvasElement, { w: number; h: number; rgba: Uint8ClampedArray; frame: number }>();
  (window as any).__pixels = pixels;
  let frames = 0;
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
        pixels.set(c.canvas, { w, h, rgba, frame: ++frames });
        buffer.unmap();
        buffer.destroy();
      });
    }
  };
}

export interface PixelStats {
  /** Pixels that are not black. */
  lit: number;
  total: number;
  /** Share of the canvas that is saturated color (neither black, grey nor white). */
  colored: number;
  /** Share of the saturated pixels in each 30-degree hue sector, red first. */
  sectors: number[];
  /** Distinct sectors holding at least 1% of the saturated pixels. */
  hues: number;
  /** The frame's number: it rises each time the canvas presents again. */
  frame: number;
}

/** What a canvas has drawn, from the captured frame; null until one has been presented. */
export function readCanvas(canvas: Locator): Promise<PixelStats | null> {
  return canvas.evaluate((node) => {
    const frame = (window as any).__pixels?.get(node) as
      | { w: number; h: number; rgba: Uint8ClampedArray; frame: number }
      | undefined;
    if (!frame) return null;
    const counts = new Array<number>(12).fill(0);
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
      counts[Math.min(11, Math.floor(hue * 2))]++;
      saturated++;
    }
    const sectors = counts.map((n) => (saturated ? n / saturated : 0));
    return {
      lit,
      total: frame.w * frame.h,
      colored: saturated / (frame.w * frame.h),
      sectors,
      hues: sectors.filter((s) => s >= 0.01).length,
      frame: frame.frame,
    };
  });
}

/** Waits for the canvas to present its first frame (scrolling it into view, as an off-screen one is not drawn). */
export async function paintedStats(canvas: Locator): Promise<PixelStats> {
  await canvas.scrollIntoViewIfNeeded();
  let stats: PixelStats | null = null;
  await expect(async () => {
    stats = await readCanvas(canvas);
    expect(stats).not.toBeNull();
  }).toPass();
  return stats!;
}

/** Waits for a frame newer than `after` and returns its stats: what a control moved the picture to. */
export async function repaintedStats(canvas: Locator, after: number): Promise<PixelStats> {
  let stats: PixelStats | null = null;
  await expect(async () => {
    stats = await readCanvas(canvas);
    expect(stats?.frame ?? 0).toBeGreaterThan(after);
  }).toPass();
  return stats!;
}

/** The frame's color (r, g, b) at fractional canvas position (u, v), each 0..1 from the top left. */
export function colorAt(canvas: Locator, u: number, v: number): Promise<[number, number, number]> {
  return canvas.evaluate(
    (node, [fu, fv]) => {
      const frame = (window as any).__pixels.get(node) as { w: number; h: number; rgba: Uint8ClampedArray };
      const x = Math.min(frame.w - 1, Math.floor(fu * frame.w));
      const y = Math.min(frame.h - 1, Math.floor(fv * frame.h));
      const i = (y * frame.w + x) * 4;
      return [frame.rgba[i], frame.rgba[i + 1], frame.rgba[i + 2]] as [number, number, number];
    },
    [u, v] as [number, number],
  );
}

/** The share of pixel rows that are the same, brightness for brightness, as their mirror image about the horizontal midline. */
export function mirrorMatch(canvas: Locator, tolerance = 12): Promise<number> {
  return canvas.evaluate((node, tol) => {
    const frame = (window as any).__pixels.get(node) as { w: number; h: number; rgba: Uint8ClampedArray };
    const value = (x: number, y: number) => {
      const i = (y * frame.w + x) * 4;
      return Math.max(frame.rgba[i], frame.rgba[i + 1], frame.rgba[i + 2]);
    };
    let same = 0;
    let total = 0;
    for (let y = 0; y < Math.floor(frame.h / 2); y++)
      for (let x = 0; x < frame.w; x += 2) {
        total++;
        if (Math.abs(value(x, y) - value(x, frame.h - 1 - y)) <= tol) same++;
      }
    return same / total;
  }, tolerance);
}
