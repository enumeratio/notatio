import { DF_OPAQUE_GLSL, DF_PLAIN_GLSL, withGLSL } from "@enumeratio/analytic/shader";
import { compileProgram, GLSL_HEADER, renderToFloats } from "./webgl.ts";

// df64 (the Hurwitz kernel's double-float sums) rests on error-free transforms a GPU compiler may
// simplify away (Metal's fast-math folds (a + b) - a to b). A device that does so sums in f32 and still
// passes the kernel's own cancellation check, so each device is tested once, on inputs it cannot fold
// because they arrive through a uniform, cheapest first: plain arithmetic, then two-sums kept opaque; a
// device that fails both draws the f32 kernel, which hatches. GLSL ES 3.00 has no `fma`, so a two-product
// is always Dekker's split.

const HOST = /* glsl */ `
uniform Prm { vec4 inp[2]; } prm;
out vec4 fragColor;
void main() {
  dfOne = prm.inp[0].x;
  float a = prm.inp[0].y;
  float b = prm.inp[0].z;
  float c = prm.inp[0].w;
  vec2 ts = dfTwoSum(a, b);
  vec2 tp = dfTwoProd(c, c);
  vec2 da = dfAdd(vec2(a, b), vec2(-a, 0.0));
  vec2 dm = dfMul(vec2(c, 0.0), vec2(c, 0.0));
  vec2 pq = dfTwoProd(prm.inp[1].x, prm.inp[1].y);
  if (int(gl_FragCoord.x) == 0) { fragColor = vec4(ts, tp); } else { fragColor = vec4(da.x, dm.x, dm.y, pq.y); }
}
`;

// one, a, b, c, d, e (all exact f32; the uniform's inp[0] is one, a, b, c and inp[1] is d, e):
// twoSum(a, b) = (1, f32(1e-8)); twoProd(c, c) = (1 + 2^-11, 2^-24);
// (a + b) - a leaves f32(1e-8); c * c in df64 keeps the 2^-24 the f32 product drops;
// twoProd(d, e) has the error of a product whose operands both have 24 significant bits.
const D = Math.fround(1.3);
const E = Math.fround(0.7);
const INPUT = [1, 1, Math.fround(1e-8), 1 + 2 ** -12, D, E, 0, 0];
const EXPECTED = [
  1,
  Math.fround(1e-8),
  1 + 2 ** -11,
  2 ** -24,
  Math.fround(1e-8),
  1 + 2 ** -11,
  2 ** -24,
  Math.fround(D * E - Math.fround(D * E)),
];

/** Whether `out` (the shader's eight floats) is what exact error-free transforms give. */
export const df64Exact = (out: ArrayLike<number>): boolean => EXPECTED.every((x, i) => out[i] === x);

/** How a device draws df64: plain arithmetic, two-sums kept opaque to the compiler, or not at all (f32, hatched). */
export type Df64Mode = "plain" | "opaque" | "off";

/** `shader` (written for "plain") set up for `mode`. */
export const withDf64 = (shader: string, mode: Df64Mode): string => {
  if (mode === "off") return shader.replace("const bool DF64 = true;", "const bool DF64 = false;");
  return mode === "plain" ? shader : shader.replace(DF_PLAIN_GLSL, DF_OPAQUE_GLSL);
};

const verdicts = new WeakMap<WebGL2RenderingContext, Df64Mode>();

/** The self-test's verdict for `gl` ("off" before it ran). */
export const df64Mode = (gl: WebGL2RenderingContext): Df64Mode => verdicts.get(gl) ?? "off";

/**
 * Run the self-test once on `gl`. A test sets `globalThis.__notatioDf64SelfTest = "fail"` to force the
 * failed path. Logs the verdict (debug).
 */
export function testDf64(gl: WebGL2RenderingContext): Df64Mode {
  let mode: Df64Mode = "off";
  try {
    if ((globalThis as { __notatioDf64SelfTest?: string }).__notatioDf64SelfTest === "fail") throw new Error("forced");
    for (const m of ["plain", "opaque"] as const) {
      if (exactOn(gl, m)) {
        mode = m;
        break;
      }
    }
  } catch {
    mode = "off";
  }
  verdicts.set(gl, mode);
  console.debug(
    mode !== "off"
      ? `df64 self-test passed (${mode}): the Hurwitz portrait draws double-float sums`
      : "df64 self-test failed: the Hurwitz portrait draws f32 sums and hatches what f32 cannot vouch for",
  );
  return mode;
}

function exactOn(gl: WebGL2RenderingContext, mode: Df64Mode): boolean {
  const program = compileProgram(gl, GLSL_HEADER + withDf64(withGLSL(HOST), mode));
  if (!program) return false;
  // Two texels: the first holds outputs 0 to 3, the second 4 to 7.
  const out = renderToFloats(gl, program, new Float32Array(INPUT), 2, 1);
  return out !== undefined && df64Exact(out);
}
