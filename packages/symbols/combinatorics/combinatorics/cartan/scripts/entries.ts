// Cartan type statistics' generated reference entries (generic driver in
// `../../src/statistics/generate-entries.ts`). `scripts/collect-entries.ts` writes them into `../../reference/`;
// `tests/statistics-generated.test.ts` checks they're current.

import { fileURLToPath } from "node:url";
import type { GeneratedEntries } from "@enumeratio/entry/node";
import { areaStatisticsEntries, type Sample } from "../../src/statistics/generate-entries.ts";
import { declareCartan } from "../src/declare.ts";
import { CARTAN_FRONTIER } from "../src/statistics.frontier.ts";
import { CARTAN_STATISTICS } from "../src/statistics.ts";

const SAMPLES: readonly Sample[] = [
  { on: "CartanType", list: [], subject: ["Tuple", "'D'", 5], caption: "the type $D_5$" },
  { on: "CartanType", list: [], subject: ["Tuple", "'E'", 6], caption: "the type $E_6$" },
];

export const REFERENCE_DIR = fileURLToPath(new URL("../../reference/", import.meta.url));

export const generated: { standard: GeneratedEntries; curated: GeneratedEntries } = areaStatisticsEntries({
  subjectName: "cartanType",
  domain: "Cartan type statistics",
  definitions: CARTAN_STATISTICS,
  frontier: CARTAN_FRONTIER,
  samples: SAMPLES,
  declareArea: declareCartan,
  curatedHeads: ["WeylGroupOrder", "CoxeterNumber", "WeylGroupExponents", "CartanMatrix"],
  dir: REFERENCE_DIR,
});
