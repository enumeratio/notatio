import { type Df64Mode, testDf64 } from "./df64-selftest.ts";
import { createContext } from "./webgl.ts";

/** The GPU as the evaluation paths see it: one context for grids and the self-test, and its df64 verdict. */
export interface Gpu {
  readonly gl: WebGL2RenderingContext;
  readonly df64: Df64Mode;
}

let gpuPromise: Promise<Gpu | null> | undefined;

/**
 * The shared WebGL2 context, with the df64 self-test run on it once, or null where there is no WebGL2 or
 * no float render target. A lost context is dropped and made again on the next call.
 */
export function getGpu(): Promise<Gpu | null> {
  gpuPromise ??= (async () => {
    const canvas = typeof OffscreenCanvas === "function" ? new OffscreenCanvas(1, 1) : document.createElement("canvas");
    const gl = createContext(canvas);
    if (!gl) return null;
    canvas.addEventListener("webglcontextlost", (event: Event) => {
      event.preventDefault();
      gpuPromise = undefined;
    });
    return { gl, df64: testDf64(gl) };
  })().catch(() => null);
  return gpuPromise;
}
