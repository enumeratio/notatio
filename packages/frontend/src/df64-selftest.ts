/// <reference types="@webgpu/types" />
import { withWGSL } from "@enumeratio/analytic/shader";

// df64 (the Hurwitz kernel's double-float sums) rests on error-free transforms a GPU compiler may
// simplify away (Metal's fast-math folds (a + b) - a to b). A device that does so sums in f32 and
// still passes the kernel's own cancellation check, so each device is tested once, on inputs it cannot
// fold because they arrive through a buffer; a device that fails draws the f32 kernel, which hatches.

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

const verdicts = new WeakMap<GPUDevice, boolean>();

/** The self-test's verdict for `device` (false before it ran): true when df64 may be drawn. */
export const df64Works = (device: GPUDevice): boolean => verdicts.get(device) ?? false;

/**
 * Run the self-test once on `device`. A test sets `globalThis.__notatioDf64SelfTest = "fail"` to force the
 * failed path. Logs the verdict (debug).
 */
export async function testDf64(device: GPUDevice): Promise<boolean> {
  let ok = false;
  try {
    if ((globalThis as { __notatioDf64SelfTest?: string }).__notatioDf64SelfTest === "fail") throw new Error("forced");
    const module = device.createShaderModule({ code: withWGSL(HOST) });
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
    ok = df64Exact(new Float32Array(read.getMappedRange().slice(0)));
    for (const b of [input, output, read]) b.destroy();
  } catch {
    ok = false;
  }
  verdicts.set(device, ok);
  console.debug(
    ok
      ? "df64 self-test passed: the Hurwitz portrait draws double-float sums"
      : "df64 self-test failed: the Hurwitz portrait draws f32 sums and hatches what f32 cannot vouch for",
  );
  return ok;
}
