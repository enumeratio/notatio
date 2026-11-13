import { bareEngine } from "@notatio/engine/testing";
import { expect, test } from "vite-plus/test";
import { declareCombinatorics } from "../../src/index.ts";
import { applyDefinition } from "../../src/statistics/declare.ts";
import { bySignature } from "../../src/statistics/types.ts";
import { SET_PARTITION_STATISTICS } from "../src/statistics.ts";
import {
  DEFINED_ON_MATCHINGS,
  type Matching,
  PERFECT_MATCHING_READINGS,
} from "./perfect-matching-findstat-readings.ts";

// The whole library, as a page evaluates it.
const ce = bareEngine();
declareCombinatorics(ce);
const index = bySignature(SET_PARTITION_STATISTICS);

/** Every perfect matching of 2n points: each pair ascending, the pairs by least element. */
function matchings(n: number): Matching[] {
  const pair = (free: readonly number[]): [number, number][][] => {
    if (free.length === 0) return [[]];
    const [first, ...rest] = free;
    return rest.flatMap((partner, i) =>
      pair(rest.filter((_, j) => j !== i)).map((others) => [[first!, partner] as [number, number], ...others]),
    );
  };
  return pair(Array.from({ length: 2 * n }, (_, i) => i + 1));
}
const upTo = (n: number): Matching[] => Array.from({ length: n }, (_, k) => k + 1).flatMap(matchings);
const pairsOf = (m: Matching): unknown => ["List", ...m.map((pair) => ["List", ...pair])];

const evaluate = (head: string, m: Matching): number =>
  applyDefinition(ce, index.get(`${head}@PerfectMatching`)!, ce.box(pairsOf(m) as never)).re;

test("the matchings are counted by the double factorial", () => {
  expect([1, 2, 3, 4, 5].map((n) => matchings(n).length)).toEqual([1, 3, 15, 105, 945]);
});

test("every perfect-matching definition has an independent reading", () => {
  const heads = SET_PARTITION_STATISTICS.filter((d) => d.on === "PerfectMatching").map((d) => d.head);
  expect(heads.toSorted()).toEqual(DEFINED_ON_MATCHINGS);
});

/** Heads that take more than a few tenths of a second a matching of 8 points to interpret: they run to 6 points here and to 8 under DEEP_TESTS. */
const SLOW = new Set([
  "DihedralOrbitSize",
  "OscillatingTableauLargestPartitionSize",
  "RestrictedGrowthThreeOneTwoCount",
  "RestrictedGrowthTwoOneThreeCount",
  "RestrictedGrowthTwoThreeOneCount",
  "UnicellularMapVertexCount",
]);

for (const head of DEFINED_ON_MATCHINGS)
  test(`${head} agrees over every perfect matching of 2..${SLOW.has(head) ? 6 : 8} points`, () => {
    for (const m of upTo(SLOW.has(head) ? 3 : 4))
      expect(evaluate(head, m), JSON.stringify(m)).toBe(PERFECT_MATCHING_READINGS[head]!(m));
  });

test.skipIf(!process.env.DEEP_TESTS)(
  "the slow perfect-matching definitions agree over the matchings of 8 points",
  () => {
    for (const m of matchings(4))
      for (const head of SLOW)
        expect(evaluate(head, m), `${head} ${JSON.stringify(m)}`).toBe(PERFECT_MATCHING_READINGS[head]!(m));
  },
  1_800_000,
);

test("each head called through the carrier gives the reading, shared ones included", () => {
  for (const [head, expected] of Object.entries(PERFECT_MATCHING_READINGS))
    for (const m of upTo(3))
      expect(
        ce.box(["CombinatorialStat", ["PerfectMatching", pairsOf(m)], `'${head}'`] as never).evaluate().re,
        `${head} ${JSON.stringify(m)}`,
      ).toBe(expected(m));
});

// Ten points run nightly (DEEP_TESTS=1).
test.skipIf(!process.env.DEEP_TESTS)(
  "every perfect-matching definition agrees over the matchings of 10 points",
  () => {
    for (const m of matchings(5))
      for (const head of DEFINED_ON_MATCHINGS.filter((h) => !SLOW.has(h)))
        expect(evaluate(head, m), `${head} ${JSON.stringify(m)}`).toBe(PERFECT_MATCHING_READINGS[head]!(m));
  },
  1_800_000,
);
