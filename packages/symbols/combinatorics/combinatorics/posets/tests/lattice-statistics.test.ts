import { bareEngine } from "@notatio/engine/testing";
import { expect, test } from "vite-plus/test";
import { declareCombinatorics } from "../../src/index.ts";
import { applyDefinition } from "../../src/statistics/declare.ts";
import { bySignature } from "../../src/statistics/types.ts";
import { LATTICE_STATISTICS } from "../src/statistics.lattices.ts";
import {
  fewestSmallChainElements,
  isLatticeReading,
  LATTICE_READINGS,
  latticesOfSize,
} from "./lattice-findstat-readings.ts";
import { type Poset, posetsOfSize } from "./poset-findstat-readings.ts";

// The whole library, as a page evaluates it.
const ce = bareEngine();
declareCombinatorics(ce);
const index = bySignature(LATTICE_STATISTICS);
const DEEP = process.env.DEEP_TESTS === "1";
/** The largest lattice every definition is read on: the standard run to 6 elements, the deep run to 7. */
const LARGEST = DEEP ? 7 : 6;

const contents = (p: Poset): unknown => ["List", ...p.map((lower) => ["List", ...lower])];
const carrier = (p: Poset): unknown => ["Poset", contents(p)];
const evaluate = (head: string, p: Poset): number =>
  applyDefinition(ce, index.get(`${head}@Poset`)!, ce.box(contents(p) as never)).re;
/** The call on the carrier value, unevaluated when the poset is outside the head's domain. */
const call = (head: string, p: Poset) => ce.box([head, carrier(p)] as never).evaluate();
const statistics = LATTICE_STATISTICS.filter((d) => d.head !== "IsLattice").map((d) => d.head);

test("the naturally labeled lattices are counted", () => {
  expect([1, 2, 3, 4, 5, 6].map((n) => latticesOfSize(n).length)).toEqual([1, 1, 1, 2, 7, 39]);
  if (DEEP) expect(latticesOfSize(7).length).toBe(320);
});

test("IsLattice equals the reading on every poset on 0..6 elements", () => {
  let lattices = 0;
  for (let n = 0; n <= 6; n++)
    for (const p of posetsOfSize(n)) {
      const answer = call("IsLattice", p).json;
      expect(answer, JSON.stringify(p)).toBe(isLatticeReading(p) ? "True" : "False");
      if (isLatticeReading(p)) lattices++;
    }
  // The empty poset and the lattices on 1 to 6 elements: 1 + 1 + 1 + 1 + 2 + 7 + 39 = 52 in all, 39 of them on 6.
  expect(lattices).toBe(52);
  expect(call("IsLattice", []).json).toBe("True");
});

test("a poset with a top and a join for every pair, but no bottom, is not a lattice", () => {
  const upsideDownV: Poset = [[], [], [1, 2]];
  expect(isLatticeReading(upsideDownV)).toBe(false);
  expect(call("IsLattice", upsideDownV).json).toBe("False");
});

test("every lattice definition has an independent reading", () => {
  for (const head of statistics) expect(LATTICE_READINGS[head], head).toBeDefined();
  expect(statistics.toSorted()).toEqual(Object.keys(LATTICE_READINGS).toSorted());
});

for (const [head, expected] of Object.entries(LATTICE_READINGS))
  test(`${head} agrees over every lattice on 1..${LARGEST} elements`, () => {
    const size = index.get(`${head}@Poset`)!.where === undefined ? 0 : 1;
    for (let n = size; n <= LARGEST; n++)
      for (const p of latticesOfSize(n)) {
        const value = expected(p);
        if (value === undefined) continue;
        expect(evaluate(head, p), JSON.stringify(p)).toBe(value);
      }
  });

for (const [head, expected] of Object.entries(LATTICE_READINGS))
  test(`${head} called on the carrier value, evaluated and numerically, gives the reading`, () => {
    for (const p of [1, 2, 3, 4].flatMap(latticesOfSize)) {
      const value = expected(p);
      if (value === undefined) {
        expect(call(head, p).operator, JSON.stringify(p)).toBe(head);
        continue;
      }
      expect(call(head, p).re, JSON.stringify(p)).toBe(value);
      expect(ce.box([head, carrier(p)] as never).N().re, JSON.stringify(p)).toBe(value);
    }
  });

test("a statistic stays unevaluated on a poset that is not a lattice", () => {
  const notLattices = [0, 1, 2, 3, 4]
    .flatMap(posetsOfSize)
    .filter((p) => !isLatticeReading(p))
    .concat([[[], [], [1, 2]]]);
  expect(notLattices.length).toBeGreaterThan(40);
  for (const p of notLattices)
    for (const head of statistics) {
      const result = call(head, p);
      expect(result.operator, `${head} ${JSON.stringify(p)}`).toBe(head);
      expect(ce.box([head, carrier(p)] as never).N().operator, `${head} ${JSON.stringify(p)} numerically`).toBe(head);
    }
});

test("the poset with no elements: only the zero divisors have a value, 0", () => {
  expect(call("ZeroDivisorCount", []).re).toBe(0);
  for (const head of statistics.filter((h) => h !== "ZeroDivisorCount"))
    expect(call(head, []).operator, head).toBe(head);
});

test("CoverJoinChainSize is FindStat's St001720, which is not always the shortest chain", () => {
  // The lattice of FindStat's row ([(0,3),(0,4),(1,5),(2,5),(3,6),(4,2),(4,6),(6,1)],7), whose row says 4.
  const lattice: Poset = [[], [1], [1], [2], [2, 3], [5], [4, 6]];
  expect(isLatticeReading(lattice)).toBe(true);
  expect([evaluate("CoverJoinChainSize", lattice), fewestSmallChainElements(lattice)]).toEqual([4, 3]);
});

test("the one-element lattice has no Frankl number", () => {
  expect(call("FranklNumber", [[]]).operator).toBe("FranklNumber");
  expect(call("FranklNumber", [[], [1]]).re).toBe(0);
});
