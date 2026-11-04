// A binary tree read flat, for compiled code: its in-order parent array (`BinaryTreeParentArray`:
// the nodes numbered in order, entry k the number of the k-th node's parent, 0 at the root), a
// list of integers where the nested tree (leaf 0, node [left, right]) is lists within lists
// that compiled code declines. The nested tree stays the meaning (binary-tree.ts, statistics.ts);
// the `flat` bodies here are its compiled alternative, held to it by the build's `agrees` checks.
//
// The codec is the TypeScript reading of binary-tree.ts's Epsil conversions, iterative so a deep
// tree costs no stack. Both directions decline (`undefined`) a value that isn't one.
//
// Every body reads the array `P` (`_raw` for a map, `_x` for a statistic) as a valid parent
// array: the codec's `encode` only makes those. Quadratic passes (`Height`, the child counts) are
// folds and filters over the positions.

import type { FlatCodec } from "@enumeratio/structures";
import { add, at, equal, fold, iff, less, map, sub, upTo } from "../../collections/src/families/tables.ts";

type MathJSON = unknown;
type Tree = 0 | readonly [Tree, Tree];

/** The in-order parent array of a nested binary tree; `undefined` for a value that isn't one. */
export function parentArrayOf(tree: unknown): number[] | undefined {
  // Preorder ids, each node's parent id and its two children's ids (-1 for none).
  const parent: number[] = [];
  const kids: [number, number][] = [];
  const pending: [unknown, number, 0 | 1][] = [[tree, -1, 0]];
  for (let item = pending.pop(); item !== undefined; item = pending.pop()) {
    const [node, from, side] = item;
    if (node === 0) continue;
    if (!Array.isArray(node) || node.length !== 2) return undefined;
    const id = parent.length;
    parent.push(from);
    kids.push([-1, -1]);
    if (from >= 0) kids[from]![side] = id;
    pending.push([node[1], id, 1], [node[0], id, 0]);
  }
  // In-order ranks, by an explicit stack down the left spines.
  const rank = new Array<number>(parent.length);
  const stack: number[] = [];
  let next = 0;
  for (let id = parent.length > 0 ? 0 : -1; id >= 0 || stack.length > 0;) {
    if (id >= 0) {
      stack.push(id);
      id = kids[id]![0];
    } else {
      const done = stack.pop()!;
      rank[done] = next++;
      id = kids[done]![1];
    }
  }
  const out = new Array<number>(parent.length);
  for (let id = 0; id < parent.length; id++) out[rank[id]!] = parent[id]! < 0 ? 0 : rank[parent[id]!]! + 1;
  return out;
}

/** The nested binary tree an in-order parent array describes; `undefined` for an array that isn't
 *  one: two roots, two children on a side, a cycle, or nodes out of order. */
export function treeOfParentArray(array: unknown): Tree | undefined {
  if (!Array.isArray(array)) return undefined;
  const n = array.length;
  const nodes: [Tree, Tree][] = Array.from({ length: n + 1 }, () => [0, 0]);
  // Each node's children by number, 0 for none.
  const kids: [number, number][] = Array.from({ length: n + 1 }, () => [0, 0]);
  let root = 0;
  for (let k = 1; k <= n; k++) {
    const p: unknown = array[k - 1];
    if (typeof p !== "number" || !Number.isInteger(p) || p < 0 || p > n || p === k) return undefined;
    if (p === 0) {
      if (root !== 0) return undefined;
      root = k;
      continue;
    }
    const side = k < p ? 0 : 1;
    if (kids[p]![side] !== 0) return undefined;
    kids[p]![side] = k;
    nodes[p]![side] = nodes[k]!;
  }
  if (n === 0) return 0;
  if (root === 0) return undefined;
  // Walked in order from the root, every node comes up once and as the next number.
  const stack: number[] = [];
  let seen = 0;
  for (let node = root; node !== 0 || stack.length > 0;) {
    if (node !== 0) {
      stack.push(node);
      node = kids[node]![0];
    } else {
      const done = stack.pop()!;
      if (done !== ++seen) return undefined;
      node = kids[done]![1];
    }
  }
  return seen === n ? nodes[root]! : undefined;
}

export const BINARY_TREE_FLAT: FlatCodec = {
  shape: "list<integer>",
  encode: parentArrayOf,
  decode: treeOfParentArray,
};

// ── flat bodies ──────────────────────────────────────────────────────────────────────────

const length = (p: MathJSON): MathJSON => ["Length", p];
const positions = (p: MathJSON): MathJSON => upTo(1, length(p));
const greater = (a: MathJSON, b: MathJSON): MathJSON => ["Greater", a, b];
const and = (...xs: MathJSON[]): MathJSON => ["And", ...xs];

/** The number of the node whose parent is 0, or 0 for the empty array. */
const rootOf = (p: MathJSON): MathJSON => fold(iff(equal(at(p, "rk"), 0), "rk", "racc"), "racc", "rk", 0, positions(p));

