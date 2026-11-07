/// <reference types="@webgpu/types" />
import { DF_OPAQUE_WGSL, DF_PLAIN_WGSL, withWGSL } from "@enumeratio/analytic/shader";

// df64 (the Hurwitz kernel's double-float sums) rests on error-free transforms a GPU compiler may
// simplify away (Metal's fast-math folds (a + b) - a to b) or a device may leave inexact (an unfused
// fma). A device that does so sums in f32 and still passes the kernel's own cancellation check, so each
// device is tested once, on inputs it cannot fold because they arrive through a buffer, cheapest first:
// plain arithmetic, then two-sums kept opaque, then those with fma two-products; a device that fails all
// three draws the f32 kernel, which hatches. fma goes last: SwiftShader passes with it too, and its fma path
// drew a 12i portrait pixel whose sum it could not vouch for (ratio 6e10, measured).

const HOST = /* wgsl */ `
@group(0) @binding(0) var<storage, read> inp : array<f32, 8>;
@group(0) @binding(1) var<storage, read_write> outp : array<f32, 8>;
@compute @workgroup_size(1)
fn main() {
  dfOne = inp[0];
  let ts = dfTwoSum(inp[1], inp[2]);
  let tp = dfTwoProd(inp[3], inp[3]);
  let da = dfAdd(vec2f(inp[1], inp[2]), vec2f(-inp[1], 0.0));
  let dm = dfMul(vec2f(inp[3], 0.0), vec2f(inp[3], 0.0));
  outp[0] = ts.x; outp[1] = ts.y; outp[2] = tp.x; outp[3] = tp.y;
  outp[4] = da.x; outp[5] = dm.x; outp[6] = dm.y; outp[7] = dfTwoProd(inp[4], inp[5]).y;
}
`;

// one, a, b, c, d, e (all exact f32): twoSum(a, b) = (1, f32(1e-8)); twoProd(c, c) = (1 + 2^-11, 2^-24);
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

/**
 * How a device draws df64: plain arithmetic, two-sums kept opaque to the compiler, those with fma
 * two-products, or not at all (f32, hatched).
 */
export type Df64Mode = "plain" | "opaque" | "fma" | "off";

/** `shader` (written for "plain") set up for `mode`. */
export const withDf64 = (shader: string, mode: Df64Mode): string => {
  if (mode === "off") return shader.replace("const DF64: bool = true;", "const DF64: bool = false;");
  const opaque = mode === "plain" ? shader : shader.replace(DF_PLAIN_WGSL, DF_OPAQUE_WGSL);
  return mode === "fma" ? opaque.replace("const DF_FMA: bool = false;", "const DF_FMA: bool = true;") : opaque;
};

const verdicts = new WeakMap<GPUDevice, Df64Mode>();

/** The self-test's verdict for `device` ("off" before it ran). */
export const df64Mode = (device: GPUDevice): Df64Mode => verdicts.get(device) ?? "off";

/**
 * Run the self-test once on `device`. A test sets `globalThis.__notatioDf64SelfTest = "fail"` to force the
 * failed path. Logs the verdict (debug).
 */
export async function testDf64(device: GPUDevice): Promise<Df64Mode> {
  let mode: Df64Mode = "off";
  try {
    if ((globalThis as { __notatioDf64SelfTest?: string }).__notatioDf64SelfTest === "fail") throw new Error("forced");
    for (const m of ["plain", "opaque", "fma"] as const) {
      if (await exactOn(device, m)) {
        mode = m;
        break;
      }
    }
  } catch {
    mode = "off";
  }
  verdicts.set(device, mode);
  console.debug(
    mode !== "off"
      ? `df64 self-test passed (${mode}): the Hurwitz portrait draws double-float sums`
      : "df64 self-test failed: the Hurwitz portrait draws f32 sums and hatches what f32 cannot vouch for",
  );
  return mode;
}

async function exactOn(device: GPUDevice, mode: Df64Mode): Promise<boolean> {
  const module = device.createShaderModule({ code: withDf64(withWGSL(HOST), mode) });
  const pipeline = device.createComputePipeline({ layout: "auto", compute: { module, entryPoint: "main" } });
  const input = device.createBuffer({ size: 32, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST });
  device.queue.writeBuffer(input, 0, new Float32Array(INPUT));
  const output = device.createBuffer({ size: 32, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC });
  const read = device.createBuffer({ size: 32, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ });
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
  pass.dispatchWorkgroups(1);
  pass.end();
  encoder.copyBufferToBuffer(output, 0, read, 0, 32);
  device.queue.submit([encoder.finish()]);
  await read.mapAsync(GPUMapMode.READ);
  const ok = df64Exact(new Float32Array(read.getMappedRange().slice(0)));
  for (const b of [input, output, read]) b.destroy();
  return ok;
}
