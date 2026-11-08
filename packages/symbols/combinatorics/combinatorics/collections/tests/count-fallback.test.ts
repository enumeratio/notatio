// A family that declines past 2^53 still answers a small count through the interpreter when its
// compiled count is absent; it declines only where compiled code ran and gave out.

import { bareEngine } from "@enumeratio/engine/testing";
import { expect, test } from "vite-plus/test";
import { type EpsilFamily, familyHash, kernelOn } from "../src/families/epsil.ts";

const ce = bareEngine();
const family: EpsilFamily = {
  head: "SyntheticCount",
  paramCount: 1,
  kind: "scalar",
  params: ["n"],
  declinePastDoubles: "count",
  epsil: { count: ["Add", "n", 1], unrank: 0, rank: 0, valid: "False" },
};
const hash = familyHash(family);

test("no compiled count: a small n is interpreted, not declined", () => {
  const kernel = kernelOn(ce, family, { SyntheticCount: { hash, interpreted: ["count"] } });
  expect(kernel.count([0])).toBe(1n);
  expect(kernel.count([4])).toBe(5n);
});

test("a compiled count that gives nothing still declines", () => {
  const kernel = kernelOn(ce, family, { SyntheticCount: { hash, count: () => undefined } });
  expect(() => kernel.count([4])).toThrow(/not bigint yet/);
});
