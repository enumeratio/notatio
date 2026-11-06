// Standard-tableau statistics' generated reference entries (step 6b: one generator per area, generic
// driver in `../../src/statistics/generate-entries.ts`). `scripts/collect-entries.ts` writes them
// into `../../reference/`; `tests/statistics-generated.test.ts` checks they're current.
// `WeightedSize` is also a partition head, so its record is hand-written and this area only
// merges in `details` and `examples`.

import { fileURLToPath } from "node:url";
import type { GeneratedEntries } from "@enumeratio/entry/node";
import { areaStatisticsEntries, type Sample } from "../../src/statistics/generate-entries.ts";
import { TABLEAUX_FRONTIER } from "../src/statistics.frontier.ts";
import { TABLEAU_STATISTICS } from "../src/statistics.ts";
import { declareTableaux } from "../src/declare.ts";

const SAMPLES: readonly Sample[] = [
  {
    on: "StandardTableau",
    list: [[1, 2, 4], [3, 6], [5]],
    caption: "the standard tableau $[[1,2,4],[3,6],[5]]$",
  },
  {
    on: "AlternatingSignMatrix",
    list: [
      [0, 1, 0],
      [1, -1, 1],
      [0, 1, 0],
    ],
    caption: "the alternating sign matrix $[[0,1,0],[1,-1,1],[0,1,0]]$",
  },
  {
    on: "PlanePartition",
    list: [[4, 3, 1], [3, 1], [1]],
    caption: "the plane partition $[[4,3,1],[3,1],[1]]$",
  },
  {
    on: "SkewPartition",
    list: [[3, 1], [1]],
    caption: "the skew partition $[[3,1],[1]]$",
  },
];

// These heads are also partition heads, which own their records.
const SHARED_WITH_PARTITIONS = [
  "DistinctParts",
  "EvenParts",
  "LargestPart",
  "LargestRepeatedPart",
  "MaximalRookPlacementCount",
  "MultiplicityOfSmallestPart",
  "OddParts",
  "PartCount",
  "PartRange",
  "RookPlacementCount",
  "SmallestMissingPart",
  "StandardTableauCount",
];

export const REFERENCE_DIR = fileURLToPath(new URL("../../reference/", import.meta.url));

export const generated: { standard: GeneratedEntries; curated: GeneratedEntries } = areaStatisticsEntries({
  subjectName: "tableau",
  domain: "Tableau statistics",
  definitions: TABLEAU_STATISTICS,
  frontier: TABLEAUX_FRONTIER,
  samples: SAMPLES,
  declareArea: declareTableaux,
  carrierNames: {
    AlternatingSignMatrix: { subjectName: "matrix", domain: "Alternating sign matrix statistics" },
    PlanePartition: { subjectName: "planePartition", domain: "Plane partition statistics" },
    SkewPartition: { subjectName: "shape", domain: "Skew partition statistics" },
  },
  curatedHeads: ["WeightedSize"],
  dir: REFERENCE_DIR,
  omitHeads: SHARED_WITH_PARTITIONS,
});
