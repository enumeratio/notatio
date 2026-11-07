// Its own module: the portrait's box code reads it without loading the evaluator, and with it the engine.

/**
 * Thrown where a kernel declines the point because its double sum has lost the digits (a Hurwitz
 * zeta far below the real axis at large Im s). The portrait hatches such a pixel, as the shader
 * does; the surface leaves a hole. An answer there would be drawn as structure that is noise.
 */
export class Uncertain extends Error {
  constructor() {
    super("the double kernel cannot vouch for this value's digits");
  }
}
