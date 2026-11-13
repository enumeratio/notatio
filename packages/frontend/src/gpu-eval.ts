import { withGLSL } from "@notatio/analytic/shader";
import { withDf64 } from "./df64-selftest.ts";
import { getGpu } from "./gpu.ts";
import { type ComplexGLSL, MAX_SLOTS } from "@notatio/ce-patches/glsl-complex";
import { compileProgram, GLSL_HEADER, renderToFloats } from "./webgl.ts";
import type { Df64Mode } from "./df64-selftest.ts";

// Opt-in GPU evaluation of a plot grid: one fragment-shader invocation per grid point of a GLSL
// `plotFn` (`plot-compile.ts`'s `toGlslFn`), rendered into an RGBA32F target and read back. Real-scalar,
// matching the CPU sampler. Returns `undefined` when WebGL2 or float render targets are unavailable or
// the shader doesn't compile, so callers fall back to the CPU path.

// The grid parameters, one vec4 (x0, y0, dx, dy): the point at texel (i, j) is (x0 + i·dx, y0 + j·dy).
const TAIL = `
uniform Prm { vec4 grid; } prm;
out vec4 fragColor;
void main() {
  vec2 ij = floor(gl_FragCoord.xy);
  fragColor = vec4(plotFn(prm.grid.x + ij.x * prm.grid.z, prm.grid.y + ij.y * prm.grid.w), 0.0, 0.0, 1.0);
}
`;

/** The complete fragment shader for a `plotFn` unit: one invocation per grid point. */
export const computeShader = (fnCode: string): string => GLSL_HEADER + fnCode + TAIL;

/** The (x0, y0, dx, dy) of a uniformly spaced axis pair. */
const gridParams = (xs: readonly number[], ys: readonly number[]): [number, number, number, number] => [
  xs[0]!,
  ys[0]!,
  xs.length > 1 ? (xs[xs.length - 1]! - xs[0]!) / (xs.length - 1) : 0,
  ys.length > 1 ? (ys[ys.length - 1]! - ys[0]!) / (ys.length - 1) : 0,
];

/**
 * Evaluate `fnCode`'s `plotFn` over the (uniformly spaced) grid xs × ys on the GPU.
 * `grid[j][i]` is the value at (xs[i], ys[j]); undefined if WebGL2 is unavailable or
 * the shader fails to compile.
 */
export async function evalGridGPU(
  fnCode: string,
  xs: readonly number[],
  ys: readonly number[],
): Promise<number[][] | undefined> {
  const gpu = await getGpu();
  if (!gpu) return undefined;
  const nx = xs.length;
  const ny = ys.length;
  if (nx < 1 || ny < 1) return undefined;
  const program = compileProgram(gpu.gl, computeShader(fnCode));
  if (!program) return undefined;
  const data = renderToFloats(gpu.gl, program, new Float32Array(gridParams(xs, ys)), nx, ny);
  if (!data) return undefined;
  const grid: number[][] = [];
  for (let j = 0; j < ny; j++) grid.push(Array.from({ length: nx }, (_, i) => data[(j * nx + i) * 4]!));
  return grid;
}

// --- complex grids ---------------------------------------------------------------------
//
// The same pass over an `emitComplexGLSL` expression: one invocation per grid point,
// each writing the complex value at `z` as (re, im). The emitted code reads its literals
// from `prm.p`, as the portrait shader does, and names the point by the plot variable.

const COMPLEX_TAIL = (variable: string, code: string): string => `
uniform Prm {
  vec4 grid;
  vec4 extra; // x: 1.0, which the compiler cannot see (dfOne in the library)
  vec4 p[${MAX_SLOTS}];
} prm;
out vec4 fragColor;
void main() {
  dfOne = prm.extra.x;
  vec2 ij = floor(gl_FragCoord.xy);
  vec2 ${variable} = vec2(prm.grid.x + ij.x * prm.grid.z, prm.grid.y + ij.y * prm.grid.w);
  fragColor = vec4(${code}, 0.0, 1.0);
}
`;

/** The complete fragment shader for a complex expression over `variable`. */
export const complexComputeShader = (variable: string, code: string, df64: Df64Mode = "plain"): string =>
  GLSL_HEADER + withDf64(withGLSL(COMPLEX_TAIL(variable, code)), df64);

/**
 * Evaluate an emitted complex expression over the grid xs × ys on the GPU. Returns the
 * values as `[re, im]` per point, row-major (`values[2 * (j * nx + i)]` is the real part at `(xs[i], ys[j])`),
 * or undefined if WebGL2 is unavailable or the shader fails to compile. The program is
 * cached on its source, so a literal moving costs an upload, not a rebuild.
 */
export async function evalComplexGridGPU(
  emitted: ComplexGLSL,
  variable: string,
  xs: readonly number[],
  ys: readonly number[],
): Promise<Float32Array | undefined> {
  const gpu = await getGpu();
  if (!gpu) return undefined;
  const nx = xs.length;
  const ny = ys.length;
  if (nx < 1 || ny < 1) return undefined;
  const program = compileProgram(gpu.gl, complexComputeShader(variable, emitted.code, gpu.df64));
  if (!program) return undefined;
  const params = new Float32Array(8 + MAX_SLOTS * 4);
  params.set(gridParams(xs, ys), 0);
  params[4] = 1; // `one`, opaque to the compiler
  for (const [i, [re, im]] of emitted.literals.entries()) params.set([re, im], 8 + i * 4);
  const data = renderToFloats(gpu.gl, program, params, nx, ny);
  if (!data) return undefined;
  const values = new Float32Array(nx * ny * 2);
  for (let k = 0; k < nx * ny; k++) {
    values[2 * k] = data[4 * k]!;
    values[2 * k + 1] = data[4 * k + 1]!;
  }
  return values;
}
