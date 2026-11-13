import { withGLSL } from "@notatio/analytic/shader";
import { type Df64Mode, withDf64 } from "./df64-selftest.ts";
import { type ComplexGLSL, MAX_SLOTS } from "@notatio/ce-patches/glsl-complex";
import type { Gpu } from "./gpu.ts";
import { compileProgram, createContext, drawFullScreen, GLSL_HEADER, useParams } from "./webgl.ts";
import {
  DEFAULT_PHASE_GRADIENT,
  type Gradient,
  gradientNamed,
  hexToRgb,
  rgbToOklab,
  sampleGradient,
} from "./palettes.ts";
import { glslFloat as f, PORTRAIT as P } from "./portrait-color.ts";

// WebGL2 domain-coloring of a complex-valued expression: one fragment-shader
// invocation per pixel, color = arg on a gradient, brightness = a compressed log-magnitude.
//
// Internal to the element -- deliberately not re-exported from the package index, since
// its signatures name types from `@notatio/analytic` and pulling those into the
// public .d.ts makes the declaration build resolve a second package's source tree.
//
// The point of the split from `notatio-complex-plot.ts` is the pipeline cache. A
// Manipulate slider changes a *literal* in the expression, not its shape, and
// `emitComplexGLSL` hoists literals into uniform slots precisely so that case can
// re-upload 256 bytes instead of relinking a program. `setExpression` returns
// whether it had to rebuild, which is also what makes a frame-rate readout honest.

/** Most stops a gradient carries into the shader; a longer one is resampled to this many. */
export const MAX_STOPS = 16;

/** Coloring from (direction, ln|value|) — see `clogPolar` / `polygammaLog`. */
const HOST = /* glsl */ `
uniform Prm {
  vec2 center;
  vec2 res;
  float extent;
  float mask;
  float one;  // 1.0, that the compiler cannot see: dfOne in the library
  float pad;
  vec4 p[${MAX_SLOTS}];
  // The gradient: each stop is its color (sRGB, or OKLab) and its position; ramp is
  // (stop count, 1 when the stops blend in OKLab, 1 when the gradient wraps, unused).
  vec4 stops[${MAX_STOPS}];
  vec4 ramp;
} prm;
out vec4 fragColor;

vec3 oklab2rgb(vec3 c) {
  float l = c.x + 0.3963377774 * c.y + 0.2158037573 * c.z;
  float m = c.x - 0.1055613458 * c.y - 0.0638541728 * c.z;
  float s = c.x - 0.0894841775 * c.y - 1.291485548 * c.z;
  vec3 lin = max(vec3(
    4.0767416621 * l * l * l - 3.3077115913 * m * m * m + 0.2309699292 * s * s * s,
    -1.2684380046 * l * l * l + 2.6097574011 * m * m * m - 0.3413193965 * s * s * s,
    -0.0041960863 * l * l * l - 0.7034186147 * m * m * m + 1.707614701 * s * s * s), vec3(0.0));
  vec3 gamma = mix(1.055 * pow(lin, vec3(1.0 / 2.4)) - 0.055, 12.92 * lin, lessThanEqual(lin, vec3(0.0031308)));
  return clamp(gamma, vec3(0.0), vec3(1.0));
}

// The gradient at t, blended between its two neighboring stops as palettes.ts does.
vec3 gradient(float t0) {
  int n = int(prm.ramp.x);
  float t = clamp(t0, 0.0, 1.0);
  if (prm.ramp.z > 0.5) { t = fract(t0); }
  int k = 1;
  while (k < n - 1 && prm.stops[k].w < t) { k = k + 1; }
  vec4 a = prm.stops[k - 1];
  vec4 b = prm.stops[k];
  float f = clamp((t - a.w) / max(b.w - a.w, 1e-6), 0.0, 1.0);
  vec3 c = mix(a.xyz, b.xyz, f);
  if (prm.ramp.y > 0.5) { return oklab2rgb(c); }
  return clamp(c, vec3(0.0), vec3(1.0));
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 uv = frag / prm.res;
  float asp = prm.res.x / prm.res.y;
  vec2 z = prm.center + (uv - vec2(0.5)) * vec2(prm.extent * asp, prm.extent);
  // mask > 0 dims everything outside |z| < mask: the disk of convergence for a
  // series that has one, drawn as a faint grid so the boundary still reads.
  if (prm.mask > 0.0 && dot(z, z) >= prm.mask * prm.mask) {
    float g = ${f(P.maskGround)} + ${f(P.maskCheck)} * step(0.5, fract(z.x * ${f(P.maskCellsPerUnit)})) * step(0.5, fract(z.y * ${f(P.maskCellsPerUnit)}));
    fragColor = vec4(vec3(g), 1.0);
    return;
  }
  uncertain = 0.0;
  dfOne = prm.one;
  vec3 polar = VALUE;
  // A value whose digits the kernel cannot vouch for is hatched, not colored: noise there reads as structure.
  if (uncertain > 0.5) {
    fragColor = vec4(vec3(${f(P.hatchGround)} + ${f(P.hatchStripe)} * step(0.5, fract((frag.x + frag.y) / ${f(P.hatchPeriod)}))), 1.0);
    return;
  }
  float logMag = polar.z;
  if (!(logMag < 1e30)) { fragColor = vec4(1.0, 1.0, 1.0, 1.0); return; } // a pole
  if (!(logMag > -1e30)) { fragColor = vec4(0.0, 0.0, 0.0, 1.0); return; } // a zero
  // arg/2π along the gradient: on the phase wheel, red on the positive reals, as ComplexPlot3D.
  float hue = fract(argOf(polar.xy) * ${f(P.turn)});
  float bands = fract(logMag * ${f(P.bandsPerNeper)}); // log2|v|
  float base = 1.0 / (1.0 + exp(-logMag)); // = |v| / (1 + |v|)
  float val = clamp(mix(base * ${f(P.baseGain)}, 1.0, ${f(P.bandLift)} * bands), 0.0, 1.0);
  float sat = mix(1.0, ${f(P.satFloor)}, ${f(P.satDrop)} * bands);
  fragColor = vec4(pow(val * mix(vec3(1.0), gradient(hue), sat), vec3(${f(P.gamma)})), 1.0);
}
`;

