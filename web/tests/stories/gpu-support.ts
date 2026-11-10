// Reading WebGL2 canvases back as pixels. The portrait renderer keeps its drawing buffer
// (`preserveDrawingBuffer`), so an init script counts each draw to a canvas's own framebuffer and the
// helpers below read the pixels on demand. Used by gpu.spec.ts, run under playwright.gpu.config.ts.

import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

/** Counts the frames each WebGL2 canvas draws, and gives `window.__grab(canvas)` its current pixels (top row first). */
export function installCapture(): void {
  if (!("WebGL2RenderingContext" in window)) return;
  const frames = new WeakMap<object, number>();
  const drawArrays = Reflect.get(WebGL2RenderingContext.prototype, "drawArrays") as (
    this: WebGL2RenderingContext,
    mode: number,
    first: number,
    count: number,
  ) => void;
  WebGL2RenderingContext.prototype.drawArrays = function (mode, first, count) {
    drawArrays.call(this, mode, first, count);
    // Only a draw to the canvas itself is a frame; a draw into a framebuffer object is a computation.
    if (this.getParameter(this.FRAMEBUFFER_BINDING) === null)
      frames.set(this.canvas, (frames.get(this.canvas) ?? 0) + 1);
  };
  (window as any).__grab = (canvas: HTMLCanvasElement) => {
    const frame = frames.get(canvas);
    const gl = canvas.getContext("webgl2") as WebGL2RenderingContext | null;
    if (!frame || !gl) return null;
    const w = gl.drawingBufferWidth;
    const h = gl.drawingBufferHeight;
    const flipped = new Uint8Array(w * h * 4);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, flipped);
    // GL rows run bottom to top; the helpers read from the top.
    const rgba = new Uint8ClampedArray(w * h * 4);
    for (let y = 0; y < h; y++) rgba.set(flipped.subarray((h - 1 - y) * w * 4, (h - y) * w * 4), y * w * 4);
    return { w, h, rgba, frame };
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
    const frame = (window as any).__grab?.(node) as
      | { w: number; h: number; rgba: Uint8ClampedArray; frame: number }
      | null
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
      const frame = (window as any).__grab(node) as { w: number; h: number; rgba: Uint8ClampedArray };
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
    const frame = (window as any).__grab(node) as { w: number; h: number; rgba: Uint8ClampedArray };
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

/**
 * Run the fragment shader `body` (everything after the `#version` and precision lines) once per input
 * texel: texel `i` of `input` (RGBA floats) is `texelFetch(inp, ivec2(i, 0), 0)` in the shader, `slots`
 * fill the uniform block `Prm`, and the result is the RGBA the shader wrote for each, four floats a point.
 * The shader declares `uniform sampler2D inp;`, `uniform Prm { vec4 p[16]; } prm;` and `out vec4 fragColor;`.
 */
export function runShader(
  page: Page,
  body: string,
  input: readonly (readonly [number, number, number, number])[],
  slots: readonly number[] = [],
): Promise<number[]> {
  return page.evaluate(
    ({ body, input, slots }) => {
      const n = input.length;
      const gl = document.createElement("canvas").getContext("webgl2")!;
      if (!gl.getExtension("EXT_color_buffer_float")) throw new Error("no float render targets");
      const program = gl.createProgram()!;
      for (const [type, source] of [
        [
          gl.VERTEX_SHADER,
          "#version 300 es\nvoid main() { vec2 q = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2)); gl_Position = vec4(q * 2.0 - 1.0, 0.0, 1.0); }",
        ],
        [gl.FRAGMENT_SHADER, `#version 300 es\nprecision highp float;\nprecision highp int;\n${body}`],
      ] as const) {
        const stage = gl.createShader(type)!;
        gl.shaderSource(stage, source);
        gl.compileShader(stage);
        if (!gl.getShaderParameter(stage, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(stage) ?? "shader");
        gl.attachShader(program, stage);
      }
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) ?? "link");
      gl.useProgram(program);
      // The inputs go in as an n × 1 float texture on unit 0, the slots in the uniform block, and the result
      // to its own texture on unit 1, so the input is not also the render target.
      const inputTexture = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, inputTexture);
      gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA32F, n, 1);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, n, 1, gl.RGBA, gl.FLOAT, new Float32Array(input.flat()));
      gl.uniform1i(gl.getUniformLocation(program, "inp"), 0);
      const block = new Float32Array(64);
      block.set(slots);
      const uniform = gl.createBuffer();
      gl.bindBuffer(gl.UNIFORM_BUFFER, uniform);
      gl.bufferData(gl.UNIFORM_BUFFER, block, gl.STATIC_DRAW);
      const index = gl.getUniformBlockIndex(program, "Prm");
      if (index !== gl.INVALID_INDEX) gl.uniformBlockBinding(program, index, 0);
      gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, uniform);
      gl.activeTexture(gl.TEXTURE1);
      const output = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, output);
      gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA32F, n, 1);
      const target = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, target);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, output, 0);
      gl.viewport(0, 0, n, 1);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      const values = new Float32Array(n * 4);
      gl.readPixels(0, 0, n, 1, gl.RGBA, gl.FLOAT, values);
      return Array.from(values);
    },
    { body, input: input.map((p) => [...p] as [number, number, number, number]), slots: [...slots] },
  );
}

/**
 * A complex GLSL expression in `z` evaluated at each of `points` on the GPU, with `literals` in the
 * uniform slots `prm.p` the emitter reads. One `[re, im, declined]` per point: `declined` is the
 * kernel's `uncertain` flag, the hatching a portrait draws instead of a color.
 */
export async function evalComplexOnGpu(
  page: Page,
  preamble: string,
  code: string,
  literals: readonly (readonly [number, number])[],
  points: readonly (readonly [number, number])[],
): Promise<[number, number, boolean][]> {
  const body = `${preamble}
uniform Prm { vec4 p[16]; } prm;
uniform sampler2D inp;
out vec4 fragColor;
void main() {
  vec2 z = texelFetch(inp, ivec2(gl_FragCoord.xy), 0).xy;
  uncertain = 0.0;
  vec2 v = ${code};
  fragColor = vec4(v, uncertain, prm.p[15].x);
}`;
  const slots = new Array<number>(64).fill(0);
  literals.forEach(([re, im], i) => ((slots[4 * i] = re), (slots[4 * i + 1] = im)));
  const values = await runShader(
    page,
    body,
    points.map(([re, im]) => [re, im, 0, 0] as const),
    slots,
  );
  return points.map(
    (_, i) => [values[4 * i]!, values[4 * i + 1]!, values[4 * i + 2]! > 0.5] as [number, number, boolean],
  );
}
