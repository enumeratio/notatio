import { bareEngine } from "@enumeratio/engine/testing";
import { expect, test } from "vite-plus/test";
import { declareCombinatorics } from "../../src/index.ts";
import { applyDefinition } from "../../src/statistics/declare.ts";
import { bySignature } from "../../src/statistics/types.ts";
import { TABLEAU_STATISTICS } from "../src/statistics.ts";
import { PLANE_PARTITION_READINGS, type Plane } from "./plane-partition-findstat-readings.ts";

// The whole library, as a page evaluates it.
const ce = bareEngine();
declareCombinatorics(ce);
const index = bySignature(TABLEAU_STATISTICS);

/** The weakly decreasing lists of positive entries with sum `total`, none larger than `most`. */
const partitions = (total: number, most: number): number[][] =>
  total === 0
    ? [[]]
    : Array.from({ length: Math.min(total, most) }, (_, k) => Math.min(total, most) - k).flatMap((first) =>
        partitions(total - first, first).map((rest) => [first, ...rest]),
      );
/** The plane partitions of n boxes: each row a partition no longer than, and entrywise at most, the row above. */
function planePartitions(n: number): number[][][] {
  const extend = (left: number, above: readonly number[] | undefined): number[][][] => {
    if (left === 0) return [[]];
    return Array.from({ length: left }, (_, k) => k + 1).flatMap((total) =>
      partitions(total, left)
        .filter((row) => above === undefined || (row.length <= above.length && row.every((e, j) => e <= above[j]!)))
        .flatMap((row) => extend(left - total, row).map((rest) => [row, ...rest])),
    );
  };
  return extend(n, undefined);
}
const upTo = (n: number): number[][][] => Array.from({ length: n }, (_, k) => k + 1).flatMap(planePartitions);
const rowsOf = (p: Plane): unknown => ["List", ...p.map((row) => ["List", ...row])];

const evaluate = (head: string, p: Plane): number =>
  applyDefinition(ce, index.get(`${head}@PlanePartition`)!, ce.box(rowsOf(p) as never)).re;

test("the plane partitions are counted by MacMahon's product", () => {
  expect([1, 2, 3, 4, 5, 6].map((n) => planePartitions(n).length)).toEqual([1, 3, 6, 13, 24, 48]);
});

test("every plane-partition definition has an independent reading", () => {
  const heads = TABLEAU_STATISTICS.filter((d) => d.on === "PlanePartition").map((d) => d.head);
  for (const head of heads) expect(PLANE_PARTITION_READINGS[head], head).toBeDefined();
  expect(heads.toSorted()).toEqual(Object.keys(PLANE_PARTITION_READINGS).toSorted());
});

for (const [head, expected] of Object.entries(PLANE_PARTITION_READINGS))
  test(`${head} agrees over every plane partition of 1..4 boxes`, () => {
    for (const p of upTo(4)) expect(evaluate(head, p), JSON.stringify(p)).toBe(expected(p));
  });

test("each head called on the carrier value gives the reading", () => {
  for (const [head, expected] of Object.entries(PLANE_PARTITION_READINGS))
    for (const p of upTo(3))
      expect(
        ce.box(["CombinatorialStat", ["PlanePartition", rowsOf(p)], `'${head}'`] as never).evaluate().re,
        `${head} ${JSON.stringify(p)}`,
      ).toBe(expected(p));
});

// Boxes 5 and 6 run nightly (DEEP_TESTS=1).
test.skipIf(!process.env.DEEP_TESTS)("every plane-partition definition agrees over 5 and 6 boxes", () => {
  for (const p of [...planePartitions(5), ...planePartitions(6)])
    for (const [head, expected] of Object.entries(PLANE_PARTITION_READINGS))
      expect(evaluate(head, p), `${head} ${JSON.stringify(p)}`).toBe(expected(p));
});
