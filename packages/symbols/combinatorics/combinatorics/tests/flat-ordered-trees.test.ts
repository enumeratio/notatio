// An ordered tree read flat for compiled code (trees/src/flat-ordered.ts): the Dyck word of the
// root's children. The codec round-trips every small tree and declines what isn't one; the flat
// bodies, compiled, give independent readings' answers on every tree of up to 7 edges.

import { compileTyped } from "@notatio/engine/compiled";
import { bareEngine } from "@notatio/engine/testing";
import { expect, test } from "vite-plus/test";
import { interpretDefinition } from "../src/statistics/declare.ts";
import { SUBJECT, signatureOf } from "../src/statistics/types.ts";
import { TREE_STATISTICS } from "../trees/src/statistics.ts";
import {
  BinaryTreeUnrank,
  DyckPathUnrank,
  OrderedTreeUnrank,
  type BinTree,
} from "../collections/src/families/kernels-extra.ts";
import { FLAT } from "../src/flat.ts";
import { parentArrayOf, treeOfParentArray } from "../trees/src/flat.ts";
import {
  dyckPathOfOrderedFlat,
  dyckWordOf,
  leftBranchBinaryFlat,
  leftBranchOrderedFlat,
  mirrorOrderedFlat,
  ORDERED_TREE_FLAT,
  rightBranchBinaryFlat,
  rightBranchOrderedFlat,
  rotationOrderedFlat,
  treeOfDyckWord,
} from "../trees/src/flat-ordered.ts";

type Plane = readonly Plane[];
const DEEP = process.env.DEEP_TESTS === "1";
const catalan = (n: number): number => (n === 0 ? 1 : ((4 * n - 2) * catalan(n - 1)) / (n + 1));
const ce = bareEngine();

const allPlane = (max: number): Plane[] =>
  Array.from({ length: max + 1 }, (_, n) =>
    Array.from({ length: catalan(n) }, (_, r) => OrderedTreeUnrank(n, r) as Plane),
  ).flat();
const allBinary = (max: number): BinTree[] =>
  Array.from({ length: max + 1 }, (_, n) =>
    Array.from({ length: catalan(n) }, (_, r) => BinaryTreeUnrank(n, r)),
  ).flat();

test("an ordered tree round-trips through its Dyck word, for every tree of up to 7 edges", () => {
  let seen = 0;
  for (let n = 0; n <= 7; n++)
    for (let r = 0; r < catalan(n); r++) {
      const tree = OrderedTreeUnrank(n, r);
      const word = dyckWordOf(tree);
      expect(word, JSON.stringify(tree)).toEqual(DyckPathUnrank(n, r));
      expect(treeOfDyckWord(word), JSON.stringify(tree)).toEqual(tree);
      seen++;
    }
  expect(seen).toBe(1 + 1 + 2 + 5 + 14 + 42 + 132 + 429);
});

test("the codec declines what isn't a tree or a Dyck word", () => {
  for (const notATree of [0, [0], [[], 0], "x", null, 5, [[], "x"]])
    expect(dyckWordOf(notATree), JSON.stringify(notATree)).toBeUndefined();
  expect(treeOfDyckWord([])).toEqual([]);
  for (const notAWord of [[1], [0, 1], [1, 0, 0], [1, 0, 1], [2], [1.5, 0], [-1], 5, "x", null])
    expect(treeOfDyckWord(notAWord), JSON.stringify(notAWord)).toBeUndefined();
});

test("the codec takes a tree as deep or as wide as the stack would not", () => {
  const depth = 50_000;
  let chain: Plane = [];
  for (let i = 0; i < depth; i++) chain = [chain];
  const word = dyckWordOf(chain)!;
  expect(word).toHaveLength(2 * depth);
  expect(word[depth - 1]).toBe(1);
  expect(word[depth]).toBe(0);
  expect(dyckWordOf(treeOfDyckWord(word))).toEqual(word);
  const wide: Plane = Array.from({ length: depth }, () => []);
  const flat = dyckWordOf(wide)!;
  expect(flat).toHaveLength(2 * depth);
  expect(treeOfDyckWord(flat)).toEqual(wide);
});

test("the ordered tree carrier has its flat reading, found by type id", () => {
  expect(FLAT["ordered_tree"]).toBe(ORDERED_TREE_FLAT);
});

// ── independent TypeScript readings of the nested definitions ────────────────────────────

const mirror = (t: Plane): Plane => t.map(mirror).toReversed();
const rotate = (t: Plane): Plane => {
  const branches: (readonly Plane[])[] = [];
  for (let s: Plane = t; s.length > 0; s = s[0]!) branches.push(s.slice(1));
  let r: Plane = [];
  for (const branch of branches) r = [...branch, r];
  return r;
};
/** Sage's to_binary_tree_left_branch. */
const binaryLeft = (t: Plane): BinTree => {
  let tree: BinTree = 0;
  for (const child of t) tree = [tree, binaryLeft(child)];
  return tree;
};
/** Sage's to_binary_tree_right_branch. */
const binaryRight = (t: Plane): BinTree => {
  let tree: BinTree = 0;
  for (const child of t.toReversed()) tree = [binaryRight(child), tree];
  return tree;
};
const orderedLeft = (t: BinTree): Plane => {
  const children: Plane[] = [];
  for (let node = t; node !== 0; node = node[0]) children.unshift(orderedLeft(node[1]));
  return children;
};
const orderedRight = (t: BinTree): Plane => {
  const children: Plane[] = [];
  for (let node = t; node !== 0; node = node[1]) children.push(orderedRight(node[0]));
  return children;
};

const run = (body: unknown, input: "list<integer>") => compileTyped(ce, body as never, { _raw: input })!;
const word = (t: Plane): number[] => dyckWordOf(t)!;