/** The complete domain-coloring fragment shader for a complex-valued GLSL expression `code`. */
export const portraitShader = (code: string, df64: Df64Mode = "plain"): string =>
  GLSL_HEADER + withDf64(withGLSL(HOST.replace("VALUE", `clogPolar(${code})`)), df64);

/** Bytes before the literal slots: center, res, extent, mask, pad. */
const SLOTS_OFFSET = 32;
const STOPS_OFFSET = SLOTS_OFFSET + MAX_SLOTS * 16;
const RAMP_OFFSET = STOPS_OFFSET + MAX_STOPS * 16;
const UNIFORM_SIZE = RAMP_OFFSET + 16;

/**
 * A gradient as the shader reads it: `MAX_STOPS` stops of (color, position), then
 * (count, OKLab, cyclic, unused). Stops blend in the gradient's own space, so an OKLab
 * gradient's stops are uploaded as OKLab and the shader converts the blend back.
 */
export function gradientUniform(g: Gradient): Float32Array {
  const stops =
    g.stops.length <= MAX_STOPS
      ? g.stops
      : Array.from({ length: MAX_STOPS }, (_, k) => ({
          at: k / (MAX_STOPS - 1),
          color: sampleGradient(g, k / (MAX_STOPS - 1)),
        }));
  const oklab = g.space === "oklab" && g.stops.length <= MAX_STOPS;
  const out = new Float32Array(MAX_STOPS * 4 + 4);
  stops.forEach(({ at, color }, k) => {
    const rgb = hexToRgb(color);
    out.set([...(oklab ? rgbToOklab(rgb) : rgb), at], k * 4);
  });
  out.set([stops.length, oklab ? 1 : 0, g.cyclic ? 1 : 0, 0], MAX_STOPS * 4);
  return out;
}

export interface ComplexPlotView {
  center: [number, number];
  extent: number;
  /** Radius outside which to dim, or 0 for the whole plane. */
  mask: number;
}

