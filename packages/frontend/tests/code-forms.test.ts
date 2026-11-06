// GPUShaderForm is the whole shader one of the GPU paths runs for an expression, not "—" (S#8, E#11):
// a kernel's display carries it with the other code forms.

import { ComputeEngine } from "@cortex-js/compute-engine";
import { expect, test } from "vite-plus/test";
import { codeForms } from "../src/code-forms.ts";
import { display } from "../src/kernel-host.ts";

const ce = new ComputeEngine();

test("an expression of two reals is the plot grid's compute shader", () => {
  const { gpushader } = codeForms(ce, ["Add", ["Sin", "x"], ["Power", "y", 2]]);
  expect(gpushader).toContain("fn plotFn(");
  expect(gpushader).toContain("@compute");
});

test("an expression of one complex variable is the phase portrait's fragment shader", () => {
  const { gpushader } = codeForms(ce, ["Gamma", "z"]);
  expect(gpushader).toContain("@fragment");
  expect(gpushader).toContain("cgamma(");
});

test("an expression with no variable has no shader", () => {
  expect(codeForms(ce, ["Add", 1, 2]).gpushader).toBeUndefined();
});

test("a kernel's display carries the shader beside the other code forms", () => {
  expect(display(ce, ["Add", ["Sin", "x"], ["Power", "y", 2]]).text.gpushader).toContain("fn plotFn(");
});

const declares = (shader: string | undefined) =>
  [...(shader ?? "").matchAll(/^(?:fn|const|var<private>|struct)\s+(\w+)/gm)].map((m) => m[1]);

test("a plot that calls no kernel carries no library kernel", () => {
  const { gpushader } = codeForms(ce, ["Add", ["Power", "x", 2], ["Power", "y", 2]]);
  expect(declares(gpushader)).not.toContain("hurwitz");
  expect(declares(gpushader)).not.toContain("cgamma");
  expect(declares(gpushader)).not.toContain("cmul");
});

test("a portrait carries the kernels its expression calls and not the others", () => {
  const names = declares(codeForms(ce, ["Gamma", "z"]).gpushader);
  expect(names).toContain("cgamma");
  expect(names).toContain("uncertain"); // the hatching reads it
  expect(names).not.toContain("cbesselJ");
  expect(names).not.toContain("hurwitz");
});
