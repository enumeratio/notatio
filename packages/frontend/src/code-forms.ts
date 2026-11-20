// A value's source in each code form compute-engine compiles to: GLSL and
// JavaScript, through `compile()`. Each only takes a numeric or
// function expression, so a list or a comparison simply has no source in that form.
// GPUShaderForm is the whole shader one of our GPU paths runs for the expression.

import type { ComputeEngine, Expression } from "@cortex-js/compute-engine";
import { compile } from "@cortex-js/compute-engine/compile";
import { emitComplexGLSL } from "@notatio/ce-patches/glsl-complex";
import { portraitShader } from "./complex-plot.ts";
import { computeShader } from "./gpu-eval.ts";
import { toGlslFn } from "./plot-compile.ts";

export type CodeForm = "python" | "glsl" | "javascript" | "gpushader";

/** `json`'s source in each code form that can compile it. compute-engine 0.193 removed its Python
 *  target, so `python` has no source. A decline throws (`fallback: false`), where the default hands
 *  back an interpreter with no `code`. */
export function codeForms(ce: ComputeEngine, json: unknown): Partial<Record<CodeForm, string>> {
  const out: Partial<Record<CodeForm, string>> = {};
  const expr = ce.box(json as never);
  const shader = gpuShader(expr);
  if (shader !== undefined) out.gpushader = shader;
  for (const [form, to] of [
    ["glsl", "glsl"],
    ["javascript", "javascript"],
  ] as const) {
    try {
      const code = (compile(expr, { to, fallback: false }) as { code?: unknown } | undefined)?.code;
      if (typeof code === "string" && code !== "") out[form] = code;
    } catch {
      // this target can't compile this expression
    }
  }
  return out;
}

/**
 * The whole shader one of the GPU paths would run for `expr`, not just its GLSL. One unknown is a
 * complex variable, so the phase portrait's fragment shader (`<notatio-complex-plot>`); one or two
 * reals, the plot grid's fragment shader (`evalGridGPU`). Anything neither path takes has none.
 */
export function gpuShader(expr: Expression): string | undefined {
  const unknowns = [...expr.unknowns].toSorted();
  if (unknowns.length === 0 || unknowns.length > 2) return undefined;
  try {
    if (unknowns.length === 1) {
      const emitted = emitComplexGLSL(expr.json as never, unknowns[0]);
      if (emitted) return portraitShader(emitted.code);
    }
    // A lone unknown still gets a two-parameter plot function; the second is unused.
    const [vx = "x", vy = vx === "y" ? "x" : "y"] = unknowns;
    const fn = toGlslFn(expr, vx, vy);
    return fn === undefined ? undefined : computeShader(fn);
  } catch {
    return undefined;
  }
}
