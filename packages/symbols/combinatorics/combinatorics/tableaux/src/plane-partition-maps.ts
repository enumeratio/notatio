// Plane partitions: to integer partitions (Mp00311), their shape, and the transpose (Mp00177).

import { at, forEach, type CombinatorialMap } from "../../src/map-helpers.ts";

export const PLANE_PARTITION_MAPS: readonly CombinatorialMap[] = [
  {
    name: "IntegerPartition",
    convert: true,
    from: "plane_partition",
    to: "integer_partition",
    // Rows weakly decrease and so do their sums, so the sums are already a partition.
    body: forEach(
      ["Range", 1, ["Length", "_raw"], 1],
      ["Fold", ["Function", ["Add", "pp_s", "pp_x"], "pp_s", "pp_x"], 0, at("i")],
    ),
    summary: "The underlying integer partition of a plane partition: the sum of each row.",
    note: "FindStat's Mp00311. Lossy: the rows' entries are forgotten, only their sums stay.",
  },
  {
    name: "PlanePartitionShape",
    from: "plane_partition",
    to: "integer_partition",
    // The carrier trims zeros, so a row's length is the length of its support.
    body: forEach(["Range", 1, ["Length", "_raw"], 1], ["Length", at("i")]),
    summary: "The shape of a plane partition: the row lengths of the array's support.",
    note: "Lossy: the entries are forgotten, only where they are nonzero stays.",
  },
  {
    name: "TransposePlanePartition",
    from: "plane_partition",
    to: "plane_partition",
    // Column j collects entry j of every row long enough to have one; the support is a shape, so no gaps.
    body: [
      "If",
      ["Equal", ["Length", "_raw"], 0],
      ["List"],
      forEach(
        ["Range", 1, ["Length", at(1)], 1],
        [
          "Map",
          ["Function", at("j", at("r")), "r"],
          [
            "Filter",
            ["Range", 1, ["Length", "_raw"], 1],
            ["Function", ["GreaterEqual", ["Length", at("r")], "j"], "r"],
          ],
        ],
        "j",
      ),
    ],
    summary: "The transpose of a plane partition: rows and columns of the array exchanged.",
    note: "FindStat's Mp00177, an involution.",
  },
];
