// The build as a kernel, for a page's own cells and plots (https://github.com/enumeratio/notatio/wiki/Speculative-Kernels-and-Front-Ends §9):
// each element `prerender-markup.ts` marked is answered here, in page order, by the site's own
// notebook kernel in Node, and its result written into the page's placeholder. A cell gets
// its typeset rows and its answer (which it renders on load, asking no kernel); a plot, its
// picture at the starting values of the controls it reads.

import { readFileSync } from "node:fs";
import { createKernel, type Kernel } from "@notatio/evaluation";
import { parseExpression } from "@notatio/formats/expression";
import { planeShowOf, plotSettingsOf } from "@notatio/frontend/symbols";
import {
  analyticScopeOf,
  callsAnalytic,
  chartBoxOfSettings,
  CURVE_SPEC,
  figurePlanOf,
  loadCompiled,
  lonePlotOf,
  parseControls,
  plainJson,
  primitivesOf,
  renderChart,
  renderPlot,
} from "@notatio/frontend/core";
import { NOTEBOOK_KERNEL } from "@notatio/frontend/kernel-host";
import { type CompiledPlot, engineRuntime } from "@notatio/frontend/plot-compile";
import { outMarkup, prerender } from "@notatio/frontend/prerender";
import { libraryRegistry, registerLibraryNotation } from "../theme/libraries.ts";
import { CATALOGUE } from "../theme/worker-catalogue.ts";
import { type MarkupSpec, specsFile } from "../prerender-markup.ts";
import { makeEngine, typeset } from "./prerender.ts";

let kernel: Promise<Kernel> | undefined;
export const pageKernel = (): Promise<Kernel> =>
  (kernel ??= makeEngine().then((ce) =>
    createKernel(ce, CATALOGUE, {
      ...NOTEBOOK_KERNEL,
      libraries: libraryRegistry(),
      notation: registerLibraryNotation,
    }),
  ));

/** A cell's attributes this build can't reproduce: the cell renders them live. */
const LIVE_ONLY = ["box", "raw", "plot", "elide-above", "live-value", "in-form", "out-form", "env"];

const escapeScript = (json: string): string => json.replace(/</g, "\\u003c");

async function cellPreview(spec: MarkupSpec, session: string): Promise<string | undefined> {
  const a = spec.attributes;
  const text = a["value"];
  if (text === undefined || spec.inSession || spec.manipulate.length > 0) return undefined;
  if (Object.keys(a).some((name) => name.startsWith(":") || name.startsWith("v-") || LIVE_ONLY.includes(name)))
    return undefined;
  const format = a["format"] ?? "epsil";
  const k = await pageKernel();
  const evaluate = a["evaluate"] !== "false";
  const answer = await k.evaluate({ source: { text, format }, session, evaluate });
  if (!answer.ok || answer.input === undefined) return undefined;
  const { html, ...data } = prerender(k.ce, { text, format }, answer.input, answer.json, evaluate, typeset);
  return (
    `<span class="notatio-preview"><span class="notatio-preview-label">In</span><span>${html!.input}</span>` +
    `<span class="notatio-preview-label">Out</span><span>${outMarkup({ ...data, html: html! })}</span></span>` +
    `<script type="application/json" class="notatio-answer">${escapeScript(JSON.stringify(data))}</script>`
  );
}

/** An `Epilog` or `Prolog` as written, read to primitives. */
const marksOf = (written: string): ReturnType<typeof primitivesOf> | undefined => {
  const { json, errors } = parseExpression(written);
  return errors.length > 0 ? undefined : primitivesOf(plainJson(json as never) as never);
};

/**
 * A plot's picture for the built page: a chart of data, or a curve plot, a `Graphics` or a `Show`
 * of them drawn by the sampler the page itself uses (`figurePlanOf`), so the live element replaces
 * the same picture. What the build can't draw it leaves live.
 */
async function plotPreview(spec: MarkupSpec): Promise<string | undefined> {
  const a = spec.attributes;
  const written = a["value"];
  if (written === undefined || Object.keys(a).some((name) => name.startsWith(":") || name.startsWith("v-")))
    return undefined;
  // The expression's settings, as the element reads them.
  const { json, errors } = parseExpression(written);
  const plain = errors.length > 0 ? undefined : (plainJson(json as never) as never);
  const settings = plain === undefined ? undefined : plotSettingsOf(plain);
  // A chart of data needs no kernel; one in a Manipulate may hold wildcards, so it stays live.
  const chart = settings === undefined || spec.manipulate.length > 0 ? undefined : chartBoxOfSettings(settings);
  if (chart !== undefined) return `<span class="graphics-box-plot">${renderChart(chart as never)}</span>`;
  const head = Array.isArray(plain) ? String((plain as unknown[])[0]) : "";
  // A lone plot of data (`ListPlot`) is drawn live, as it was.
  const show =
    plain === undefined
      ? undefined
      : (planeShowOf(plain) ?? (settings?.["type"] === undefined && settings ? lonePlotOf(head, settings) : undefined));
  if (show === undefined) return undefined;
  const plan = figurePlanOf(show);
  const k = await pageKernel();
  const loaded = [];
  for (const text of plan.sources) {
    const answer = await k.evaluate({ source: { text, format: "epsil" }, compile: CURVE_SPEC });
    const plot = answer.compiled as CompiledPlot | undefined;
    if (!answer.ok || plot === undefined) return undefined;
    const scope = callsAnalytic(plot) ? analyticScopeOf(await import("@notatio/analytic")) : {};
    // An item with no code is sampled by the kernel's engine, as the page does.
    loaded.push(loadCompiled(plot, engineRuntime(k.ce as never, scope)));
  }
  // The wildcards start where a Manipulate's controls around it do.
  const bindings: Record<string, unknown> = {};
  for (const params of spec.manipulate) for (const c of parseControls(params)) bindings[`_${c.name}`] = c.value;
  const box = plan.draw(loaded, { bindings, marks: marksOf });
  if (box !== undefined && "failed" in (box as object)) {
    console.warn(`[prerender] plot left live, no way to sample it: ${(box as { failed: string }).failed}`);
    return undefined;
  }
  if (box === undefined || "unbound" in (box as object)) return undefined;
  return `<span class="graphics-box-plot">${renderPlot(box as never).svg}</span>`;
}

/** `html` with each of `page`'s marked elements rendered into its placeholder. */
export async function fillMarkup(html: string, page: string): Promise<string> {
  let specs: MarkupSpec[];
  try {
    specs = JSON.parse(readFileSync(specsFile(page), "utf8")) as MarkupSpec[];
  } catch {
    return html;
  }
  if (specs.length === 0) return html;
  const session = `prerender:${page}`;
  const previews = new Map<number, string>();
  for (const spec of specs) {
    try {
      const preview = spec.tag === "notatio-cell" ? await cellPreview(spec, session) : await plotPreview(spec);
      if (preview !== undefined) previews.set(spec.at, preview);
    } catch {
      // the element renders it live
    }
  }
  const k = await pageKernel();
  await k.evaluate({ session, close: true });
  return html.replace(
    /(<span class="notatio-prerendered" data-prerender="(\d+)"[^>]*>)(<\/span>)/g,
    (whole, open: string, at: string, close: string) => {
      const preview = previews.get(Number(at));
      return preview === undefined ? whole : `${open}${preview}${close}`;
    },
  );
}
