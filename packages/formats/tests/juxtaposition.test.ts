import { ComputeEngine } from "@cortex-js/compute-engine";
import { expect, test } from "vite-plus/test";
import { parseExpression } from "../src/expression.ts";
import { importFrom } from "../src/index.ts";

const ce = new ComputeEngine();

// Epsil has no implicit product outside `$…$`: a pair of operands is an error at the second, never a dropped tail.
test.each([
  ["2 r + 1", 2],
  ["x y", 2],
  ["3 (x+1)", 2],
  ["1 + 2 r", 6],
])("%s is a parse error at the space, in source coordinates", (src, at) => {
  const { diagnostics } = parseExpression(src);
  expect(diagnostics[0]?.message).toMatch(/^unexpected-symbol/);
  expect(diagnostics[0]?.range?.[0]).toBe(at);
  expect(() => importFrom(src, "Epsil", { ce })).toThrow(/unexpected-symbol/);
});

test("an explicit product reads", () => {
  expect(parseExpression("2 * r + 1").errors).toEqual([]);
  expect(parseExpression("2r+1").errors).toEqual([]);
});
