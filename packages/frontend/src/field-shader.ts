// A region plot or implicit curves drawn per pixel: the fragment shader over a unit of `field<k>`
// functions (`toGlslFields`), and the renderer that draws it with its uniforms. The CPU route
// (`regionPlotBox`, `implicitPlotBox`) draws the same functions from a grid; this one evaluates them at
// every pixel of the view, so an edge stays sharp at any zoom. Fills and edges are the same paints
// (`regionPaints`), composited the same way (`ColorMixing -> Normal`).

import type { Gpu } from "./gpu.ts";
import { hexToRgb } from "./palettes.ts";
import { compileProgram, drawFullScreen, GLSL_HEADER, useParams } from "./webgl.ts";

/** Most functions one shader draws; a plot of more takes the CPU route. */
export const MAX_FIELDS = 8;
/** Most free names (a `Manipulate`'s wildcards) a shader reads as uniforms. */
export const MAX_PARAMS = 16;

/** What a field shader draws from its unit. */
export interface FieldShaderSpec {
  /** `regions`: each function is a margin, filled where positive. `curves`: each is drawn where zero. */
  readonly kind: "regions" | "curves";
  /** How many functions are drawn: `field0` … `field<count - 1>`. */
  readonly count: number;
  /** How many trailing arguments each function takes. */
  readonly params: number;
  /** Whether `field<count>` is a `RegionFunction`'s margin, outside which nothing is drawn. */
  readonly mask: boolean;
}

const HOST = /* glsl */ `
uniform Prm {
  vec4 view;  // the canvas's x0, y0, x1, y1
  vec4 shape; // the canvas's width and height in px, then two unused
  vec4 k[${MAX_PARAMS / 4}];
  vec4 fill[${MAX_FIELDS}]; // color, opacity
  vec4 edge[${MAX_FIELDS}]; // color, width in px (0: none)
} prm;
out vec4 fragColor;

// The share of the pixel where m is positive: m over its change across the pixel, about one half.
float cover(float m) {
  float w = fwidth(m);
  if (!(m == m) || !(w == w)) { return 0.0; }
  return clamp(m / max(w, 1e-30) + 0.5, 0.0, 1.0);
}

// How much of the pixel a line of 'px' along m = 0 covers: the distance to the zero set, in pixels.
float stroke(float m, float px) {
  float w = fwidth(m);
  if (!(m == m) || !(w == w) || px <= 0.0) { return 0.0; }
  float d = abs(m) / max(w, 1e-30);
  return 1.0 - smoothstep(0.5 * px - 0.5, 0.5 * px + 0.5, d);
}

// 'top' over 'under', both premultiplied.
vec4 over(vec4 under, vec3 color, float alpha) {
  return vec4(color * alpha, alpha) + under * (1.0 - alpha);
}

void main() {
  vec2 uv = gl_FragCoord.xy / prm.shape.xy;
  float x = mix(prm.view.x, prm.view.z, uv.x);
  float y = mix(prm.view.y, prm.view.w, uv.y);
  vec4 color = vec4(0.0);
BODY
  fragColor = color;
}
`;

/** The arguments of a call to a field: the point, then the parameters from their slots. */
const callOf = (k: number, params: number): string =>
  `field${k}(${["x", "y", ...Array.from({ length: params }, (_, p) => `prm.k[${p >> 2}][${p & 3}]`)].join(", ")})`;

/** The complete fragment shader for `unit` (`toGlslFields`' functions), drawn as `spec` says. */
export function fieldShader(unit: string, spec: FieldShaderSpec): string {
  const lines: string[] = [];
  if (spec.mask) lines.push(`  float inside = ${callOf(spec.count, spec.params)};`);
  for (let k = 0; k < spec.count; k++) lines.push(`  float m${k} = ${callOf(k, spec.params)};`);
  // Fills first, in order, then the edges over them: as the CPU box orders its marks.
  if (spec.kind === "regions")
    for (let k = 0; k < spec.count; k++) {
      const margin = spec.mask ? `min(m${k}, inside)` : `m${k}`;
      lines.push(`  color = over(color, prm.fill[${k}].rgb, prm.fill[${k}].a * cover(${margin}));`);
    }
  for (let k = 0; k < spec.count; k++) {
    // An edge stops at the mask: the mask's own edge is not a boundary of the region.
    const shown = spec.mask ? ` * step(0.0, inside)` : "";
    lines.push(`  color = over(color, prm.edge[${k}].rgb, stroke(m${k}, prm.edge[${k}].a)${shown});`);
  }
  return GLSL_HEADER + unit + HOST.replace("BODY", lines.join("\n"));
}

