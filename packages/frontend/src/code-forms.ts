// A value's source in each code form compute-engine compiles to: Python and GLSL
// through their targets, JavaScript through `compile()`. Each only takes a numeric or
// function expression, so a list or a comparison simply has no source in that form.
// GPUShaderForm is the whole shader one of our GPU paths runs for the expression.

import { type ComputeEngine, compile, type Expression, GLSLTarget, PythonTarget } from "@cortex-js/compute-engine";
import { emitComplexGLSL } from "@notatio/ce-patches/glsl-complex";
import { ce0187Decline, isCompileDecline } from "@notatio/engine/compiled";
import { portraitShader } from "./complex-plot.ts";
import { computeShader } from "./gpu-eval.ts";
import { toGlslFn } from "./plot-compile.ts";

export type CodeForm = "python" | "glsl" | "javascript" | "gpushader";

const TARGETS = { python: PythonTarget, glsl: GLSLTarget } as const;

/** `json`'s source in each code form that can compile it. */
export function codeForms(ce: ComputeEngine, json: unknown): Partial<Record<CodeForm, string>> {
  const out: Partial<Record<CodeForm, string>> = {};
  const expr = ce.box(json as never);
  const shader = gpuShader(expr);
  if (shader !== undefined) out.gpushader = shader;
  // Source that would compute a wrong value is no source (`ce0187Decline`).
  if (ce0187Decline(expr.json) !== undefined) return out;
  for (const [form, Target] of Object.entries(TARGETS)) {
    try {
      const source = (new Target() as unknown as { compileToSource(e: unknown): unknown }).compileToSource(expr);
      if (typeof source === "string") out[form as CodeForm] = source;
    } catch {
      // this target can't compile this expression
    }
  }
  const javascript = javascriptSource(ce, json);
  if (javascript !== undefined) out.javascript = javascript;
  return out;
}

/**
 * `json` compiled to JavaScript source, or undefined. A decline is expected here (a list or a held
 * head like `Factorization` has no source) and stays silent: `fallback: false` keeps compute-engine
 * from logging each one. Any other failure is still warned about.
 */
export function javascriptSource(ce: ComputeEngine, json: unknown): string | undefined {
  try {
    if (ce0187Decline(json) !== undefined) return undefined;
    const code = (compile(json as never, { engine: ce, fallback: false } as never) as { code?: unknown } | undefined)
      ?.code;
    return typeof code === "string" ? code : undefined;
  } catch (error) {
    if (!isCompileDecline(error)) console.warn("JavaScript code form failed:", error);
    return undefined;
  }
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
