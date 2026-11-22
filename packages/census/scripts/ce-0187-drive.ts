// Drives the plot and code-form compile paths of frontend over every reference example, under
// ce-0187-hook.ts, so ce-0187-scan.ts reads what they hand compute-engine's compilers:
//
//   node --import packages/census/scripts/ce-0187-hook.ts packages/census/scripts/ce-0187-drive.ts
//
// Per example, on the engine with every library declared (census's `fullEngine`): the kernel's `display` (the
// code forms: Python, GLSL, JavaScript, the GPU shader) of the input, and `compilePlot` of it, for JavaScript and
// for the GLSL fields a plot page asks for. An example that is a plot (`Plot`, `Plot3D`, `ContourPlot`, …) has its
// body compiled as the page compiles it: the first operand, each element of a list on its own. An example's input
// is what is compiled: its value would need the evaluator, and the compile paths take what a user typed.

import { display } from "@notatio/frontend/kernel-host";
import { compilePlot } from "@notatio/frontend/plot-compile";
import { loadReferenceData, PACKAGES } from "@notatio/reference/node";
import { fullEngine } from "../src/engine.ts";

const ce = fullEngine();
const { heads } = loadReferenceData(PACKAGES);

const isPlot = (head: unknown): boolean => typeof head === "string" && /Plot(3D)?$/.test(head);

let examples = 0;
let plots = 0;
const failures = new Map<string, number>();
const attempt = (what: string, run: () => unknown): void => {
  try {
    run();
  } catch {
    failures.set(what, (failures.get(what) ?? 0) + 1);
  }
};

for (const { entry } of heads) {
  for (const example of entry.examples) {
    examples++;
    const json = example.expr as never;
    attempt("display", () => display(ce, json));
    attempt("compilePlot javascript", () => compilePlot(ce, json, { target: "javascript", each: true }));
    attempt("compilePlot glsl", () => compilePlot(ce, json, { target: "glsl", each: true, fields: true }));
    const call = example.expr as unknown;
    if (Array.isArray(call) && isPlot(call[0]) && call[1] !== undefined) {
      plots++;
      attempt("plot body javascript", () => compilePlot(ce, call[1], { target: "javascript", each: true }));
      attempt("plot body glsl", () => compilePlot(ce, call[1], { target: "glsl", each: true, fields: true }));
    }
  }
}
console.log(`${examples} examples, ${plots} plots; threw: ${JSON.stringify(Object.fromEntries(failures))}`);
