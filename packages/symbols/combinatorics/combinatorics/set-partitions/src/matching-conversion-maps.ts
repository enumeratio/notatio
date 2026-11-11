// Maps from perfect matchings (Mp00058, Mp00092, Mp00150, Mp00283).
// A matching on the points 1 .. 2m is a list of arcs [a, b] with a < b, listed by a.

import { at, bind, forEach, type CombinatorialMap, type MathJSON } from "../../src/map-helpers.ts";

const upTo = (k: MathJSON): MathJSON => ["Range", 1, k, 1];
/** The number of points. */
const points: MathJSON = ["Multiply", 2, ["Length", "_raw"]];

/** Entry j is the point joined to j: the other end of the arc that holds it. */
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

/** Applies `body` to the partner list `mc_p`, or gives the empty list for the empty matching (a Range of 0 points
 *  would count down). */
const withPartners = (body: MathJSON): MathJSON => [
  "If",
  ["Equal", ["Length", "_raw"], 0],
  ["List"],
  bind("mc_p", partnerList, body, "list<integer>"),
];

const partner = (point: MathJSON): MathJSON => at(point, "mc_p");
const isOpener = (point: MathJSON): MathJSON => ["Greater", partner(point), point];

export const MATCHING_CONVERSION_MAPS: readonly CombinatorialMap[] = [
  {
    name: "Permutation",
    convert: true,
    from: "perfect_matching",
    to: "permutation",
    body: withPartners("mc_p"),
    summary: "The fixed point free involution that swaps the two ends of every arc.",
    note: "FindStat's Mp00058, an injection: the arcs are the 2-cycles.",
  },
  {
    name: "NonNestingExceedencePermutation",
    from: "perfect_matching",
    to: "permutation",
    // A closer's position holds its opener; the k-th opener's position holds the k-th closer, so the exceedences
    // (the openers' positions) form the non-nesting matching with the same openers.
    body: [
      "If",
      ["Equal", ["Length", "_raw"], 0],
      ["List"],
      bind(
        "mc_c",
        // The closers in increasing order: the points that no arc starts at.
        [
          "Filter",
          upTo(points),
          ["Function", ["Equal", ["Sum", forEach("_raw", ["If", ["Equal", at(1, "e"), "c"], 1, 0], "e")], 0], "c"],
        ],
        forEach(
          upTo(points),
          [
            "Sum",
            forEach(
              upTo(["Length", "_raw"]),
              [
                "If",
                ["Equal", at(1, at("m", "_raw")), "j"],
                at("m", "mc_c"),
                ["If", ["Equal", at(2, at("m", "_raw")), "j"], at(1, at("m", "_raw")), 0],
              ],
              "m",
            ),
          ],
          "j",
        ),
        "list<integer>",
      ),
    ],
    summary:
      "The fixed point free permutation with the matching's deficiencies, no alignments and no inversions between exceedences.",
    note: "FindStat's Mp00283, an injection: the exceedences are the unique non-nesting matching with the same openers.",
  },
  {
    name: "SetPartition",
    convert: true,
    from: "perfect_matching",
    to: "set_partition",
    body: "_raw",
    summary: "The set partition whose blocks are the arcs.",
    note: "FindStat's Mp00092, an injection.",
  },
  {
    name: "DyckPath",
    convert: true,
    from: "perfect_matching",
    to: "dyck_path",
    body: withPartners(forEach(upTo(points), ["If", isOpener("i"), 1, 0])),
    summary: "The opener and closer sequence: an up step at each arc's least point, a down step at its greatest.",
    note: "FindStat's Mp00150, a surjection: noncrossing and non-nesting matchings with the same openers give the same path.",
  },
];
