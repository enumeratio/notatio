// Poset statistics' generated reference entries (generic driver in
// `../../src/statistics/generate-entries.ts`). `scripts/collect-entries.ts` writes them
// into `../../reference/`; `tests/statistics-generated.test.ts` checks they're current.
//
// A sample applies to every definition of its carrier, and a lattice statistic is defined only on a lattice, so the
// lattice statistics have a call of their own, with the pentagon, which is a lattice; the first sample is not one.

import { fileURLToPath } from "node:url";
import type { GeneratedEntries } from "@notatio/entry/node";
import { areaStatisticsEntries, type Sample } from "../../src/statistics/generate-entries.ts";
import { declarePosetsArea } from "../src/declare.ts";
import { POSETS_FRONTIER } from "../src/statistics.frontier.ts";
import { LATTICE_STATISTICS } from "../src/statistics.lattices.ts";
import { POSET_STATISTICS } from "../src/statistics.ts";

const SAMPLES: readonly Sample[] = [
  {
    on: "Poset",
    list: [[], [], [1], [1, 2]],
    caption: "the poset on 4 elements with 1 < 3, 1 < 4 and 2 < 4",
  },
];

/** The heads with a hand-written record in `../../reference/`: `LinearExtensionCount` is also defined on trees. */
const CURATED_HEADS: readonly string[] = ["LinearExtensionCount"];

const PENTAGON: Sample = {
  on: "Poset",
  list: [[], [1], [1], [3], [2, 4]],
  caption: "the pentagon lattice: 1 < 2 < 5 and 1 < 3 < 4 < 5",
};
/** The upside-down V: a top and a join for every pair, but no bottom, so no lattice. */
const UPSIDE_DOWN_V: Sample = {
  on: "Poset",
  list: [[], [], [1, 2]],
  caption: "the poset on 3 elements with 1 < 3 and 2 < 3, which has no bottom",
};

export const REFERENCE_DIR = fileURLToPath(new URL("../../reference/", import.meta.url));

const area = (
  definitions: typeof POSET_STATISTICS,
  subjectName: string,
  domain: string,
  samples: readonly Sample[],
): { standard: GeneratedEntries; curated: GeneratedEntries } =>
  areaStatisticsEntries({
    subjectName,
    domain,
    definitions,
    frontier: [],
    samples,
    declareArea: declarePosetsArea,
    carrierNames: { Poset: { subjectName, domain } },
    dir: REFERENCE_DIR,
  });

const posets = areaStatisticsEntries({
  subjectName: "poset",
  domain: "Poset statistics",
  definitions: POSET_STATISTICS,
  frontier: POSETS_FRONTIER,
  samples: SAMPLES,
  declareArea: declarePosetsArea,
  carrierNames: { Poset: { subjectName: "poset", domain: "Poset statistics" } },
  curatedHeads: CURATED_HEADS,
  dir: REFERENCE_DIR,
});
const isLattice = area(
  LATTICE_STATISTICS.filter((d) => d.head === "IsLattice"),
  "poset",
  "Lattice statistics",
  [PENTAGON, UPSIDE_DOWN_V],
);
const lattices = area(
  LATTICE_STATISTICS.filter((d) => d.head !== "IsLattice"),
  "lattice",
  "Lattice statistics",
  [PENTAGON],
);

const merged = (parts: readonly GeneratedEntries[]): GeneratedEntries => ({
  entries: parts.flatMap((p) => p.entries),
  owned: new Set(parts.flatMap((p) => [...p.owned])),
  fields: parts[0]!.fields,
});

export const generated: { standard: GeneratedEntries; curated: GeneratedEntries } = {
  standard: merged([posets.standard, isLattice.standard, lattices.standard]),
  curated: merged([posets.curated, isLattice.curated, lattices.curated]),
};
