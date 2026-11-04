// Binary-word statistics' generated reference entries (step 6b: one generator per area, generic
// driver in `../../src/statistics/generate-entries.ts`). `scripts/collect-entries.ts` writes them
// into `../../reference/`; `tests/statistics-generated.test.ts` checks they're current.

import { fileURLToPath } from "node:url";
import type { GeneratedEntries } from "@enumeratio/entry/node";
import { areaStatisticsEntries, type Sample } from "../../src/statistics/generate-entries.ts";
import { declareWords } from "../src/declare.ts";
import { WORDS_FRONTIER } from "../src/statistics.frontier.ts";
import { WORD_STATISTICS } from "../src/statistics.ts";

const SAMPLES: readonly Sample[] = [{ list: [1, 1, 0, 1, 0, 0, 1, 1, 1], caption: "the word $110100111$" }];

// `SymmetryDegree` is also a Dyck path head, so its record is hand-written and this area only
// merges in `details` and `examples`.
export const REFERENCE_DIR = fileURLToPath(new URL("../../reference/", import.meta.url));

export const generated: { standard: GeneratedEntries; curated: GeneratedEntries } = areaStatisticsEntries({
  subjectName: "word",
  domain: "Binary word statistics",
  definitions: WORD_STATISTICS,
  frontier: WORDS_FRONTIER,
  samples: SAMPLES,
  declareArea: declareWords,
  curatedHeads: ["SymmetryDegree"],
  dir: REFERENCE_DIR,
});