/**
 * Zoom about a point rather than the centre. `ux`/`uy` are the pointer's position in
 * [-0.5, 0.5] of the viewport with y up; `factor` scales the extent.
 *
 * The world point under the cursor sits at `center + u·E`, and it has to still sit
 * there afterwards — so the centre absorbs the whole change in extent:
 * `center += u·(E_before − E_after)`. Getting that sign backwards zooms *away* from
 * the cursor, which feels like the image running from you.
 */
export function zoomAbout(
  view: ComplexPlotView,
  ux: number,
  uy: number,
  aspect: number,
  factor: number,
  limits: { min: number; max: number } = { min: 0.05, max: 64 },
): ComplexPlotView {
  const after = Math.min(limits.max, Math.max(limits.min, view.extent * factor));
  const shrink = view.extent - after;
  return {
    center: [view.center[0] + ux * shrink * aspect, view.center[1] + uy * shrink],
    extent: after,
    mask: view.mask,
  };
}

export class ComplexPlotRenderer {
  #gl: WebGL2RenderingContext;
  #df64: Df64Mode;
  #uniform: WebGLBuffer;
  #programs = new Map<string, WebGLProgram>();
  #program: WebGLProgram | undefined;
  #literals: readonly (readonly [number, number])[] = [];
  #buf = new ArrayBuffer(UNIFORM_SIZE);
  #gradient: Gradient | undefined;

  /** A renderer on `canvas`, or null where it can't make a WebGL2 context with float targets. */
  static create(gpu: Gpu, canvas: HTMLCanvasElement): ComplexPlotRenderer | null {
    // preserveDrawingBuffer: the frame stays readable (a screenshot, a test) after it is composited.
    const gl = createContext(canvas, { alpha: false, preserveDrawingBuffer: true });
    return gl ? new ComplexPlotRenderer(gl, gpu.df64) : null;
  }

  private constructor(gl: WebGL2RenderingContext, df64: Df64Mode) {
    this.#gl = gl;
    this.#df64 = df64;
    this.#uniform = gl.createBuffer();
    this.setGradient(gradientNamed(DEFAULT_PHASE_GRADIENT));
  }

  /**
   * Point the renderer at an emitted expression. Returns "rebuilt" when the shape
   * changed and a program had to be compiled, "slots" when only the literals moved
   * (the cheap path a slider takes), or "failed" if the shader would not compile.
   */
  setExpression(e: ComplexGLSL): "rebuilt" | "slots" | "failed" {
    this.#literals = e.literals;
    const cached = this.#programs.get(e.shape);
    if (cached) {
      const rebuilt = cached !== this.#program;
      this.#program = cached;
      return rebuilt ? "rebuilt" : "slots";
    }
    const program = compileProgram(this.#gl, portraitShader(e.code, this.#df64));
    if (!program) return "failed";
    this.#programs.set(e.shape, program);
    this.#program = program;
    return "rebuilt";
  }

  /** The gradient the argument is colored with; takes effect on the next frame. */
  setGradient(g: Gradient): void {
    if (g === this.#gradient) return;
    this.#gradient = g;
    const u = gradientUniform(g);
    new Float32Array(this.#buf, STOPS_OFFSET, u.length).set(u);
  }

  /** Draw one frame. Returns the GPU-submit duration in ms (a coarse cost signal). */
  render(view: ComplexPlotView, width: number, height: number): number {
    const gl = this.#gl;
    const program = this.#program;
    if (!program) return 0;
    const t0 = performance.now();

    const f = new Float32Array(this.#buf);
    f[0] = view.center[0];
    f[1] = view.center[1];
    f[2] = width;
    f[3] = height;
    f[4] = view.extent;
    f[5] = view.mask;
    f[6] = 1;
    for (const [i, [re, im]] of this.#literals.entries()) {
      f[SLOTS_OFFSET / 4 + i * 4] = re;
      f[SLOTS_OFFSET / 4 + i * 4 + 1] = im;
    }
    gl.viewport(0, 0, width, height);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    useParams(gl, program, this.#uniform, f);
    drawFullScreen(gl);
    return performance.now() - t0;
  }
}
