// A plot's side of a kernel: it sends the expression, gets source back
// (`@notatio/frontend/plot-compile`), and samples that with no engine of its own. Free
// names, a Manipulate's wildcards (`_a`) included, are the scope's, so moving a control
// samples the same code again rather than asking for new code.

import type { CompiledItem, CompiledPlot, PlotCompileSpec } from "@notatio/frontend/plot-compile";
import {
  analyticScopeOf,
  callsAnalytic,
  loadBareEngine,
  loadCompiled,
  type LoadedPlot,
  interpretedSampler,
  loadEngineFor,
  parseFor,
  type Sampler,
  type Scope,
} from "@notatio/frontend/core";
import { pageKernel, translate, WorkerUnavailableError } from "./kernel-client.ts";

export type { CompiledItem, CompiledPlot, PlotCompileSpec };

export type { LoadedPlot, Sampler, Scope };

const compiled = new Map<string, Promise<CompiledPlot>>();
const COMPILED_LIMIT = 64;

/** `text` (Epsil) compiled as `spec` asks: by the page's kernel, else by the page's engine. */
export function compilePlotText(text: string, spec: PlotCompileSpec): Promise<CompiledPlot> {
  const key = JSON.stringify([text, spec]);
  let hit = compiled.get(key);
  if (hit === undefined) {
    if (compiled.size > COMPILED_LIMIT) compiled.clear();
    hit = compileOnce(text, spec);
    compiled.set(key, hit);
    hit.catch(() => compiled.delete(key));
  }
  return hit;
}

async function compileOnce(text: string, spec: PlotCompileSpec): Promise<CompiledPlot> {
  const ask = pageKernel();
  if (ask !== undefined) {
    try {
      const answer = await ask({ source: { text, format: "epsil" }, compile: spec });
      if (answer.error !== undefined) throw new Error(answer.error);
      return answer.compiled as CompiledPlot;
    } catch (err) {
      if (!(err instanceof WorkerUnavailableError)) throw err;
    }
  }
  const [{ compilePlot }, { parseExpression }] = await Promise.all([
    import("@notatio/frontend/plot-compile"),
    import("@notatio/formats/expression"),
  ]);
  const { engine, parsed } = await parseFor((ce) =>
    parseExpression(text, { ce, parseLatex: (tex) => ce.parse(tex).json }),
  );
  if (parsed.errors.length > 0) throw new Error(parsed.errors.join("; "));
  return compilePlot(engine, parsed.json, spec);
}

// compute-engine's helpers for compiled JavaScript (`_SYS`: integer powers, gamma, …) come
// only with an engine, so a bare one (no libraries) lends them: the first compiled function
// carries them. An upstream candidate: an engine-free runtime entry.
let helpers: Promise<unknown> | undefined;
const systemHelpers = (): Promise<unknown> =>
  (helpers ??= Promise.all([loadBareEngine(), import("@cortex-js/compute-engine/compile")]).then(
    ([ce, { JavaScriptTarget }]) =>
      (new JavaScriptTarget().compile(ce.box(["Power", "x", 3])).run as unknown as { SYS: unknown }).SYS,
  ));

// The analytic kernels the JavaScript target emits calls to, read from the scope
// (`_.__hz(…)`): loaded only for code that calls one.
let analytic: Promise<Scope> | undefined;
const analyticRuntime = (): Promise<Scope> => (analytic ??= import("@notatio/analytic").then(analyticScopeOf));

/** `text` (Epsil) evaluated numerically (`N`), as MathJSON: by the page's kernel, else the
 *  page's engine. */
