// TotalPartitions(n) in Epsil: the total partitions of n, the ways to bracket n leaves in order
// into brackets of two or more items (Schröder's second problem, A001003(n − 1): 1, 1, 3, 11, 45
// for n = 1, 2, 3, …), as nested lists: a leaf 0, a bracket the list of its items, the whole
// bracketing a list from n = 2 on and the bare leaf 0 for n = 1. Listed in the order of
// ./bracketings.ts, which Dissections(n − 1) lists its dissections in too.
import type { EpsilFamily } from "../../../collections/src/families/epsil.ts";
import type { Declared } from "../../../collections/src/families/types.ts";
import { and, at, equal, iff, less, lets, mul } from "../../../collections/src/families/tables.ts";
import { ANY } from "../../../collections/src/families/nested.ts";
import { bracketings, nestedOf, readNested } from "./bracketings.ts";

const N = "_n";
const b = bracketings(N);
const read = readNested("_x", N);

const declared: Declared = {
  carrier: "TotalPartition",
  params: [{ name: "n", role: "axis", min: 1 }],
  cost: { count: "polynomial", unrank: "polynomial", rank: "polynomial", valid: "polynomial" },
};

export const totalPartitions: EpsilFamily = {
  head: "TotalPartitions",
  carrier: "TotalPartition",
  paramCount: 1,
  declared,
  kind: "nested",
  params: [N],
  declinePastDoubles: true,
  epsil: {
    count: b.count,
    tables: b.tables,
    unrank: lets([["pc", b.unrankChords, "list<integer>"]], nestedOf("pc", N)),
    rank: lets(
      [
        ["tr", read, ANY],
        // The first chord is the whole.
        ["cx", ["Drop", ["Take", ["Drop", "tr", 4], mul(2, at("tr", 3))], 2], "list<integer>"],
      ],
      b.rankChords,
    ),
    valid: iff(
      less(N, 1),
      "False",
      lets([["tr", read, ANY]], and(equal(at("tr", 1), 0), equal(at("tr", 4), 0), equal(at("tr", 2), N))),
    ),
  },
};
