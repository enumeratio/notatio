// Increasing binary tree from a permutation, by minimum-splitting — the
// FromPermutation map (permutation -> increasing_binary_tree). This is the CARTESIAN TREE on
// the permutation's values, min-heap ordered: the position of the smallest value
// in the current range becomes the node, everything before it is the LEFT subtree (the
// same split), everything after it the RIGHT. Every permutation of [n] holds the value 1, so
// the root is always labelled 1 — heap order puts the global minimum at the top regardless of
// which permutation it came from.
//
// REPRESENTATION. `increasing_binary_tree`'s declared shape (carrier-data.ts) is
// `integer | list<any>` — BinaryTree/FullKAryTree/OrderedTree's own nested convention, label
// folded in as the node's first slot: leaf 0, node [label, left, right]. This is what
// IncreasingBinaryTrees (collections/src/families/tableaux-trees.ts, its `cartesianTree`)
// already builds, so FromPermutation has to build the same shape rather than the flat
// by-value parent-array tuple this file built before (A-116).
//
// THE NEAREST-SMALLER-VALUE CHARACTERISATION. The rule from flat.ts: iterate over a RANGE
// and index, never fold or filter over a list carved out of the accumulator. The recursive
// min-splitting has a direct, non-recursive characterisation — position i's parent is whichever
// of its nearest smaller neighbour to the LEFT (L) and to the RIGHT (R) exists and is the
// tighter bound — the one with the LARGER value, when both exist (permutation values are
// distinct, so there is never a tie). `i` is L's RIGHT child (i lies to L's right) or R's LEFT
// child (i lies to R's left). That is what makes `childPositionOnSide` below a plain fold rather
// than a search; the tree itself is then assembled from the largest value down, each node
// reading its children's finished cells, so nothing recurses and the definition compiles.

import { bind, type MathJSON } from "../../src/map-helpers.ts";

const at = (list: MathJSON, index: MathJSON): MathJSON => ["At", list, index];
const count = (list: MathJSON): MathJSON => ["Count", list];

const overRange = (n: MathJSON, initial: MathJSON, step: MathJSON, accumulator: string, variable: string): MathJSON => [
  "Fold",
  ["Function", step, accumulator, variable],
  initial,
  ["Range", 1, n, 1],
];

const WORD: MathJSON = "_raw";
const SIZE: MathJSON = count(WORD);
const val = (i: MathJSON): MathJSON => at(WORD, i);
const posOf = (v: MathJSON): MathJSON => ["IndexOf", WORD, v];

/** Nearest position left of `i` with a smaller value than `i`'s — 0 if none. Folding ascending
 *  and overwriting on every match leaves the LARGEST matching position, the closest one. */
const nearestSmallerLeft = (i: MathJSON): MathJSON =>
  overRange(SIZE, 0, ["If", ["And", ["Less", "jl", i], ["Less", val("jl"), val(i)]], "jl", "accl"], "accl", "jl");

/** Nearest position right of `i` with a smaller value — 0 if none. Freezing once a match is
 *  found (the accumulator stays 0 until then) leaves the SMALLEST matching position, the
 *  closest one on this side. */
const nearestSmallerRight = (i: MathJSON): MathJSON =>
  overRange(
    SIZE,
    0,
    [
      "If",
      ["Equal", "accr", 0],
      ["If", ["And", ["Greater", "jr", i], ["Less", val("jr"), val(i)]], "jr", "accr"],
      "accr",
    ],
    "accr",
    "jr",
  );

/** `i`'s parent position under minimum-splitting recursion, 0 at the root (the global
 *  minimum). */
const parentPos = (i: MathJSON): MathJSON =>
  bind("nsl", nearestSmallerLeft(i), [
    "Apply",
    [
      "Function",
      [
        "If",
        ["And", ["Equal", "nsl", 0], ["Equal", "nsr", 0]],
        0,
        [
          "If",
          ["Equal", "nsl", 0],
          "nsr",
          ["If", ["Equal", "nsr", 0], "nsl", ["If", ["Greater", val("nsl"), val("nsr")], "nsl", "nsr"]],
        ],
      ],
      "nsr",
    ],
    nearestSmallerRight(i),
  ]);

/** The POSITION of `i`'s child on `side` of its parent — `i` lies left of a right-side parent,
 *  or right of a left-side parent — 0 (no position) if `i` has no such child. At most one
 *  position can match a given (parent, side) pair, so overwriting on every match is exact. */
const childPositionOnSide = (parentPosition: MathJSON, side: "left" | "right"): MathJSON =>
  overRange(
    SIZE,
    0,
    [
      "If",
      [
        "And",
        ["Equal", parentPos("ci"), parentPosition],
        side === "left" ? ["Less", "ci", parentPosition] : ["Greater", "ci", parentPosition],
      ],
      "ci",
      "cacc",
    ],
    "cacc",
    "ci",
  );

/** The whole tree, built bottom-up: values from the largest down, each node `[value, left, right]` stored at its
 *  position's cell, its children's cells (already built, a child being larger) read back. Cell 1 is the leaf 0, so
 *  position `p` is cell `p + 1` and an absent child (position 0) reads the leaf with no branch: a leaf (an integer)
 *  and a node (a list) in one `If` would have two shapes, which compiled code declines. The root is the position of
 *  value 1: every permutation of [n] holds it, and heap order puts the global minimum at the top. */
export const fromPermutationTree: MathJSON = bind(
  "fp_cells",
  [
    "Fold",
    [
      "Function",
      bind(
        "fp_nodes",
        "fp_acc",
        bind(
          "fp_p",
          posOf("fp_v"),
          [
            "ReplaceAt",
            "fp_nodes",
            ["Add", "fp_p", 1],
            [
              "List",
              "fp_v",
              at("fp_nodes", ["Add", childPositionOnSide("fp_p", "left"), 1]),
              at("fp_nodes", ["Add", childPositionOnSide("fp_p", "right"), 1]),
            ],
          ],
          "integer",
        ),
        "list<any>",
      ),
      "fp_acc",
      "fp_v",
    ],
    ["Map", ["Function", 0, "fp_z"], ["Range", 1, ["Add", SIZE, 1], 1]],
    ["Range", SIZE, 1, -1],
  ],
  at("fp_cells", ["Add", posOf(1), 1]),
  "list<any>",
);
