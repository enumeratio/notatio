// A statistic is a function of the isomorphism class: each of the poset statistics gives the same value on a poset and on its
// canonical form, whatever the labeling.
import { bareEngine } from "@notatio/engine/testing";
import { expect, test } from "vite-plus/test";
import { declareCombinatorics } from "../../src/index.ts";
import { applyDefinition } from "../../src/statistics/declare.ts";
import { bySignature } from "../../src/statistics/types.ts";
import { canonicalPoset } from "../src/canonical.ts";
import { POSET_STATISTICS } from "../src/statistics.ts";
import { type Poset, posetsOfSize } from "./poset-findstat-readings.ts";

const ce = bareEngine();
declareCombinatorics(ce);
const index = bySignature(POSET_STATISTICS);
const heads = POSET_STATISTICS.filter((d) => d.on === "Poset").map((d) => d.head);

const DEEP = process.env.DEEP_TESTS === "1";
/** The standard run takes every poset to 3 elements (a few tenths of a second more at 4), the deep run to 5. */
const LARGEST = DEEP ? 5 : 3;

const contents = (p: Poset): unknown => ["List", ...p.map((lower) => ["List", ...lower])];
const evaluate = (head: string, p: Poset): number =>
  applyDefinition(ce, index.get(`${head}@Poset`)!, ce.box(contents(p) as never)).re;

test("the statistics are the 45 of the carrier", () => {
  expect(heads.length).toBe(45);
});

test(`every statistic is the same on a poset and on its canonical form, through ${LARGEST} elements`, () => {
  let relabeled = 0;
  for (let n = 0; n <= LARGEST; n++)
    for (const p of posetsOfSize(n)) {
      const canonical = canonicalPoset(p);
      if (JSON.stringify(canonical) !== JSON.stringify(p)) relabeled++;
      for (const head of heads)
        expect([head, JSON.stringify(p), evaluate(head, canonical)]).toEqual([
          head,
          JSON.stringify(p),
          evaluate(head, p),
        ]);
    }
  // Some of the labelings are not canonical, or the test says nothing.
  expect(relabeled).toBeGreaterThan(0);
});
