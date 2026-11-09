// Combinatorial maps whose `from` carrier is `perfect_matching`: the arcs [a, b] with a < b, listed by a.
// A matching on the points 1 .. 2m is read as its partner list, where entry j is the point joined to j.

import { at, bind, forEach, type CombinatorialMap, type MathJSON } from "../../src/map-helpers.ts";
import { kasraouiZengBody } from "./involution-maps.ts";

const upTo = (k: MathJSON): MathJSON => ["Range", 1, k, 1];
/** The number of points. */
const points: MathJSON = ["Multiply", 2, ["Length", "_raw"]];

/** The point joined to j: the other end of the arc that holds it. */
const partnerList: MathJSON = forEach(
  upTo(points),
  [
    "Max",
    [
      "Sum",
      forEach(
        "_raw",
        ["If", ["Equal", at(1, "e"), "j"], at(2, "e"), ["If", ["Equal", at(2, "e"), "j"], at(1, "e"), 0]],
        "e",
      ),
    ],
    0,
  ],
  "j",
);

/** The matching whose partner of point j is `partnerOf(j)`, given the partner list `pm_p` of the argument: its arcs are
 *  the points that are the lesser end, each with its partner. */
const matchingBy = (partnerOf: (j: MathJSON) => MathJSON): MathJSON => [
  "If",
  ["Equal", ["Length", "_raw"], 0],
  ["List"],
  bind(
    "pm_p",
    partnerList,
    bind(
      "pm_flat",
      [
        "Flatten",
        forEach(upTo(points), ["If", ["Greater", partnerOf("j"), "j"], ["List", "j", partnerOf("j")], ["List"]], "j"),
      ],
      forEach(
        upTo(["Length", "_raw"]),
        ["List", at(["Subtract", ["Multiply", 2, "k"], 1], "pm_flat"), at(["Multiply", 2, "k"], "pm_flat")],
        "k",
      ),
      "list<integer>",
    ),
    "list<integer>",
  ),
];

const partner = (point: MathJSON): MathJSON => at(point, "pm_p");

export const PERFECT_MATCHING_MAPS: readonly CombinatorialMap[] = [
  {
    name: "Reverse",
    from: "perfect_matching",
    to: "perfect_matching",
    body: matchingBy((j) => ["Subtract", ["Add", points, 1], partner(["Subtract", ["Add", points, 1], j])]),
    summary: "The matching with every point i replaced by 2m + 1 - i.",
    note: "FindStat's Mp00113, an involution.",
  },
  {
    name: "Rotation",
    from: "perfect_matching",
    to: "perfect_matching",
    // The point before j, cyclically, goes to j.
    body: matchingBy((j) => [
      "Add",
      ["Mod", partner(["Add", ["Mod", ["Add", ["Subtract", j, 2], points], points], 1]), points],
      1,
    ]),
    summary: "The matching with every point i replaced by i + 1, and 2m by 1.",
    note: "FindStat's Mp00144; the inverse is InverseRotation. Its order divides 2m.",
  },
  {
    name: "InverseRotation",
    from: "perfect_matching",
    to: "perfect_matching",
    // The point after j, cyclically, goes to j.
    body: matchingBy((j) => [
      "Add",
      ["Mod", ["Add", ["Subtract", partner(["Add", ["Mod", j, points], 1]), 2], points], points],
      1,
    ]),
    summary: "The matching with every point i replaced by i - 1, and 1 by 2m.",
    note: "FindStat's Mp00145, the inverse of Rotation.",
  },
  {
    name: "KasraouiZeng",
    from: "perfect_matching",
    to: "perfect_matching",
    // A matching's arcs are the consecutive elements of a set partition's blocks, and the matching is the set partition.
    body: kasraouiZengBody,
    summary: "The Kasraoui-Zeng involution: exchanges the number of crossings with the number of nestings.",
    note: "FindStat's Mp00116, the case of Mp00115 where every block is an arc.",
  },
];
