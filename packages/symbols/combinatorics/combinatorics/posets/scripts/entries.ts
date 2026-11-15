// Poset statistics' generated reference entries (generic driver in
// `../../src/statistics/generate-entries.ts`). `scripts/collect-entries.ts` writes them
// into `../../reference/`; `tests/statistics-generated.test.ts` checks they're current.

import { fileURLToPath } from "node:url";
import type { GeneratedEntries } from "@notatio/entry/node";
import { areaStatisticsEntries, type Sample } from "../../src/statistics/generate-entries.ts";
import { declarePosetsArea } from "../src/declare.ts";
import { POSETS_FRONTIER } from "../src/statistics.frontier.ts";
import { POSET_STATISTICS } from "../src/statistics.ts";

const SAMPLES: readonly Sample[] = [
  {
    on: "Poset",
    list: [[], [], [1], [1, 2]],
    caption: "the poset on 4 elements with 1 < 3, 1 < 4 and 2 < 4",
  },
];

export const REFERENCE_DIR = fileURLToPath(new URL("../../reference/", import.meta.url));

export const generated: { standard: GeneratedEntries; curated: GeneratedEntries } = areaStatisticsEntries({
  subjectName: "poset",
  domain: "Poset statistics",
  definitions: POSET_STATISTICS,
  frontier: POSETS_FRONTIER,
  samples: SAMPLES,
  declareArea: declarePosetsArea,
  carrierNames: { Poset: { subjectName: "poset", domain: "Poset statistics" } },
  dir: REFERENCE_DIR,
});
