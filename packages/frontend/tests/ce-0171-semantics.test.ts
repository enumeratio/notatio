// Behavior pinned under compute-engine >= 0.171 semantics (BL-415).

import { ComputeEngine } from "@cortex-js/compute-engine";
import { createJavaScriptRuntime } from "@cortex-js/compute-engine/runtime";
import { expect, test } from "vite-plus/test";
import { freeSymbols, inferControls } from "../src/infer-controls.ts";
import { compilePlot } from "../src/plot-compile.ts";
import { cellBindings } from "../src/tracked-symbols.ts";

const ce = new ComputeEngine();
const SYS = createJavaScriptRuntime();
const run = (code: string | undefined, scope: Record<string, unknown>): unknown =>
  // oxlint-disable-next-line no-implied-eval -- the compiled code under test
  new Function("_SYS", "_", `return (${code});`)(SYS, scope);

test("a nested assignment is an error operand: only the top-level target is defined, and nothing is read", () => {
  const b = cellBindings(ce, 1, "y := (k := 2)", ["Assign", "y", ["Assign", "k", 2]] as never);
  expect(b.assigns).toBe("y");
  expect(b.reads).toEqual([]);
});

test("N and D used as values are read as free symbols by the tracker", () => {
  const b = cellBindings(ce, 1, "total := N + D", ["Assign", "total", ["Add", "N", "D"]] as never);
  expect(b.assigns).toBe("total");
  expect(b.reads).toEqual(["D", "N"]);
});

test("N and D, compute-engine's one-letter functions, get no control as values", () => {
  const expr = ["Add", "N", ["Multiply", "D", "a"]] as never;
  expect(freeSymbols(expr)).toEqual(["a"]);
  expect(inferControls(expr, { engine: ce }).map((c) => c.name)).toEqual(["a"]);
});

// compute-engine 0.194.0's compiler declines EvaluateAt, so the item has no code, and its value (a number
// with no free names) is what the page draws.
test("a derivative with a control substituted becomes EvaluateAt, which has no code but its value", () => {
  const derivative = ["D", ["Power", "x", 2], "x"];
  expect(ce.box(derivative as never).subs({ x: ce.number(3) }).operator).toBe("EvaluateAt");
  const plot = compilePlot(ce, ["Add", derivative, "x"], { target: "javascript", bindings: { x: 3 } });
  expect(plot.unknowns).toEqual([]);
  expect(plot.items[0]!.code).toBeUndefined();
  expect(plot.items[0]!.value).toBe(9);
});

test("a derivative that keeps its variable free still compiles over it", () => {
  const plot = compilePlot(ce, ["Multiply", "_a", ["D", ["Power", "x", 3], "x"]], {
    target: "javascript",
    bindings: { _a: 2 },
  });
  expect(plot.unknowns).toEqual(["x"]);
  if (plot.items[0]!.code !== undefined) expect(run(plot.items[0]!.code, { x: 2 })).toBe(24);
});
