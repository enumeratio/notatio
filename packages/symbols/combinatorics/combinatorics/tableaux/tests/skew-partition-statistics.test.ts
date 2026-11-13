import { bareEngine } from "@notatio/engine/testing";
import { expect, test } from "vite-plus/test";
import { declareCombinatorics } from "../../src/index.ts";
import { applyDefinition } from "../../src/statistics/declare.ts";
import { bySignature } from "../../src/statistics/types.ts";
import { TABLEAU_STATISTICS } from "../src/statistics.ts";
import { SKEW_PARTITION_READINGS, type Skew } from "./skew-partition-findstat-readings.ts";

// The whole library, as a page evaluates it.
const ce = bareEngine();
declareCombinatorics(ce);
const index = bySignature(TABLEAU_STATISTICS);

const parts = (list: unknown): number[] => (list as unknown[]).slice(1).map(Number);
/** Our reduced skew shapes of n cells, as [outer, inner] part lists. */
function shapes(n: number): Skew[] {
  const family = ["SkewPartitions", n];
  const total = Number(ce.box(["Count", family] as never).evaluate().json);
  return Array.from({ length: total }, (_, i) => {
    const [outer, inner] = (ce.box(["At", family, i + 1] as never).evaluate().json as unknown as unknown[]).slice(1);
    return [parts(outer), parts(inner)] as const;
  });
}
const upTo = (n: number): Skew[] => Array.from({ length: n }, (_, k) => k + 1).flatMap(shapes);
const contents = ([outer, inner]: Skew): unknown => ["List", ["List", ...outer], ["List", ...inner]];

const evaluate = (head: string, shape: Skew): number =>
  applyDefinition(ce, index.get(`${head}@SkewPartition`)!, ce.box(contents(shape) as never)).re;

test("the shapes are counted", () => {
  expect([1, 2, 3, 4, 5].map((n) => shapes(n).length)).toEqual([1, 3, 9, 28, 87]);
});

test("every skew-partition definition has an independent reading", () => {
  const heads = TABLEAU_STATISTICS.filter((d) => d.on === "SkewPartition").map((d) => d.head);
  for (const head of heads) expect(SKEW_PARTITION_READINGS[head], head).toBeDefined();
  expect(heads.toSorted()).toEqual(Object.keys(SKEW_PARTITION_READINGS).toSorted());
});

for (const [head, expected] of Object.entries(SKEW_PARTITION_READINGS))
  test(`${head} agrees over every skew partition of 1..4 cells`, () => {
    for (const shape of upTo(4)) expect(evaluate(head, shape), JSON.stringify(shape)).toBe(expected(shape));
  });

test("each head called on the carrier value gives the reading", () => {
  for (const [head, expected] of Object.entries(SKEW_PARTITION_READINGS))
    for (const shape of upTo(3))
      expect(
        ce.box([head, ["SkewPartition", contents(shape)]] as never).evaluate().re,
        `${head} ${JSON.stringify(shape)}`,
      ).toBe(expected(shape));
});

// Sizes 5 and 6 run nightly (DEEP_TESTS=1).
test.skipIf(!process.env.DEEP_TESTS)(
  "every skew-partition definition agrees over the skew partitions of 5 and 6 cells",
  () => {
    for (const shape of [5, 6].flatMap(shapes))
      for (const [head, expected] of Object.entries(SKEW_PARTITION_READINGS))
        expect(evaluate(head, shape), `${head} ${JSON.stringify(shape)}`).toBe(expected(shape));
  },
  1_800_000,
);
