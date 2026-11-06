// GPUShaderForm is the whole shader one of the GPU paths runs for an expression, not "—" (S#8, E#11).

import { ComputeEngine } from "@cortex-js/compute-engine";
import { expect, test } from "vite-plus/test";
import { codeSources } from "../src/out-engine.ts";

const engine = new ComputeEngine();

test("an expression of two reals is the plot grid's compute shader", async () => {
  const { gpushader } = await codeSources(engine, ["Add", ["Sin", "x"], ["Power", "y", 2]]);
  expect(gpushader).toContain("fn plotFn(");
  expect(gpushader).toContain("@compute");
});

test("an expression of one complex variable is the phase portrait's fragment shader", async () => {
  const { gpushader } = await codeSources(engine, ["Gamma", "z"]);
  expect(gpushader).toContain("@fragment");
  expect(gpushader).toContain("cgamma(");
});

test("an expression with no variable has no shader", async () => {
  expect((await codeSources(engine, ["Add", 1, 2])).gpushader).toBeUndefined();
});
