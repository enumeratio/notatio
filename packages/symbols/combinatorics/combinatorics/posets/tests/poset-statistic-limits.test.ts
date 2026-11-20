// The poset statistics that enumerate subsets, ideals or linear extensions are defined up to a number of elements: at the limit
// a value is held to a closed form, one past it the call stays unevaluated on every route and returns at once.

import { bareEngine } from "@notatio/engine/testing";
import { expect, test } from "vite-plus/test";
import { declareCombinatorics } from "../../src/index.ts";
import { applyDefinition, inDomain } from "../../src/statistics/declare.ts";
import { COMPILED } from "../../src/statistics/compiled.ts";
import { bySignature, signatureOf, whereSignatureOf } from "../../src/statistics/types.ts";
import { ELEMENT_LIMIT, atMostElements } from "../src/statistics.ts";
import { POSET_AREA_STATISTICS } from "../src/statistics.lattices.ts";
import type { Poset } from "./poset-findstat-readings.ts";

// The whole library, as a page evaluates it.
const ce = bareEngine();
declareCombinatorics(ce);
const index = bySignature(POSET_AREA_STATISTICS);
const DEEP = process.env.DEEP_TESTS === "1";
/** The standard run holds a value to its closed form at 8 elements, the deep run at the limit, where a call takes up to 1.3 s. */
const sizeOf = (limit: number): number => (DEEP ? limit : Math.min(limit, 8));

const contents = (p: Poset): unknown => ["List", ...p.map((lower) => ["List", ...lower])];
const carrier = (p: Poset): unknown => ["Poset", contents(p)];
const antichain = (n: number): Poset => Array.from({ length: n }, () => []);
const chain = (n: number): Poset => Array.from({ length: n }, (_, i) => (i === 0 ? [] : [i]));
/** The bottom, n - 2 atoms and the top: the lattice with the most subsets that are closed or meet at the bottom. */
const diamond = (n: number): Poset =>
  Array.from({ length: n }, (_, i) =>
    i === 0 ? [] : i === n - 1 ? Array.from({ length: n - 2 }, (_, j) => j + 2) : [1],
  );

const factorial = (n: number): number => (n <= 1 ? 1 : n * factorial(n - 1));
const choose = (n: number, k: number): number => (k === 0 ? 1 : (choose(n - 1, k - 1) * n) / k);
/** The ordered set partitions of n elements: the first block has k elements, the rest is one of n - k. */
const fubini = (n: number): number =>
  n === 0 ? 1 : Array.from({ length: n }, (_, j) => choose(n, j + 1) * fubini(n - j - 1)).reduce((a, b) => a + b, 0);

interface Case {
  /** The most elements the head answers on. */
  limit: number;
  /** The value on the antichain and on the chain of n elements, and why. */
  antichain: (n: number) => number;
  chain: (n: number) => number;
  reason: string;
}

