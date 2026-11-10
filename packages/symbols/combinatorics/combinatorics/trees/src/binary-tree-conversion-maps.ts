// Maps from binary trees (Mp00008, Mp00014, Mp00017, Mp00141).

import type { CombinatorialMap } from "../../src/map-helpers.ts";
import { isLeaf, recurse, self } from "../../src/recursion.ts";
import { avoiding132Flat, avoiding312Flat, completeTreeFlat } from "./flat-postorder.ts";

type MathJSON = unknown;

const left = (tree: MathJSON): MathJSON => ["At", tree, 1];
const right = (tree: MathJSON): MathJSON => ["At", tree, 2];

/** How many nodes a tree has: its leaves, which `Flatten` counts at once, are one more. */
const nodeCount = (tree: MathJSON): MathJSON => ["Subtract", ["Length", ["Flatten", ["List", tree]]], 1];

/** Mp00008: every leaf becomes a vertex, so a node [L, R] is the tree whose two children are L's and R's. */
const completeTreeBody: MathJSON = recurse(
  ["If", isLeaf("t"), ["List"], ["List", self(left("t")), self(right("t"))]],
  ["t"],
  "_raw",
);

/** The nodes of `t`, numbered in order from `offset` + 1, listed in postorder: the subtrees in the order `first`
 *  and `second` name ("left" or "right"), then the root, whose number is `offset` + |left| + 1. */
const postorderBody = (first: "left" | "right"): MathJSON => {
  const rootNumber = ["Add", "o", nodeCount(left("t")), 1];
  const part = (side: "left" | "right"): MathJSON =>
    side === "left" ? self(left("t"), "o") : self(right("t"), rootNumber);
  const second = first === "left" ? "right" : "left";
  return recurse(
    ["If", isLeaf("t"), ["List"], ["Join", part(first), part(second), ["List", rootNumber]]],
    ["t", "o"],
    "_raw",
    0,
  );
};

export const BINARY_TREE_CONVERSION_MAPS: readonly CombinatorialMap[] = [
  {
    name: "CompleteOrderedTree",
    from: "binary_tree",
    to: "ordered_tree",
    body: completeTreeBody,
    flat: completeTreeFlat,
    summary:
      "A binary tree as its complete tree: every missing child becomes a vertex, and a node's two children are its left and right subtrees.",
    note: "FindStat's Mp00008, Sage's as_ordered_tree. An injection from the binary trees with n nodes to the ordered trees with 2n edges, whose image is the full binary trees; OrderedTree(BinaryTree) is the different bijection Mp00010.",
    findstat: ["Mp00008"],
  },
  {
    name: "Avoiding132Permutation",
    from: "binary_tree",
    to: "permutation",
    body: postorderBody("right"),
    flat: avoiding132Flat,
    summary:
      "The 132-avoiding permutation of a binary tree: its nodes numbered in order, read in postorder with the right subtree before the left.",
    note: "FindStat's Mp00014, Sage's to_132_avoiding_permutation. An injection onto the 132-avoiding permutations.",
  },
  {
    name: "Avoiding312Permutation",
    from: "binary_tree",
    to: "permutation",
    body: postorderBody("left"),
    flat: avoiding312Flat,
    summary: "The 312-avoiding permutation of a binary tree: its nodes numbered in order, read in postorder.",
    note: "FindStat's Mp00017, Sage's to_312_avoiding_permutation. An injection onto the 312-avoiding permutations.",
  },
];