/** The child of node `v` on one side: the entry numbered below `v` (left) or above it (right) naming `v` as its parent, or 0. */
const childOf = (p: MathJSON, v: MathJSON, side: "left" | "right", tag: string): MathJSON =>
  fold(
    iff(
      and(equal(at(p, `${tag}k`), v), side === "left" ? less(`${tag}k`, v) : greater(`${tag}k`, v)),
      `${tag}k`,
      `${tag}a`,
    ),
    `${tag}a`,
    `${tag}k`,
    0,
    positions(p),
  );

/** `body` with `name` bound to the integer `value`. */
export const given = (name: string, value: MathJSON, body: MathJSON): MathJSON => [
  "Apply",
  ["Function", body, name],
  value,
];

/** Mp00016: node k goes to n + 1 - k, so each entry is the mirrored entry of the mirrored position. */
export const mirrorFlat: MathJSON = map(
  given("mp", at("_raw", sub(add(length("_raw"), 1), "mi")), iff(equal("mp", 0), 0, sub(add(length("_raw"), 1), "mp"))),
  "mi",
  positions("_raw"),
);

/** Mp00009: the right child y of the root r becomes the root and r its left child, which takes y's
 *  left child b as its right; the in-order numbering is unchanged. With no right child the root's
 *  left subtree moves to the right, as [., A]: the root is node n and goes first, the rest one later. */
export const leftRotationFlat: MathJSON = given(
  "lr",
  rootOf("_raw"),
  given(
    "ly",
    childOf("_raw", "lr", "right", "ly"),
    iff(
      equal("ly", 0),
      map(
        iff(
          equal("li", 1),
          0,
          iff(equal(at("_raw", sub("li", 1)), length("_raw")), 1, add(at("_raw", sub("li", 1)), 1)),
        ),
        "li",
        positions("_raw"),
      ),
      given(
        "lb",
        childOf("_raw", "ly", "left", "lb"),
        map(
          iff(equal("li", "lr"), "ly", iff(equal("li", "ly"), 0, iff(equal("li", "lb"), "lr", at("_raw", "li")))),
          "li",
          positions("_raw"),
        ),
      ),
    ),
  ),
);

/** Mp00019: the left child y of the root r becomes the root and r its right child, which takes y's
 *  right child b as its left. With no left child the root's right subtree moves to the left, as
 *  [A, .]: the root is node 1 and goes last, the rest one earlier. */
export const rightRotationFlat: MathJSON = given(
  "rr",
  rootOf("_raw"),
  given(
    "ry",
    childOf("_raw", "rr", "left", "ry"),
    iff(
      equal("ry", 0),
      map(
        iff(
          equal("ri", length("_raw")),
          0,
          iff(equal(at("_raw", add("ri", 1)), 1), length("_raw"), sub(at("_raw", add("ri", 1)), 1)),
        ),
        "ri",
        positions("_raw"),
      ),
      given(
        "rb",
        childOf("_raw", "ry", "right", "rb"),
        map(
          iff(equal("ri", "rr"), "ry", iff(equal("ri", "ry"), 0, iff(equal("ri", "rb"), "rr", at("_raw", "ri")))),
          "ri",
          positions("_raw"),
        ),
      ),
    ),
  ),
);

/** How many nodes name node `v` as their parent. */
const childCount = (p: MathJSON, v: MathJSON): MathJSON => [
  "Count",
  ["Filter", positions(p), ["Function", equal(at(p, "ck"), v), "ck"]],
];

/** The number of nodes with exactly `count` children. */
const withChildren = (count: number): MathJSON => [
  "Count",
  ["Filter", positions("_x"), ["Function", equal(childCount("_x", "cv"), count), "cv"]],
];

export const leavesFlat: MathJSON = withChildren(0);
export const unaryNodesFlat: MathJSON = withChildren(1);
export const binaryNodesFlat: MathJSON = withChildren(2);

/** A node is a right child when its parent is numbered below it. */
export const rightChildCountFlat: MathJSON = [
  "Count",
  ["Filter", positions("_x"), ["Function", and(less(0, at("_x", "hk")), less(at("_x", "hk"), "hk")), "hk"]],
];

/** The most nodes on a path from the root: the largest count of a node and its ancestors, each
 *  found by following parents (at most n steps; the state is [current node, nodes counted]). */
export const heightFlat: MathJSON = fold(
  [
    "Max",
    "hacc",
    at(
      fold(
        iff(equal(at("hs", 1), 0), "hs", ["List", at("_x", at("hs", 1)), add(at("hs", 2), 1)]),
        "hs",
        "hj",
        ["List", "hk", 0],
        positions("_x"),
        "list<integer>",
      ),
      2,
    ),
  ],
  "hacc",
  "hk",
  0,
  positions("_x"),
);
