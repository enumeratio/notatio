// A plot's expression compiled where the definitions are: in a kernel (`kernel-host.ts`'s
// `compile`), or on the page's own engine when there is none. The page gets source text, and
// runs it with no engine of its own (`@enumeratio/components`' `plot-kernel.ts`).

import type { Expression, ComputeEngine } from "@cortex-js/compute-engine";
import { canCompile, GLSLTarget, JavaScriptTarget } from "@cortex-js/compute-engine/compile";
import { selfContainedCode } from "@enumeratio/engine/compiled";
import { withGLSL } from "@enumeratio/analytic/shader";

/** What to compile a plot's expression to. */
export interface PlotCompileSpec {
  /** `javascript`: an expression over the scope `_` (and compute-engine's helpers `_SYS`).
   *  `glsl`: a `float plotFn(float vx, float vy)` function, for the GPU grid. */
  readonly target: "javascript" | "glsl";
  /** The plot's variables, in order, for `glsl`; the free names stand in when absent. */
  readonly vars?: readonly string[];
  /** Compile each element of a list on its own: one curve, or one component, per element. */
  readonly each?: boolean;
  /** Wildcard values (`_a` → 2) compiled in, for a target with no scope to read them from. */
  readonly bindings?: Readonly<Record<string, number>>;
  /**
   * `glsl`: the items together as one unit of `float field<k>(vx, vy, …params)` functions (`unit`), for a
   * shader that draws them per pixel. `params` are the names left free, which the shader passes as
   * trailing arguments: a wildcard moving costs an upload, not a compile.
   */
  readonly fields?: boolean;
  readonly params?: readonly string[];
}

/** One compiled curve, surface or component. */
export interface CompiledItem {
  /** The canonical MathJSON, for a page that samples it itself when there's no `code`. */
  readonly json: unknown;
  readonly label: string;
  /** The compiled source, when the target could compile it. */
  readonly code?: string;
  /** Its value, when it has no free names. */
  readonly value?: number;
  /** Its two values, when it's a pair of numbers (a data point). */
  readonly point?: readonly [number, number];
}

export interface CompiledPlot {
  /** The free names, sorted, wildcards (`_a`) included: a scope fills them. */
  readonly unknowns: readonly string[];
  /** Whether the expression was a list split into its elements (`each`). */
  readonly list: boolean;
  readonly items: readonly CompiledItem[];
  /** `fields`: the items as one GLSL unit, when every one compiled. */
  readonly unit?: string;
}

const LIST_HEADS = new Set(["List", "Set", "Tuple", "Sequence"]);

// `ops` lives on compute-engine's narrowed function interface; read it structurally.
const opsOf = (e: Expression): readonly Expression[] | undefined =>
  (e as unknown as { ops?: readonly Expression[] }).ops;

const numeric = (e: Expression): number | undefined => {
  if (e.unknowns.length > 0) return undefined;
  const re = e.N().re;
  return typeof re === "number" && Number.isFinite(re) ? re : undefined;
};

/**
 * A bivariate expression as a GLSL `plotFn`; the library kernels it reaches come first so its heads resolve,
 * then the target's helper preamble, which defines the `_gpu_*` functions the body calls
 * (`_gpu_sin` for `Sin`).
 */
export function toGlslFn(expr: Expression, vx: string, vy: string): string | undefined {
  try {
    // A form outside the GLSL fragment (`Random`, a matrix, a symbol with no numeric type) has no shader:
    // the plot takes its CPU path.
    if (!canCompile(expr, { to: "glsl" }).ok) return undefined;
    const r = new GLSLTarget().compile(expr) as { success?: boolean; code?: string; preamble?: string };
    if (!r?.success || !r.code) return undefined;
    // A loop stops after 10,000 passes with NaN where the CPU path sums on: the plot declines to its
    // CPU path rather than show NaN (an `iterationBudget` lift would let a large bound hang the GPU).
    if (r.preamble?.includes("_gpu_passes") || r.code.includes("_gpu_passes")) return undefined;
    // A block of locals compiles to statements ending in their own `return`.
    const body = /\breturn\b/.test(r.code) ? r.code : `return ${r.code};`;
    return withGLSL(`${r.preamble ?? ""}\nfloat plotFn(float ${vx}, float ${vy}) { ${body} }`);
  } catch {
    return undefined;
  }
}

/** A GLSL preamble's top-level definitions, each from its signature to its closing brace. */
const definitionsOf = (preamble: string): string[] =>
  preamble
    .split(/\n(?=[A-Za-z_]\w*[ \t]+\w+[ \t]*\([^;{}]*\)[ \t]*\{)/)
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk !== "");

