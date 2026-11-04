// Standard-tableau statistics' generated reference entries (step 6b: one generator per area, generic
// driver in `../../src/statistics/generate-entries.ts`). `scripts/collect-entries.ts` writes them
// into `../../reference/`; `tests/statistics-generated.test.ts` checks they're current.

import { fileURLToPath } from "node:url";
import type { GeneratedEntries } from "@enumeratio/entry/node";
import { areaStatisticsEntries, type Sample } from "../../src/statistics/generate-entries.ts";
import { TABLEAUX_FRONTIER } from "../src/statistics.frontier.ts";
import { TABLEAU_STATISTICS } from "../src/statistics.ts";
import { declareTableaux } from "../src/declare.ts";

const SAMPLES: readonly Sample[] = [
  {
    list: [[1, 2, 4], [3, 6], [5]],
    caption: "the standard tableau $[[1,2,4],[3,6],[5]]$",
  },
];

export const REFERENCE_DIR = fileURLToPath(new URL("../../reference/", import.meta.url));

export const generated: { standard: GeneratedEntries; curated: GeneratedEntries } = areaStatisticsEntries({
  subjectName: "tableau",
  domain: "Tableau statistics",
  definitions: TABLEAU_STATISTICS,
  frontier: TABLEAUX_FRONTIER,
  samples: SAMPLES,
  declareArea: declareTableaux,
  dir: REFERENCE_DIR,
});
