// The Plot section of a reference page: the panels each head's function view lays out, as golden
// data (AGENTS.md: no snapshots), regenerated with `UPDATE_PLOT_PANELS=1 vp test`.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { plotSectionOf } from "@notatio/frontend/function-view";
import { expect, test } from "vite-plus/test";
import { functionViewFor } from "./function-view.ts";

const HEADS = ["Gamma", "Erf", "Abundance", "Binomial", "Moment"];
const GOLDEN = fileURLToPath(new URL("./function-view.golden.json", import.meta.url));

test("the Plot section of Gamma (complex), Erf (real), a discrete head, one with sliders, and one with only a reason", () => {
  const fresh = Object.fromEntries(HEADS.map((h) => [h, plotSectionOf(functionViewFor(h)) ?? null]));
  if (process.env.UPDATE_PLOT_PANELS === "1") writeFileSync(GOLDEN, `${JSON.stringify(fresh, null, 2)}\n`);
  expect(fresh).toEqual(JSON.parse(readFileSync(GOLDEN, "utf8")));
});

test("the plots are the axis's own: ComplexPlot and its real slice, Plot, DiscretePlot", () => {
  const heads = (h: string) => plotSectionOf(functionViewFor(h))?.panels.map((p) => p.value.split("(")[0]);
  expect(heads("Gamma")).toEqual(["ComplexPlot", "Plot"]);
  expect(heads("Erf")).toEqual(["Plot"]);
  expect(heads("Abundance")).toEqual(["DiscretePlot"]);
});

test("a head with no numeric result has no Plot section", () => {
  expect(functionViewFor("PrimeQ")).toBeUndefined();
  expect(plotSectionOf(functionViewFor("PrimeQ"))).toBeUndefined();
  expect(plotSectionOf(undefined)).toBeUndefined();
});

test("a head the complex emitter cannot lower is plotted over its real slice only (S#4)", () => {
  const heads = (h: string) => plotSectionOf(functionViewFor(h))?.panels.map((p) => p.value.split("(")[0]);
  for (const head of ["BesselY", "AiryAi"]) expect(heads(head)).toEqual(["Plot"]);
  // The ones it lowers keep the portrait, among them the heads the emitter was widened to (BL-335).
  expect(heads("Gamma")).toEqual(["ComplexPlot", "Plot"]);
  for (const head of ["BesselJ", "Erfc", "LambertW", "Log", "Sinc", "Pochhammer"])
    expect(heads(head), head).toEqual(["ComplexPlot", "Plot"]);
});
