import { bareEngine } from "@notatio/engine/testing";
import { expect, test } from "vite-plus/test";
import { declareCombinatorics } from "../../src/index.ts";
import { applyDefinition } from "../../src/statistics/declare.ts";
import { bySignature } from "../../src/statistics/types.ts";
import { POSET_STATISTICS } from "../src/statistics.ts";
import { isPoset, type Poset, POSET_READINGS, posetsOfSize } from "./poset-findstat-readings.ts";

// The whole library, as a page evaluates it.
const ce = bareEngine();
declareCombinatorics(ce);
const index = bySignature(POSET_STATISTICS);
const DEEP = process.env.DEEP_TESTS === "1";
/** Only some heads are asked about the bigger sizes: the standard run reads every poset to 4 elements, the deep run to 5. */
const LARGEST = DEEP ? 5 : 4;

const contents = (p: Poset): unknown => ["List", ...p.map((lower) => ["List", ...lower])];
const evaluate = (head: string, p: Poset): number =>
  applyDefinition(ce, index.get(`${head}@Poset`)!, ce.box(contents(p) as never)).re;

test("the posets are counted", () => {
  expect([1, 2, 3, 4, 5].map((n) => posetsOfSize(n).length)).toEqual([1, 2, 7, 40, 357]);
  for (let n = 0; n <= 5; n++) for (const p of posetsOfSize(n)) expect(isPoset(p), JSON.stringify(p)).toBe(true);
});

test("a value that is not a naturally labeled, transitively reduced poset is refused", () => {
  expect(isPoset([[], [1], [1, 2]])).toBe(false);
  expect(isPoset([[], [2]])).toBe(false);
  expect(isPoset([[], [1], [2, 1]])).toBe(false);
  expect(isPoset([[], [1], [1, 2]])).toBe(false);
  expect(isPoset([[], [1], [2]])).toBe(true);
});

test("every poset definition has an independent reading", () => {
  const heads = POSET_STATISTICS.filter((d) => d.on === "Poset").map((d) => d.head);
  for (const head of heads) expect(POSET_READINGS[head], head).toBeDefined();
  expect(heads.toSorted()).toEqual(Object.keys(POSET_READINGS).toSorted());
});

for (const [head, expected] of Object.entries(POSET_READINGS))
  test(`${head} agrees over every poset on 0..${LARGEST} elements`, () => {
    for (let n = 0; n <= LARGEST; n++)
      for (const p of posetsOfSize(n)) expect(evaluate(head, p), JSON.stringify(p)).toBe(expected(p));
  });

for (const [head, expected] of Object.entries(POSET_READINGS))
  test(`${head} called on the carrier value gives the reading`, () => {
    for (const p of [0, 1, 2, 3].flatMap(posetsOfSize))
      expect(ce.box([head, ["Poset", contents(p)]] as never).evaluate().re, `${head} ${JSON.stringify(p)}`).toBe(
        expected(p),
      );
  });