/**
 * Bivariate expressions as one GLSL unit: `float field<k>(vx, vy, …params)` for the k-th, after the
 * helpers they call, each defined once however many of them call it. Undefined when any one has no
 * shader (`toGlslFn`'s cases).
 */
export function toGlslFields(
  exprs: readonly Expression[],
  vx: string,
  vy: string,
  params: readonly string[] = [],
): string | undefined {
  try {
    const helpers = new Set<string>();
    const fields: string[] = [];
    const signature = [vx, vy, ...params].map((name) => `float ${name}`).join(", ");
    for (const [k, expr] of exprs.entries()) {
      if (!canCompile(expr, { to: "glsl" }).ok) return undefined;
      const r = new GLSLTarget().compile(expr) as { success?: boolean; code?: string; preamble?: string };
      if (!r?.success || !r.code) return undefined;
      // A capped loop yields NaN where the CPU path sums on (`toGlslFn`).
      if (r.preamble?.includes("_gpu_passes") || r.code.includes("_gpu_passes")) return undefined;
      for (const definition of definitionsOf(r.preamble ?? "")) helpers.add(definition);
      const body = /\breturn\b/.test(r.code) ? r.code : `return ${r.code};`;
      fields.push(`float field${k}(${signature}) { ${body} }`);
    }
    return withGLSL([...helpers, ...fields].join("\n"));
  } catch {
    return undefined;
  }
}

function compileItem(e: Expression, spec: PlotCompileSpec, unknowns: readonly string[]): CompiledItem {
  const item: { -readonly [K in keyof CompiledItem]: CompiledItem[K] } = { json: e.json, label: e.toString() };
  const value = numeric(e);
  if (value !== undefined) item.value = value;
  const ops = opsOf(e);
  if (ops !== undefined && ops.length === 2 && LIST_HEADS.has(e.operator)) {
    const [a, b] = ops.map(numeric);
    if (a !== undefined && b !== undefined) item.point = [a, b];
  }
  if (spec.target === "glsl") {
    const free = unknowns.filter((u) => !u.startsWith("_"));
    const [vx = free[0] ?? "x", vy = free.find((u) => u !== vx) ?? "y"] = spec.vars ?? [];
    const code = toGlslFn(e, vx, vy);
    if (code !== undefined) item.code = code;
    return item;
  }
  try {
    const r = new JavaScriptTarget().compile(e) as { success?: boolean; code?: string; preamble?: string };
    const code = r?.success ? selfContainedCode(r) : undefined;
    if (code !== undefined) item.code = code;
  } catch {
    // not compilable: the page samples `json` itself
  }
  return item;
}

/**
 * `json` compiled as `spec` asks, on `ce`. A plot's variables are real: its samplers pass numbers, and
 * the GPU's real-only lowerings take no complex argument. So the names the expression leaves free are
 * declared real, in a scope of their own, for this compile: an engine that already inferred them
 * complex from an earlier use (`HurwitzZeta(x, y)` boxed once) would otherwise emit code reading a
 * complex value from a number, or refuse a real-only lowering, by the order the page asked in.
 */
export function compilePlot(ce: ComputeEngine, json: unknown, spec: PlotCompileSpec): CompiledPlot {
  ce.pushScope();
  let names: string[];
  try {
    names = [...ce.box(json as never).unknowns];
  } finally {
    ce.popScope();
  }
  ce.pushScope();
  try {
    for (const name of names) ce.declare(name, "real");
    return compileIn(ce, json, spec);
  } finally {
    ce.popScope();
  }
}

function compileIn(ce: ComputeEngine, json: unknown, spec: PlotCompileSpec): CompiledPlot {
  const boxed = ce.box(json as never);
  const bound = Object.entries(spec.bindings ?? {});
  const expr = bound.length > 0 ? boxed.subs(Object.fromEntries(bound.map(([k, v]) => [k, ce.number(v)]))) : boxed;
  const unknowns = [...expr.unknowns].toSorted();
  const list = spec.each === true && LIST_HEADS.has(expr.operator) && (opsOf(expr)?.length ?? 0) > 0;
  const items = list ? [...(opsOf(expr) ?? [])] : [expr];
  const compiled = { unknowns, list, items: items.map((e) => compileItem(e, spec, unknowns)) };
  if (spec.target !== "glsl" || spec.fields !== true) return compiled;
  const params = spec.params ?? [];
  const free = unknowns.filter((u) => !u.startsWith("_") && !params.includes(u));
  const [vx = free[0] ?? "x", vy = free.find((u) => u !== vx) ?? "y"] = spec.vars ?? [];
  const unit = toGlslFields(items, vx, vy, params);
  return unit === undefined ? compiled : { ...compiled, unit };
}
