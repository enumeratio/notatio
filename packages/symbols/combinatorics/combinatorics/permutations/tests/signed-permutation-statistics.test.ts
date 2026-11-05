import { bareEngine } from "@enumeratio/engine/testing";
import { expect, test } from "vite-plus/test";
import { declareCombinatorics } from "../../src/index.ts";
import { applyDefinition } from "../../src/statistics/declare.ts";
import { bySignature } from "../../src/statistics/types.ts";
import { PERMUTATION_STATISTICS } from "../src/statistics.ts";
import { SIGNED_PERMUTATION_READINGS } from "./signed-permutation-findstat-readings.ts";

// The whole library, as a page evaluates it.
const ce = bareEngine();
declareCombinatorics(ce);
const index = bySignature(PERMUTATION_STATISTICS);
const SHARED = ["Excedances", "WeakExcedances"];

/** Every signed permutation of 1..n: a permutation with a sign on each entry. */
function signedPermutations(n: number): number[][] {
  const permutations = (m: number): number[][] =>
    m === 0
      ? [[]]
      : permutations(m - 1).flatMap((rest) =>
          Array.from({ length: m }, (_, i) => [...rest.slice(0, i), m, ...rest.slice(i)]),
        );
  return permutations(n).flatMap((p) =>
    Array.from({ length: 2 ** n }, (_, mask) => p.map((v, i) => (mask & (1 << i) ? -v : v))),
  );
}
const upTo = (n: number): number[][] => Array.from({ length: n + 1 }, (_, k) => k).flatMap(signedPermutations);

const defined = Object.keys(SIGNED_PERMUTATION_READINGS).filter((head) => !SHARED.includes(head));
const evaluate = (head: string, p: readonly number[]): number =>
  applyDefinition(ce, index.get(`${head}@SignedPermutation`)!, ce.box(["List", ...p] as never)).re;
const viaCarrier = (head: string, p: readonly number[]): number =>
  ce.box(["CombinatorialStat", ["SignedPermutation", ["List", ...p]], `'${head}'`] as never).evaluate().re;

test("every signed-permutation definition has an independent reading", () => {
  const heads = PERMUTATION_STATISTICS.filter((d) => d.on === "SignedPermutation").map((d) => d.head);
  for (const head of heads) expect(SIGNED_PERMUTATION_READINGS[head], head).toBeDefined();
  expect(heads.toSorted()).toEqual(defined.toSorted());
});

for (const head of defined)
  test(`${head} agrees over every signed permutation of length 0..4`, () => {
    for (const p of upTo(4)) expect(evaluate(head, p), p.join(",")).toBe(SIGNED_PERMUTATION_READINGS[head]!(p));
  });

test("each head called through the carrier gives the reading, shared ones included", () => {
  for (const [head, expected] of Object.entries(SIGNED_PERMUTATION_READINGS))
    for (const p of upTo(3)) expect(viaCarrier(head, p), `${head} ${p.join(",")}`).toBe(expected(p));
});

// Length 5 runs nightly (DEEP_TESTS=1).
test.skipIf(!process.env.DEEP_TESTS)(
  "every signed-permutation definition agrees over the signed permutations of length 5",
  () => {
    for (const p of signedPermutations(5))
      for (const head of defined)
        expect(evaluate(head, p), `${head} ${p.join(",")}`).toBe(SIGNED_PERMUTATION_READINGS[head]!(p));
  },
  1_800_000,
);
