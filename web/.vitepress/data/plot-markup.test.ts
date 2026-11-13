// The Plot section draws pictures, not readouts: each panel's value lowers to its head's element.

// Loaded here, not on plotMarkup's first call: the front end and the engine behind it take seconds to
// load on a busy machine, and that load is not what the cases below measure.
import "@notatio/formats/expression";
import "@notatio/frontend";
import { plotSectionOf } from "@notatio/frontend/function-view";
import { expect, test } from "vite-plus/test";
import { functionViewFor } from "./function-view.ts";
import { plotMarkup } from "./plot-markup.ts";

test("Gamma's panels draw as a portrait and a plot, not a dynamic-box", async () => {
  const panels = plotSectionOf(functionViewFor("Gamma"))!.panels;
  const [portrait, slice] = await Promise.all(panels.map((p) => plotMarkup(p.value)));
  expect(portrait).toMatch(/^<notatio-complex-plot /);
  expect(slice).toMatch(/^<graphics-box /);
});

test("a control's slot survives into the attributes for the Manipulate to fill", async () => {
  const panel = plotSectionOf(functionViewFor("Binomial"))!.panels[0]!;
  expect(panel.params).not.toBe("");
  expect(await plotMarkup(panel.value)).toMatch(/_\w+/);
});

test("a non-picture is no markup", async () => {
  expect(await plotMarkup("Gamma(3)")).toBeUndefined();
});
