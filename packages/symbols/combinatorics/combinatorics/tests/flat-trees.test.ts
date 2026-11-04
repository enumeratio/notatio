// A binary tree read flat for compiled code (trees/src/flat.ts): the in-order parent array. The
// codec round-trips every small tree and declines what isn't one; a chain of maps keeps the
// flat reading between its steps and converts only at its ends.

import { compileTyped } from "@enumeratio/engine/compiled";
import { bareEngine } from "@enumeratio/engine/testing";
import { expect, test, vi } from "vite-plus/test";
import { BinaryTreeUnrank, type BinTree } from "../collections/src/families/kernels-extra.ts";
import { evaluateTable } from "../scripts/compile-maps.ts";
import { FLAT } from "../src/flat.ts";
import {
  BINARY_TREE_FLAT,
  binaryNodesFlat,
  heightFlat,
  leavesFlat,
  leftRotationFlat,
  mirrorFlat,
  parentArrayOf,
  rightChildCountFlat,
  rightRotationFlat,
  treeOfParentArray,
  unaryNodesFlat,
} from "../trees/src/flat.ts";
import { BinaryTreeParentArray } from "./readings/kernels/collections-kernels-extra.ts";

const catalan = (n: number): number => (n === 0 ? 1 : ((4 * n - 2) * catalan(n - 1)) / (n + 1));

test("a binary tree round-trips through its parent array, for every tree of up to 7 nodes", () => {
  let seen = 0;
  for (let n = 0; n <= 7; n++)
    for (let r = 0; r < catalan(n); r++) {
      const tree = BinaryTreeUnrank(n, r);
      const flat = parentArrayOf(tree);
      // The independent reading of the same array (the collections' own kernel).
      expect(flat, JSON.stringify(tree)).toEqual(BinaryTreeParentArray(tree));
      expect(treeOfParentArray(flat), JSON.stringify(tree)).toEqual(tree);
      seen++;
    }
  expect(seen).toBe(1 + 1 + 2 + 5 + 14 + 42 + 132 + 429);
});

test("the codec declines what isn't a tree or a parent array", () => {
  for (const notATree of [[0], [0, 0, 0], 5, "x", [[0, 0], "x"], null, [[0, 0], [0]]])
    expect(parentArrayOf(notATree)).toBeUndefined();
  expect(treeOfParentArray([])).toBe(0);
  for (const notAnArray of [
    [2, 1], // a cycle
    [0, 0], // two roots
    [2, 0, 1], // labels out of order
    [3, 3, 0], // two left children
    [0, 1, 1], // two right children
    [1], // a node its own parent
    [4, 0], // out of range
    [-1, 0],
    [1.5, 0],
    5,
    "x",
  ])
    expect(treeOfParentArray(notAnArray), JSON.stringify(notAnArray)).toBeUndefined();
});

test("the codec takes a tree as deep as the stack would not", () => {
  const depth = 50_000;
  let tree: BinTree = 0;
  for (let i = 0; i < depth; i++) tree = [0, tree];
  const flat = parentArrayOf(tree)!;
  expect(flat).toHaveLength(depth);
  expect(flat[0]).toBe(0);
  expect(flat[depth - 1]).toBe(depth - 1);
  expect(parentArrayOf(treeOfParentArray(flat))).toEqual(flat);
});

test("carriers with a flat reading are found by type id", () => {
  expect(FLAT["binary_tree"]).toBe(BINARY_TREE_FLAT);
});

// The flat bodies, compiled, against independent readings of the nested trees: every tree of up to 7
// nodes. (The build holds them to the interpreter's own definitions on its samples.)
const ce = bareEngine();
const swap = (t: BinTree): BinTree => (t === 0 ? 0 : [swap(t[1]), swap(t[0])]);
// FindStat's Mp00009 and Mp00019: with no child to pull up, the children swap.
const leftRotation = (t: BinTree): BinTree => (t === 0 ? 0 : t[1] === 0 ? [0, t[0]] : [[t[0], t[1][0]], t[1][1]]);
const rightRotation = (t: BinTree): BinTree => (t === 0 ? 0 : t[0] === 0 ? [t[1], 0] : [t[0][0], [t[0][1], t[1]]]);
const nodes = (t: BinTree): BinTree[] => (t === 0 ? [] : [t, ...nodes(t[0]), ...nodes(t[1])]);
const height = (t: BinTree): number => (t === 0 ? 0 : 1 + Math.max(height(t[0]), height(t[1])));
const childCount = (t: BinTree): number => (t === 0 ? 0 : (t[0] === 0 ? 0 : 1) + (t[1] === 0 ? 0 : 1));
const countNodes = (t: BinTree, test: (node: Exclude<BinTree, 0>) => boolean): number =>
  nodes(t).filter((node) => test(node as Exclude<BinTree, 0>)).length;