const PLANE_MAPS: [string, unknown, (t: Plane) => Plane][] = [
  ["Mirror", mirrorOrderedFlat, mirror],
  ["Rotation", rotationOrderedFlat, rotate],
];
for (const [name, body, reading] of PLANE_MAPS)
  test(`${name}@ordered_tree: the compiled flat body gives the nested tree's answer`, () => {
    const compiled = run(body, "list<integer>");
    for (const tree of allPlane(7))
      expect(treeOfDyckWord(compiled.run({ _raw: word(tree) })), JSON.stringify(tree)).toEqual(reading(tree));
  });

test("DyckPath@ordered_tree: the word itself", () => {
  const compiled = run(dyckPathOfOrderedFlat, "list<integer>");
  for (const tree of allPlane(5)) expect(compiled.run({ _raw: word(tree) })).toEqual(word(tree));
});

test("BinaryTree@ordered_tree and RightBranchBinaryTree@ordered_tree: the compiled flat bodies", () => {
  const left = run(leftBranchBinaryFlat, "list<integer>");
  const right = run(rightBranchBinaryFlat, "list<integer>");
  for (const tree of allPlane(7)) {
    expect(treeOfParentArray(left.run({ _raw: word(tree) })), JSON.stringify(tree)).toEqual(binaryLeft(tree));
    expect(treeOfParentArray(right.run({ _raw: word(tree) })), JSON.stringify(tree)).toEqual(binaryRight(tree));
  }
});

test("OrderedTree@binary_tree and RightBranchOrderedTree@binary_tree: the compiled flat bodies", () => {
  const left = run(leftBranchOrderedFlat, "list<integer>");
  const right = run(rightBranchOrderedFlat, "list<integer>");
  for (const tree of allBinary(7)) {
    const array = parentArrayOf(tree);
    expect(treeOfDyckWord(left.run({ _raw: array })), JSON.stringify(tree)).toEqual(orderedLeft(tree));
    expect(treeOfDyckWord(right.run({ _raw: array })), JSON.stringify(tree)).toEqual(orderedRight(tree));
  }
});

test("the laws: each branch bijection is inverted by its partner, and Mirror is an involution", () => {
  const binaryLeftFlat = run(leftBranchBinaryFlat, "list<integer>");
  const orderedLeftFlat = run(leftBranchOrderedFlat, "list<integer>");
  const binaryRightFlat = run(rightBranchBinaryFlat, "list<integer>");
  const orderedRightFlat = run(rightBranchOrderedFlat, "list<integer>");
  const mirrored = run(mirrorOrderedFlat, "list<integer>");
  for (const tree of allPlane(7)) {
    const w = word(tree);
    expect(orderedLeftFlat.run({ _raw: binaryLeftFlat.run({ _raw: w }) }), JSON.stringify(tree)).toEqual(w);
    expect(orderedRightFlat.run({ _raw: binaryRightFlat.run({ _raw: w }) }), JSON.stringify(tree)).toEqual(w);
    expect(mirrored.run({ _raw: mirrored.run({ _raw: w }) }), JSON.stringify(tree)).toEqual(w);
  }
});

// The quadratic bodies: a deep chain and a bushy tree of a few hundred edges, to bound their cost.
const edges = DEEP ? 4000 : 300;
test(`Rotation and BinaryTree@ordered_tree at ${edges} edges`, () => {
  const rotation = run(rotationOrderedFlat, "list<integer>");
  const binary = run(leftBranchBinaryFlat, "list<integer>");
  const bushy: Plane = Array.from({ length: Math.floor(edges / 3) }, () => [[], []]);
  const w = word(bushy);
  expect(w).toHaveLength(6 * Math.floor(edges / 3));
  const timed = (body: typeof rotation): [unknown, number] => {
    const start = performance.now();
    const out = body.run({ _raw: w });
    return [out, performance.now() - start];
  };
  const [rotated, rotationMs] = timed(rotation);
  const [parents, binaryMs] = timed(binary);
  console.log(`edges=${edges} rotation=${rotationMs.toFixed(0)}ms binary=${binaryMs.toFixed(0)}ms`);
  expect(treeOfDyckWord(rotated)).toEqual(rotate(bushy));
  expect(treeOfParentArray(parents)).toEqual(binaryLeft(bushy));
});

// ── statistics: the compiled flat body against the nested definition ─────────────────────

const FLAT_STATISTIC_HEADS = [
  "Height",
  "LongestPathVertexCount",
  "Leaves",
  "NonRootInternalNodes",
  "PathLength",
  "BoundaryLength",
  "ProtectionNumber",
  "TrunkLength",
  "BoundaryLengthBeyondTrunk",
];

/** The nested tree as MathJSON: a vertex is the list of its children. */
const listOf = (t: Plane): unknown => ["List", ...t.map(listOf)];

// The interpreter takes about 60 ms a tree: the standard run holds the trees of up to 4 edges, the nightly all of 7.
const statisticEdges = DEEP ? 7 : 4;

for (const head of FLAT_STATISTIC_HEADS)
  test(`${head}@OrderedTree: the compiled flat body gives the nested definition's answer`, () => {
    const definition = TREE_STATISTICS.find((d) => signatureOf(d) === `${head}@OrderedTree`)!;
    expect(definition.flat, head).toBeDefined();
    const compiled = compileTyped(ce, definition.flat as never, { [SUBJECT]: "list<integer>" })!;
    for (const tree of allPlane(statisticEdges))
      expect(compiled.run({ [SUBJECT]: word(tree) }), JSON.stringify(tree)).toBe(
        interpretDefinition(ce, definition, ce.box(listOf(tree) as never)).json,
      );
  });
