import { bareEngine } from "@enumeratio/engine/testing";
import { expect, test } from "vite-plus/test";
import { declareCombinatorics } from "../../src/index.ts";
import { applyDefinition } from "../../src/statistics/declare.ts";
import { bySignature } from "../../src/statistics/types.ts";
import { TREE_STATISTICS } from "../src/statistics.ts";
import { BINARY_READINGS, type Binary, ORDERED_READINGS, type Ordered } from "./tree-findstat-readings.ts";

// The whole library, as a page evaluates: a recursion that works on a bare engine can still not on this one.
const ce = bareEngine();
declareCombinatorics(ce);
const index = bySignature(TREE_STATISTICS);

/** Every binary tree with n nodes. */
function binaryTrees(n: number): Binary[] {
  if (n === 0) return [0];
  return Array.from({ length: n }, (_, k) => k).flatMap((k) =>
    binaryTrees(k).flatMap((l) => binaryTrees(n - 1 - k).map((r): Binary => [l, r])),
  );
}
/** Every ordered tree with n edges: a first child with k edges, then the remaining children. */
function orderedTrees(n: number): Ordered[] {
  if (n === 0) return [[]];
  return Array.from({ length: n }, (_, k) => k).flatMap((k) =>
    orderedTrees(k).flatMap((first) => orderedTrees(n - 1 - k).map((rest): Ordered => [first, ...rest])),
  );
}

const binaryJson = (t: Binary): unknown => (t === 0 ? 0 : ["List", binaryJson(t[0]), binaryJson(t[1])]);
const orderedJson = (t: Ordered): unknown => ["List", ...t.map(orderedJson)];

const evaluate = (head: string, on: string, json: unknown): number =>
  applyDefinition(ce, index.get(`${head}@${on}`)!, ce.box(json as never)).re;

test("every tree definition has an independent reading", () => {
  for (const { head, on } of TREE_STATISTICS)
    expect((on === "BinaryTree" ? BINARY_READINGS : ORDERED_READINGS)[head], `${head}@${on}`).toBeDefined();
  expect(Object.keys(BINARY_READINGS).length + Object.keys(ORDERED_READINGS).length).toBe(TREE_STATISTICS.length);
});

const upTo = <T>(trees: (n: number) => T[], n: number): T[] =>
  Array.from({ length: n + 1 }, (_, k) => k).flatMap((k) => trees(k));

const BINARY = upTo(binaryTrees, 5);
// The swap-equivalence heads test every pair of subtrees in the interpreter, so their standard case stops at four nodes.
const SWAP_HEADS = new Set(["SwapEquivalentTreeCount", "SwapEquivalentTreeCountLog"]);
const BINARY_SMALL = upTo(binaryTrees, 4);
const ORDERED = upTo(orderedTrees, 5);

for (const [head, expected] of Object.entries(BINARY_READINGS)) {
  const swap = SWAP_HEADS.has(head);
  test(`${head} agrees over every binary tree of 0..${swap ? 4 : 5} nodes`, () => {
    for (const t of swap ? BINARY_SMALL : BINARY)
      expect(evaluate(head, "BinaryTree", binaryJson(t)), JSON.stringify(t)).toBe(expected(t));
  });
}
for (const [head, expected] of Object.entries(ORDERED_READINGS)) {
  test(`${head} agrees over every ordered tree of 0..5 edges`, () => {
    for (const t of ORDERED) expect(evaluate(head, "OrderedTree", orderedJson(t)), JSON.stringify(t)).toBe(expected(t));
  });
}

test("each head called on the carrier value gives the reading", () => {
  for (const [head, expected] of Object.entries(BINARY_READINGS))
    for (const t of upTo(binaryTrees, 3))
      expect(ce.box([head, ["BinaryTree", binaryJson(t)]] as never).evaluate().re, `${head} ${JSON.stringify(t)}`).toBe(
        expected(t),
      );
  for (const [head, expected] of Object.entries(ORDERED_READINGS))
    for (const t of upTo(orderedTrees, 3))
      expect(
        ce.box([head, ["OrderedTree", orderedJson(t)]] as never).evaluate().re,
        `${head} ${JSON.stringify(t)}`,
      ).toBe(expected(t));
});

/** The trees the deep sweep interprets across all heads, about 40 ms each here (the swap and automorphism
 *  heads 100 to 150): a head takes its share, so the sweep's time stays put as heads are added. */
const DEEP_EVALUATIONS = 30_000;
const PER_HEAD = Math.floor(DEEP_EVALUATIONS / TREE_STATISTICS.length);

/** At most `k` of the trees, spread evenly through them with the last taken. */
const spread = <T>(trees: T[], k: number): T[] =>
  k >= trees.length ? trees : Array.from({ length: k }, (_, i) => trees[Math.ceil(((i + 1) * trees.length) / k) - 1]!);

/** A head's trees of each size, the smaller sizes whole when the budget allows: every size is represented. */
const sweep = <T>(sizes: number[], trees: (n: number) => T[]): T[] =>
  sizes.flatMap((n) => spread(trees(n), Math.floor(PER_HEAD / sizes.length)));

// Larger trees run nightly (DEEP_TESTS=1), each head over its share of them (evenly through each size).
test.skipIf(!process.env.DEEP_TESTS)(
  "every tree definition agrees over the binary trees of 6..8 nodes and the ordered trees of 6..7 edges",
  () => {
    for (const t of sweep([6, 7, 8], binaryTrees))
      for (const [head, expected] of Object.entries(BINARY_READINGS))
        if (!(SWAP_HEADS.has(head) && JSON.stringify(t).split("[").length > 8))
          expect(evaluate(head, "BinaryTree", binaryJson(t)), `${head} ${JSON.stringify(t)}`).toBe(expected(t));
    // The automorphism heads compare every pair of children and cost the most; seven edges is theirs to skip.
    const slow = new Set(["AutomorphismGroupSize", "InequivalentIncreasingTreeCount"]);
    for (const t of sweep([6, 7], orderedTrees))
      for (const [head, expected] of Object.entries(ORDERED_READINGS))
        if (!(slow.has(head) && JSON.stringify(t).split("[").length > 8))
          expect(evaluate(head, "OrderedTree", orderedJson(t)), `${head} ${JSON.stringify(t)}`).toBe(expected(t));
  },
  3_000_000,
);