const CASES: Record<string, Case> = {
  PosetWidth: {
    limit: ELEMENT_LIMIT,
    antichain: (n) => n,
    chain: () => 1,
    reason: "the antichain is the largest antichain",
  },
  ElementCountMinusWidth: {
    limit: ELEMENT_LIMIT,
    antichain: () => 0,
    chain: (n) => n - 1,
    reason: "the elements less the width, n and 1",
  },
  PrincipalFilterSizeProduct: {
    limit: 18,
    antichain: () => 1,
    chain: factorial,
    reason: "each filter of the chain has n, n - 1, ... 1 elements; of the antichain, 1",
  },
  ChainCount: {
    limit: ELEMENT_LIMIT,
    antichain: (n) => n + 1,
    chain: (n) => 2 ** n,
    reason: "every subset of a chain is a chain; in an antichain only the empty set and the singletons",
  },
  AntichainCount: {
    limit: ELEMENT_LIMIT,
    antichain: (n) => 2 ** n,
    chain: (n) => n + 1,
    reason: "every subset of an antichain is one; in a chain only the empty set and the singletons",
  },
  LinearExtensionCount: { limit: ELEMENT_LIMIT, antichain: factorial, chain: () => 1, reason: "n! orderings, and 1" },
  JumpNumber: {
    limit: ELEMENT_LIMIT,
    antichain: (n) => n - 1,
    chain: () => 0,
    reason: "no element covers another in an antichain, so every step is a jump; none in a chain",
  },
  CutCount: {
    limit: ELEMENT_LIMIT,
    antichain: (n) => n + 2,
    chain: (n) => n,
    reason:
      "the cuts of an antichain are the singletons, the empty set and the whole; of a chain, its n principal ideals",
  },
  MostBalancedPairExtensionCount: {
    limit: ELEMENT_LIMIT,
    antichain: (n) => factorial(n) / 2,
    chain: () => 0,
    reason: "half the n! orderings put either of two incomparable elements first; no pair of a chain is incomparable",
  },
  OneThirdBalancedPairCount: {
    limit: ELEMENT_LIMIT,
    antichain: (n) => choose(n, 2),
    chain: () => 0,
    reason: "every pair of an antichain splits the orderings in half; no pair of a chain is incomparable",
  },
  HalfBalancedPairCount: {
    limit: ELEMENT_LIMIT,
    antichain: (n) => choose(n, 2),
    chain: () => 0,
    reason: "every pair of an antichain splits the orderings in half; no pair of a chain is incomparable",
  },
  ShortestMaximalAntichainCount: {
    limit: ELEMENT_LIMIT,
    antichain: () => 1,
    chain: (n) => n,
    reason: "the one maximal antichain of an antichain is the whole; those of a chain are its n singletons",
  },
  ShortestMaximalAntichainSize: {
    limit: ELEMENT_LIMIT,
    antichain: (n) => n,
    chain: () => 1,
    reason: "the one maximal antichain of an antichain is the whole; those of a chain are singletons",
  },
  LargestMaximalAntichainCount: {
    limit: ELEMENT_LIMIT,
    antichain: () => 1,
    chain: (n) => n,
    reason: "the one maximal antichain of an antichain is the whole; those of a chain are its n singletons",
  },
  MaximalAntichainCount: {
    limit: ELEMENT_LIMIT,
    antichain: () => 1,
    chain: (n) => n,
    reason: "the one maximal antichain of an antichain is the whole; those of a chain are its n singletons",
  },
  GreedyLinearExtensionCount: {
    limit: 11,
    antichain: factorial,
    chain: () => 1,
    reason: "in an antichain every element is minimal, so the greedy sequences are the n! orderings; a chain has one",
  },
  ThreeChainHomomorphismCount: {
    limit: 11,
    antichain: (n) => 3 ** n,
    chain: (n) => ((n + 1) * (n + 2)) / 2,
    reason: "each of n free elements goes to one of three; a chain's maps are the pairs of nested prefixes",
  },
  OrderPreservingSurjectionToChainCount: {
    limit: 11,
    antichain: fubini,
    chain: (n) => 2 ** (n - 1),
    reason: "the ordered set partitions of an antichain (Fubini numbers); the compositions of n for a chain",
  },
  IntervalClosedSetCount: {
    limit: ELEMENT_LIMIT,
    antichain: (n) => 2 ** n,
    chain: (n) => (n * (n + 1)) / 2 + 1,
    reason:
      "every subset of an antichain is interval-closed; in a chain the runs of consecutive elements and the empty set",
  },
};

/** The five lattice statistics that enumerate subsets, on the chain, whose values are closed forms. */
const LATTICE_CASES: Record<string, { chain: (n: number) => number; reason: string }> = {
  SublatticeCount: { chain: (n) => 2 ** n, reason: "every subset of a chain is closed under join and meet" },
  LatticeBreadth: { chain: () => 1, reason: "a join-irredundant subset of a chain is one element" },
  NondegenerateBottomMeetSubsetCount: {
    chain: () => 0,
    reason: "a subset without the bottom meets above it in a chain",
  },
  BottomMeetSubsetCount: { chain: (n) => 2 ** (n - 1), reason: "the subsets that hold the bottom" },
  MinimalBottomMeetSubsetCount: { chain: () => 1, reason: "the bottom alone" },
};

const heads = (): string[] => Object.keys(CASES);

test("the heads with a size bound are the heads listed here, and the bound is the number of elements", () => {
  const bounded = POSET_AREA_STATISTICS.filter((d) => d.where !== undefined && !(d.head in LATTICE_CASES))
    .filter((d) => JSON.stringify(d.where).startsWith('["LessEqual"'))
    .map((d) => d.head);
  expect(bounded.toSorted()).toEqual(heads().toSorted());
  for (const [head, { limit }] of Object.entries(CASES))
    expect(index.get(`${head}@Poset`)!.where, head).toEqual(atMostElements(limit));
  for (const head of Object.keys(LATTICE_CASES))
    expect(JSON.stringify(index.get(`${head}@Poset`)!.where), head).toContain(
      JSON.stringify(atMostElements(ELEMENT_LIMIT)),
    );
});

test("the heads that stay as they were have no bound", () => {
  for (const head of [
    "ChainPolytopeFacetCount",
    "LongestMaximalChainCount",
    "ShortestMaximalChainCount",
    "IncomparableTripleCount",
    "PotentialCoverCount",
    "MoebiusFunctionSum",
  ])
    expect(index.get(`${head}@Poset`)!.where, head).toBeUndefined();
});

const call = (head: string, p: Poset) => ce.box([head, carrier(p)] as never);
const stat = (head: string, p: Poset) => ce.box(["CombinatorialStat", carrier(p), `'${head}'`] as never);

