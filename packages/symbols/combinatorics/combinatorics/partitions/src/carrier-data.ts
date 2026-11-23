// Carrier data for the partitions area (https://github.com/enumeratio/notatio/wiki/Speculative-Combinatorics-Layering-and-Plausible §4 step 4). Hand-maintained: split from the retired domains/scripts/extract.ts
// generator, one-time, from the last generated domain-data.ts. Families for this area move
// here in step 5.

import type { Carrier } from "@notatio/structures";

export const PARTITIONS_CARRIERS: readonly Carrier[] = [
  {
    name: "CorePartition",
    readable: true,
    type: "core_partition",
    shape: "list<integer>",
    id: "core_partition",
    plural: "CorePartitions",
  },
  {
    name: "IntegerPartition",
    readable: true,
    type: "integer_partition",
    shape: "list<integer>",
    id: "integer_partition",
    plural: "IntegerPartitions",
  },
  {
    name: "MultiplicativePartition",
    readable: true,
    type: "multiplicative_partition",
    shape: "list<integer>",
    id: "multiplicative_partition",
    plural: "MultiplicativePartitions",
  },
  {
    name: "SkewPartition",
    readable: true,
    type: "skew_partition",
    shape: "list<list<integer>>",
    id: "skew_partition",
    plural: "SkewPartitions",
  },
  {
    name: "TotalPartition",
    readable: true,
    type: "total_partition",
    shape: "integer | list<any>",
    id: "total_partition",
    plural: "TotalPartitions",
  },
];
