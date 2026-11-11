// Permutations to increasing binary trees (Mp00061).

import { bind, forEach, positions, type CombinatorialMap, type MathJSON } from "../../src/map-helpers.ts";

/** The nearest position to `p` on one side whose entry is smaller than σ(p), or 0. `over` runs toward `p` from that
 *  side's far end, so the last match is the nearest. */
const nearestSmaller = (over: MathJSON, side: "Less" | "Greater"): MathJSON => [
  "Fold",
  [
    "Function",
    ["If", ["And", [side, "q", "p"], ["Less", ["At", "_raw", "q"], ["At", "_raw", "p"]]], "q", "it_near"],
    "it_near",
    "q",
  ],
  0,
  over,
];

/** The increasing tree's in-order parent array: position p hangs under the larger of the nearest smaller entries on
 *  either side, the root (the 1) under 0. */
const increasingParents: MathJSON = forEach(
  positions,
  bind(
    "it_before",
    nearestSmaller(["Range", 1, ["Length", "_raw"], 1], "Less"),
    bind("it_after", nearestSmaller(["Range", ["Length", "_raw"], 1, -1], "Greater"), [
      "If",
      ["Equal", "it_before", 0],
      "it_after",
      [
        "If",
        ["Equal", "it_after", 0],
        "it_before",
        ["If", ["Greater", ["At", "_raw", "it_before"], ["At", "_raw", "it_after"]], "it_before", "it_after"],
      ],
    ]),
  ),
  "p",
);

export const INCREASING_TREE_MAPS: readonly CombinatorialMap[] = [
  {
    name: "BinaryTreeParentArray",
    convert: true,
    from: "permutation",
    to: "binary_tree_parent_array",
    body: increasingParents,
    summary:
      "The increasing binary tree of σ as its parent array: entry p is the position the entry at p hangs under, 0 for the root.",
    note: "Positions are the tree's in-order labels: the smallest entry roots the tree, and what lies before it and after it become its subtrees. The parent of p is the larger of the nearest smaller entries on its two sides.",
  },
  {
    name: "IncreasingTree",
    from: "permutation",
    to: "binary_tree",
    composedOf: ["BinaryTree", "BinaryTreeParentArray"],
    summary:
      "The shape of the increasing binary tree of a permutation: the smallest entry is the root, the entries before it make its left subtree and the entries after it its right.",
    note: "FindStat's Mp00061, Sage's increasing_tree_shape. A surjection: a tree is the shape of as many permutations as it has linear extensions.",
    findstat: ["Mp00061"],
  },
];