const MAPS_FLAT: [string, unknown, (t: BinTree) => BinTree][] = [
  ["Mirror", mirrorFlat, swap],
  ["LeftRotation", leftRotationFlat, leftRotation],
  ["RightRotation", rightRotationFlat, rightRotation],
];
const STATISTICS_FLAT: [string, unknown, (t: BinTree) => number][] = [
  ["Height", heightFlat, height],
  ["Leaves", leavesFlat, (t) => countNodes(t, (n) => childCount(n) === 0)],
  ["UnaryNodes", unaryNodesFlat, (t) => countNodes(t, (n) => childCount(n) === 1)],
  ["BinaryNodes", binaryNodesFlat, (t) => countNodes(t, (n) => childCount(n) === 2)],
  ["RightChildCount", rightChildCountFlat, (t) => countNodes(t, (n) => n[1] !== 0)],
];
const allTrees = (max: number): BinTree[] =>
  Array.from({ length: max + 1 }, (_, n) =>
    Array.from({ length: catalan(n) }, (_, r) => BinaryTreeUnrank(n, r)),
  ).flat();

for (const [name, body, reading] of MAPS_FLAT)
  test(`${name}: the compiled flat body gives the nested tree's answer`, () => {
    const run = compileTyped(ce, body as never, { _raw: "list<integer>" })!;
    for (const tree of allTrees(7))
      expect(treeOfParentArray(run.run({ _raw: parentArrayOf(tree) })), JSON.stringify(tree)).toEqual(reading(tree));
  });

for (const [name, body, reading] of STATISTICS_FLAT)
  test(`${name}: the compiled flat expression gives the nested tree's answer`, () => {
    const run = compileTyped(ce, body as never, { _x: "list<integer>" })!;
    for (const tree of allTrees(7))
      expect(run.run({ _x: parentArrayOf(tree) }), JSON.stringify(tree)).toBe(reading(tree));
  });

// The quadratic passes on a long path (about 1 ms at 100 nodes, 50 ms at 2000 on the build box): the standard
// run takes a short one, the nightly (DEEP_TESTS=1) a long one.
test("Height and Leaves of a path", () => {
  const n = process.env.DEEP_TESTS === "1" ? 4000 : 300;
  const path = Array.from({ length: n }, (_, i) => (i + 1 === n ? 0 : i + 2));
  for (const [body, expected] of [
    [heightFlat, n],
    [leavesFlat, 1],
  ] as const) {
    const run = compileTyped(ce, body as never, { _x: "list<integer>" })!;
    expect(run.run({ _x: path })).toBe(expected);
  }
});

// The flat steps A and B read and answer in the tree's flat reading; N reads and answers nested.
const chain = (...steps: string[]) =>
  evaluateTable([
    { key: "A@binary_tree", hash: "", body: "_._raw.map((x) => x)", flatIn: "binary_tree", flatOut: "binary_tree" },
    {
      key: "B@binary_tree",
      hash: "",
      body: "_._raw.toReversed().toReversed()",
      flatIn: "binary_tree",
      flatOut: "binary_tree",
    },
    { key: "N@binary_tree", hash: "", body: "_._raw" },
    { key: "Chain@binary_tree", hash: "", steps },
  ])["Chain@binary_tree"]!.run(null, { _raw: [[0, 0], 0] });

test("a chain of flat steps converts once in and once out, not between its steps", () => {
  const encode = vi.spyOn(BINARY_TREE_FLAT, "encode");
  const decode = vi.spyOn(BINARY_TREE_FLAT, "decode");
  try {
    expect(chain("A@binary_tree", "B@binary_tree", "A@binary_tree")).toEqual([[0, 0], 0]);
    expect([encode.mock.calls.length, decode.mock.calls.length]).toEqual([1, 1]);
    // A nested step in the middle takes the tree nested, so the flat reading is left and entered again.
    encode.mockClear();
    decode.mockClear();
    expect(chain("A@binary_tree", "N@binary_tree", "B@binary_tree")).toEqual([[0, 0], 0]);
    expect([encode.mock.calls.length, decode.mock.calls.length]).toEqual([2, 2]);
    // Nothing flat, nothing converted.
    encode.mockClear();
    decode.mockClear();
    expect(chain("N@binary_tree", "N@binary_tree")).toEqual([[0, 0], 0]);
    expect([encode.mock.calls.length, decode.mock.calls.length]).toEqual([0, 0]);
  } finally {
    encode.mockRestore();
    decode.mockRestore();
  }
});
