// Plane partitions to integer partitions (Mp00311).

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
];
