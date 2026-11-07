import { bareEngine } from "@enumeratio/engine/testing";
import { expect, test } from "vite-plus/test";
import { declareCombinatorics } from "../../src/index.ts";
import { applyDefinition } from "../../src/statistics/declare.ts";
import { bySignature } from "../../src/statistics/types.ts";
import { PARTITION_STATISTICS } from "../src/statistics.ts";
import { PARTITION_READINGS, type Partition } from "./partition-findstat-readings.ts";

// The whole library, as a page evaluates: a definition that works on a bare engine can still not on this one.
const ce = bareEngine();
declareCombinatorics(ce);
const index = bySignature(PARTITION_STATISTICS);

/** Partitions of n, as weakly decreasing part lists. */
function partitions(n: number, cap = n): number[][] {
  if (n === 0) return [[]];
  const out: number[][] = [];
  for (let part = Math.min(n, cap); part >= 1; part--)
    for (const rest of partitions(n - part, part)) out.push([part, ...rest]);
  return out;
}

const evaluate = (head: string, l: Partition): number =>
  applyDefinition(ce, index.get(`${head}@IntegerPartition`)!, ce.box(["List", ...l])).re;

test("every FindStat reading belongs to a definition", () => {
  for (const head of Object.keys(PARTITION_READINGS)) expect(index.get(`${head}@IntegerPartition`), head).toBeDefined();
});

test("each head called on the carrier value gives the reading", () => {
  for (const [head, expected] of Object.entries(PARTITION_READINGS))
    for (const l of [0, 1, 2, 3, 4, 5].flatMap((n) => partitions(n)))
      expect(
        ce.box([head, ["IntegerPartition", ["List", ...l]]] as never).evaluate().re,
        `${head} [${l.join(", ")}]`,
      ).toBe(expected(l));
});

/** Statistics that code a partition as a base-(n + 1) number, one place per part size: at n = 14 the code passes 2^53
 *  and the interpreter never finishes one (the deep sweep waited hours on RefinementCount [14]), so they are swept to
 *  the largest size whose codes are exact. */
const CODED_TO = 13;
const CODED = new Set(["RefinementCount", "CoarseningCount", "SingletonRefinementCount"]);

// Larger partitions run nightly (DEEP_TESTS=1).
test.skipIf(!process.env.DEEP_TESTS)(
  "every FindStat definition agrees over every partition of 9..14",
  () => {
    for (const l of [9, 10, 11, 12, 13, 14].flatMap((n) => partitions(n)))
      for (const [head, expected] of Object.entries(PARTITION_READINGS)) {
        if (CODED.has(head) && l.reduce((a, b) => a + b, 0) > CODED_TO) continue;
        expect(evaluate(head, l), `${head} [${l.join(", ")}]`).toBe(expected(l));
      }
  },
  1_800_000,
);

test.todo("the coded refinement statistics at partitions of 14 and more (codes past 2^53)");