export async function numericValueOf(text: string): Promise<unknown> {
  const ask = pageKernel();
  if (ask !== undefined) {
    try {
      const answer = await ask({ source: { text: `N(${text})`, format: "epsil" } });
      if (answer.error !== undefined) throw new Error(answer.error);
      return answer.value;
    } catch (err) {
      if (!(err instanceof WorkerUnavailableError)) throw err;
    }
  }
  const { parseExpression } = await import("@notatio/formats/expression");
  const { engine, parsed } = await parseFor((ce) =>
    parseExpression(text, { ce, parseLatex: (tex) => ce.parse(tex).json }),
  );
  if (parsed.errors.length > 0) throw new Error(parsed.errors.join("; "));
  return engine
    .box(parsed.json as never)
    .evaluate()
    .N().json;
}

/** `text` (Epsil) in canonical form, unevaluated: by the page's kernel, else the page's engine. */
export async function canonicalOf(text: string): Promise<unknown> {
  const ask = pageKernel();
  if (ask !== undefined) {
    try {
      const answer = await ask({ source: { text, format: "epsil" }, evaluate: false });
      if (answer.error !== undefined) throw new Error(answer.error);
      return answer.value;
    } catch (err) {
      if (!(err instanceof WorkerUnavailableError)) throw err;
    }
  }
  const { parseExpression } = await import("@notatio/formats/expression");
  const { engine, parsed } = await parseFor((ce) =>
    parseExpression(text, { ce, parseLatex: (tex) => ce.parse(tex).json }),
  );
  if (parsed.errors.length > 0) throw new Error(parsed.errors.join("; "));
  return engine.box(parsed.json as never).json;
}

/** `json` with each bound wildcard (`_a`) replaced by its number. Structural; nothing evaluates. */
export function bindWildcards(json: unknown, bindings: Readonly<Record<string, number>> | undefined): unknown {
  if (bindings === undefined) return json;
  const walk = (node: unknown): unknown =>
    typeof node === "string" && Object.hasOwn(bindings, node)
      ? bindings[node]
      : Array.isArray(node)
        ? node.map(walk)
        : node;
  return walk(json);
}

/** `text` (Epsil) as MathJSON: read by the page's kernel, else by the page's engine;
 *  `undefined` when it doesn't parse. */
export async function readEpsil(text: string): Promise<unknown> {
  try {
    const read = await translate({ source: { text, format: "epsil" }, write: "mathjson" });
    if (read !== undefined) return read.json;
  } catch {
    return undefined;
  }
  const { parseExpression } = await import("@notatio/formats/expression");
  const { parsed } = await parseFor((ce) => parseExpression(text, { ce, parseLatex: (tex) => ce.parse(tex).json }));
  return parsed.errors.length > 0 ? undefined : parsed.json;
}

/** An item with no compiled code, sampled by the page's engine; none when the engine cannot be had. */
async function engineSampler(item: CompiledItem): Promise<Sampler | undefined> {
  try {
    return interpretedSampler((await loadEngineFor(item.json)) as never)(item);
  } catch {
    return undefined;
  }
}

/** `plot`'s items as samplers: the page's helpers and its engine's fallback behind the shared loader. */
export async function loadPlot(plot: CompiledPlot): Promise<LoadedPlot> {
  const codes = plot.items.map((item) => item.code ?? "");
  const [sys, scope] = await Promise.all([
    codes.some((c) => c.includes("_SYS")) ? systemHelpers() : undefined,
    callsAnalytic(plot) ? analyticRuntime() : ({} as Scope),
  ]);
  // An item with no code is sampled by the page's engine, loaded only for it.
  const fallback = new Map<CompiledItem, Sampler | undefined>();
  await Promise.all(
    plot.items
      .filter((item) => item.code === undefined)
      .map(async (item) => fallback.set(item, await engineSampler(item))),
  );
  return loadCompiled(plot, { sys, scope, evaluate: (item) => fallback.get(item) });
}

/** `text` compiled to JavaScript and ready to sample. */
export async function plotFunctions(text: string, spec: Omit<PlotCompileSpec, "target"> = {}): Promise<LoadedPlot> {
  return loadPlot(await compilePlotText(text, { ...spec, target: "javascript" }));
}
