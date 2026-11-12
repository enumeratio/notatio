import { ComputeEngine } from "@cortex-js/compute-engine";
import { makeBoxes, named, registerNotation } from "@enumeratio/boxes";
import { expect, test } from "vite-plus/test";
import { boxesToExpression, fromMathML, toMathML } from "../src/mathml.ts";

test("boxes read back through the notation registered on the engine", () => {
  const ce = new ComputeEngine();
  expect(fromMathML(toMathML(["Fibonacci", "n"]), ce)).toEqual(["Fibonacci", "n"]);
  const notation = { Pentagonal: named("P", 1) };
  const boxes = makeBoxes(["Pentagonal", "n"], notation);
  expect(boxesToExpression(boxes, ce)).not.toEqual(["Pentagonal", "n"]);
  registerNotation(ce, notation);
  expect(boxesToExpression(boxes, ce)).toEqual(["Pentagonal", "n"]);
});