/** How a field shader's functions are painted, in order. */
export interface FieldPaints {
  /** `regions`: each fill's color and opacity. */
  readonly fills?: readonly { readonly color: string; readonly opacity: number }[];
  /** Each edge's color (`null`: none), and the width they share, in px. */
  readonly edges: readonly (string | null)[];
  readonly width: number;
}

/** The plane a canvas shows: its edges, left to right and bottom to top. */
export interface FieldView {
  readonly x: readonly [number, number];
  readonly y: readonly [number, number];
}

const VIEW_OFFSET = 0;
const SHAPE_OFFSET = 4;
const PARAMS_OFFSET = 8;
const FILL_OFFSET = PARAMS_OFFSET + MAX_PARAMS;
const EDGE_OFFSET = FILL_OFFSET + MAX_FIELDS * 4;
const UNIFORM_FLOATS = EDGE_OFFSET + MAX_FIELDS * 4;

/** The `Prm` block for one frame. */
export function fieldUniform(
  view: FieldView,
  width: number,
  height: number,
  params: readonly number[],
  paints: FieldPaints,
): Float32Array {
  const f = new Float32Array(UNIFORM_FLOATS);
  f.set([view.x[0], view.y[0], view.x[1], view.y[1]], VIEW_OFFSET);
  f.set([width, height], SHAPE_OFFSET);
  f.set(params.slice(0, MAX_PARAMS), PARAMS_OFFSET);
  for (const [k, fill] of (paints.fills ?? []).slice(0, MAX_FIELDS).entries())
    f.set([...hexToRgb(fill.color), fill.opacity], FILL_OFFSET + 4 * k);
  for (const [k, edge] of paints.edges.slice(0, MAX_FIELDS).entries())
    if (edge !== null) f.set([...hexToRgb(edge), paints.width], EDGE_OFFSET + 4 * k);
  return f;
}

/** Whether a plot of `count` functions over `params` free names fits one shader. */
export const fitsFieldShader = (count: number, params: number, mask: boolean): boolean =>
  count >= 1 && count + (mask ? 1 : 0) <= MAX_FIELDS && params <= MAX_PARAMS;

/**
 * Draws field shaders on the page's shared WebGL2 context and copies each frame to a 2-D canvas, so
 * a page of plots takes one context, not one each.
 */
export class FieldRenderer {
  #gl: WebGL2RenderingContext;
  #uniform: WebGLBuffer;
  #program: WebGLProgram | undefined;

  constructor(gpu: Gpu) {
    this.#gl = gpu.gl;
    this.#uniform = gpu.gl.createBuffer();
  }

  /**
   * Point the renderer at a unit. False when its shader does not compile: the plot keeps its CPU
   * drawing. A unit seen before costs nothing (`compileProgram`), so a wildcard moving never compiles.
   */
  setFields(unit: string, spec: FieldShaderSpec): boolean {
    this.#program = compileProgram(this.#gl, fieldShader(unit, spec));
    return this.#program !== undefined;
  }

  /**
   * Draw one frame of the current unit over `view`, filling `target`'s canvas. False when nothing was
   * drawn (the context is lost, or the canvas has no pixels).
   */
  render(target: CanvasRenderingContext2D, view: FieldView, params: readonly number[], paints: FieldPaints): boolean {
    const gl = this.#gl;
    const { width, height } = target.canvas;
    if (!this.#program || gl.isContextLost() || width < 1 || height < 1) return false;
    // The shared surface only grows; a frame is drawn in its lower left corner.
    const surface = gl.canvas;
    if (surface.width < width) surface.width = width;
    if (surface.height < height) surface.height = height;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.disable(gl.BLEND);
    gl.disable(gl.SCISSOR_TEST);
    gl.viewport(0, 0, width, height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    useParams(gl, this.#program, this.#uniform, fieldUniform(view, width, height, params, paints));
    drawFullScreen(gl);
    target.clearRect(0, 0, width, height);
    target.drawImage(surface, 0, surface.height - height, width, height, 0, 0, width, height);
    return true;
  }
}
