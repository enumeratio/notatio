// A plot samples compiled code: a real number, or a complex value that is real (a Hurwitz zeta of
// real arguments compiles to a complex kernel, whose result is `{ re, im }`).

import { expect, test } from "vite-plus/test";
import { loadPlot } from "../src/plot-kernel.ts";

const sample = async (code: string): Promise<number> => {
  const loaded = await loadPlot({
    unknowns: [],
    list: false,
    items: [{ json: 0, label: "", code }],
  } as never);
  return loaded.samplers[0]!(loaded.scope());
};

test("a real number samples as itself", async () => {
  expect(await sample("2.5")).toBe(2.5);
});

test("a complex value with no imaginary part samples as its real part", async () => {
  expect(await sample("({ re: 9.24, im: 0 })")).toBe(9.24);
});

test("a complex value with an imaginary part has no real sample", async () => {
  expect(await sample("({ re: 1, im: 2 })")).toBeNaN();
});