for (const [head, c] of Object.entries(CASES))
  test(`${head} at ${sizeOf(c.limit)} elements is ${c.reason}`, () => {
    const n = sizeOf(c.limit);
    const definition = index.get(`${head}@Poset`)!;
    for (const [shape, make] of [
      ["antichain", antichain],
      ["chain", chain],
    ] as const) {
      const value = c[shape](n);
      expect(inDomain(ce, definition, ce.box(contents(make(n)) as never)), `${head} ${shape}`).toBe(true);
      expect(applyDefinition(ce, definition, ce.box(contents(make(n)) as never)).re, `${head} ${shape}`).toBe(value);
      expect(call(head, make(n)).evaluate().re, `${head} ${shape} evaluated`).toBe(value);
      expect(call(head, make(n)).N().re, `${head} ${shape} numerically`).toBe(value);
      expect(stat(head, make(n)).evaluate().re, `${head} ${shape} by CombinatorialStat`).toBe(value);
      expect(Number.isSafeInteger(value), `${head} ${shape} is a safe integer`).toBe(true);
    }
  });

test("a value at the limit is a safe integer, on the antichain and on the chain", () => {
  for (const [head, c] of Object.entries(CASES))
    for (const shape of ["antichain", "chain"] as const)
      expect(Number.isSafeInteger(c[shape](c.limit)), `${head} ${shape}`).toBe(true);
});

/** Run `body` with the compiled code of `head` and of its `where` removed, then put it back. */
const withoutCompiled = (head: string, body: () => void): void => {
  const definition = index.get(`${head}@Poset`)!;
  const keys = [signatureOf(definition), whereSignatureOf(definition)];
  const held = keys.map((key) => COMPILED[key]);
  keys.forEach((key) => delete COMPILED[key]);
  try {
    body();
  } finally {
    keys.forEach((key, k) => {
      if (held[k] !== undefined) COMPILED[key] = held[k]!;
    });
  }
};

/** A call one past the limit is left as it is, and returns promptly. */
const staysPastTheLimit = (head: string, limit: number, make: (n: number) => Poset): void => {
  const check = (label: string, run: () => { operator: string | undefined; json: unknown }): void => {
    const start = performance.now();
    const result = run();
    expect(performance.now() - start, `${head} ${label} returns promptly`).toBeLessThan(3000);
    expect(result.operator, `${head} ${label}`).toBe(
      label.startsWith("CombinatorialStat") ? "CombinatorialStat" : head,
    );
    expect(JSON.stringify(result.json), `${head} ${label}`).toContain("Poset");
  };
  const p = make(limit + 1);
  check("evaluate", () => call(head, p).evaluate());
  check("N", () => call(head, p).N());
  check("CombinatorialStat", () => stat(head, p).evaluate());
  expect(inDomain(ce, index.get(`${head}@Poset`)!, ce.box(contents(p) as never))).toBe(false);
};

for (const [head, c] of Object.entries(CASES))
  test(`${head} stays unevaluated at ${c.limit + 1} elements, compiled code present and absent`, () => {
    for (const make of [antichain, chain]) {
      staysPastTheLimit(head, c.limit, make);
      withoutCompiled(head, () => staysPastTheLimit(head, c.limit, make));
    }
  });

for (const [head, c] of Object.entries(LATTICE_CASES))
  test(`${head} at ${sizeOf(ELEMENT_LIMIT)} elements is the chain's value (${c.reason}); one past the limit the call stays`, () => {
    const n = sizeOf(ELEMENT_LIMIT);
    expect(call(head, chain(n)).evaluate().re).toBe(c.chain(n));
    expect(call(head, chain(n)).N().re).toBe(c.chain(n));
    expect(stat(head, chain(n)).evaluate().re).toBe(c.chain(n));
    for (const make of [chain, diamond]) {
      staysPastTheLimit(head, ELEMENT_LIMIT, make);
      withoutCompiled(head, () => staysPastTheLimit(head, ELEMENT_LIMIT, make));
    }
  });

test("the bottom-meeting subsets of the diamond are 2^(n - 1) plus twice the nondegenerate ones", () => {
  // The note of St001679: the subsets that meet at the bottom are 2^(n - 1) plus twice those holding neither end.
  const n = sizeOf(ELEMENT_LIMIT);
  const bottomMeet = call("BottomMeetSubsetCount", diamond(n)).evaluate().re;
  const nondegenerate = call("NondegenerateBottomMeetSubsetCount", diamond(n)).evaluate().re;
  expect(bottomMeet).toBe(2 ** (n - 1) + 2 * nondegenerate);
});

test("the statistics whose cost does not grow with the subsets answer on 24 elements at once", () => {
  const ladder = (n: number): Poset =>
    Array.from({ length: n }, (_, i) => {
      const level = Math.floor(i / 2);
      return level === 0 ? [] : [2 * level - 1, 2 * level];
    });
  const expected: Record<string, [Poset, number][]> = {
    ChainPolytopeFacetCount: [
      [antichain(24), 48],
      [chain(24), 25],
    ],
    LongestMaximalChainCount: [
      [antichain(24), 24],
      [chain(24), 1],
      [ladder(24), 4096],
    ],
    ShortestMaximalChainCount: [
      [antichain(24), 24],
      [chain(24), 1],
      [ladder(24), 4096],
    ],
  };
  for (const [head, cases] of Object.entries(expected))
    for (const [p, value] of cases) {
      const start = performance.now();
      expect(call(head, p).evaluate().re, head).toBe(value);
      expect(performance.now() - start, `${head} on 24 elements`).toBeLessThan(3000);
    }
});
