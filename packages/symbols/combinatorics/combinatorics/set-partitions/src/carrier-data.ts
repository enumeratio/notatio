// Carrier data for the set-partitions area (https://github.com/enumeratio/notatio/wiki/Speculative-Combinatorics-Layering-and-Plausible §4 step 4). Hand-maintained: split from the retired domains/scripts/extract.ts
// generator, one-time, from the last generated domain-data.ts. Families for this area move
// here in step 5.

import type { Carrier } from "@notatio/structures";

export const SET_PARTITIONS_CARRIERS: readonly Carrier[] = [
  {
    name: "Finset",
    type: "finset",
    // Params first (n, then the element list) — `carrierParams`'s packing convention
    // (declare.ts: `Tuple(...params, encoded)`), matching LabeledGraph/Tournament's own
    // `tuple<integer, list<integer>>`. Flipped from element-first (A-116); `carrierParams: 1`
    // has to be declared here too, matching the families that pack it (Subsets/KSubsets), so
    // the oracle's packed-tuple unwrap (emit.ts/structural.ts, #455) reads the same count.
    shape: "tuple<integer, list<integer>>",
    id: "finset",
    plural: "Finsets",
    carrierParams: 1,
  },
  {
    name: "Multiset",
    readable: true,
    type: "multiset",
    // Params first — see Finset above.
    shape: "tuple<integer, list<integer>>",
    id: "multiset",
    plural: "Multisets",
    carrierParams: 1,
  },
  {
    name: "PerfectMatching",
    readable: true,
    type: "perfect_matching",
    shape: "list<list<integer>>",
    id: "perfect_matching",
    plural: "PerfectMatchings",
  },
  {
    name: "RestrictedGrowthString",
    type: "restricted_growth_string",
    shape: "list<integer>",
    id: "restricted_growth_string",
    plural: "RestrictedGrowthStrings",
  },
  {
    name: "SetComposition",
    type: "set_composition",
    shape: "list<list<integer>>",
    id: "set_composition",
    plural: "SetCompositions",
  },
  {
    name: "SetPartition",
    readable: true,
    type: "set_partition",
    shape: "list<list<integer>>",
    id: "set_partition",
    plural: "SetPartitions",
  },
  {
    name: "Surjection",
    type: "surjection",
    shape: "list<integer>",
    id: "surjection",
    plural: "Surjections",
  },
];
