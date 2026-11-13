import { bareEngine } from "@notatio/engine/testing";
import { expect, test } from "vite-plus/test";
import { declareCombinatorics } from "../../src/index.ts";
import { applyDefinition } from "../../src/statistics/declare.ts";
import { bySignature } from "../../src/statistics/types.ts";
import { WORD_STATISTICS } from "../src/statistics.ts";
import { PARKING_FUNCTION_READINGS, SHARED_PARKING_FUNCTION_READINGS } from "./parking-function-findstat-readings.ts";

// The whole library, as a page evaluates it.
const ce = bareEngine();
declareCombinatorics(ce);
const index = bySignature(WORD_STATISTICS);

/** The parking functions of length n: the lists on 1 .. n whose k-th smallest entry is at most k. */
function parkingFunctions(n: number): number[][] {
  const found: number[][] = [];
  const extend = (entries: number[]): void => {
    if (entries.length === n) {
      if (entries.toSorted((a, b) => a - b).every((entry, k) => entry <= k + 1)) found.push(entries);
      return;
    }
    for (let entry = 1; entry <= n; entry++) extend([...entries, entry]);
  };
  extend([]);
  return found;
}
const upTo = (n: number): number[][] => Array.from({ length: n }, (_, k) => k + 1).flatMap(parkingFunctions);
const listOf = (p: readonly number[]): unknown => ["List", ...p];

const evaluate = (head: string, p: readonly number[]): number =>
  applyDefinition(ce, index.get(`${head}@ParkingFunction`)!, ce.box(listOf(p) as never)).re;

test("the parking functions are counted by (n + 1)^(n - 1)", () => {
  expect([1, 2, 3, 4, 5].map((n) => parkingFunctions(n).length)).toEqual([1, 3, 16, 125, 1296]);
});

test("every parking-function definition has an independent reading", () => {
  const heads = WORD_STATISTICS.filter((d) => d.on === "ParkingFunction").map((d) => d.head);
  for (const head of heads) expect(PARKING_FUNCTION_READINGS[head], head).toBeDefined();
  expect(heads.toSorted()).toEqual(Object.keys(PARKING_FUNCTION_READINGS).toSorted());
});

/** Heads that take about a tenth of a second a parking function to interpret: lengths 1..2 here, 1..3 under DEEP_TESTS. */
const COSTLY = new Set([
  "ParkingFunctionDinv",
  "ParkingMajorIndex",
  "PrimaryDinversionPairCount",
  "SecondaryDinversionPairCount",
]);
const largest = (head: string): number => (COSTLY.has(head) && !process.env.DEEP_TESTS ? 2 : 3);

for (const [head, expected] of Object.entries(PARKING_FUNCTION_READINGS))
  test(`${head} agrees over every parking function of length 1..${largest(head)}`, () => {
    for (const p of upTo(largest(head))) expect(evaluate(head, p), JSON.stringify(p)).toBe(expected(p));
  });

test("each head called on the carrier value gives the reading, shared heads included", () => {
  for (const [head, expected] of Object.entries({ ...PARKING_FUNCTION_READINGS, ...SHARED_PARKING_FUNCTION_READINGS }))
    for (const p of upTo(COSTLY.has(head) ? 2 : 3))
      expect(
        ce.box(["CombinatorialStat", ["ParkingFunction", listOf(p)], `'${head}'`] as never).evaluate().re,
        `${head} ${JSON.stringify(p)}`,
      ).toBe(expected(p));
});

// Lengths 4 and 5 run nightly (DEEP_TESTS=1).
test.skipIf(!process.env.DEEP_TESTS)("every parking-function definition agrees over lengths 4 and 5", () => {
  for (const p of [...parkingFunctions(4), ...parkingFunctions(5)])
    for (const [head, expected] of Object.entries(PARKING_FUNCTION_READINGS))
      expect(evaluate(head, p), `${head} ${JSON.stringify(p)}`).toBe(expected(p));
});
