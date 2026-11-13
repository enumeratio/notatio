// Graph statistics' generated reference entries (step 6b: one generator per area, generic
// driver in `../../src/statistics/generate-entries.ts`). `scripts/collect-entries.ts` writes them
// into `../../reference/`; `tests/statistics-generated.test.ts` checks they're current.

import { fileURLToPath } from "node:url";
import type { GeneratedEntries } from "@notatio/entry/node";
import { areaStatisticsEntries, type Sample } from "../../src/statistics/generate-entries.ts";
import { declareGraphsArea } from "../src/declare.ts";
import { GRAPHS_FRONTIER } from "../src/statistics.frontier.ts";
import { GRAPH_STATISTICS } from "../src/statistics.ts";

// The path 1 - 2 - 3 - 4 with the chord 2 - 4: a triangle with a tail, a graph where the statistics differ.
const SAMPLES: readonly Sample[] = [
  {
    on: "LabeledGraph",
    list: [
      4,
      [
        [1, 2],
        [2, 3],
        [2, 4],
        [3, 4],
      ],
    ],
    contents: ["Tuple", 4, ["List", ["List", 1, 2], ["List", 2, 3], ["List", 2, 4], ["List", 3, 4]]],
    caption: "the graph on 4 vertices with the edges 12, 23, 24 and 34",
  },
];

export const REFERENCE_DIR = fileURLToPath(new URL("../../reference/", import.meta.url));

export const generated: { standard: GeneratedEntries; curated: GeneratedEntries } = areaStatisticsEntries({
  subjectName: "graph",
  domain: "Graph statistics",
  definitions: GRAPH_STATISTICS,
  frontier: GRAPHS_FRONTIER,
  samples: SAMPLES,
  declareArea: declareGraphsArea,
  carrierNames: { LabeledGraph: { subjectName: "graph", domain: "Graph statistics" } },
  dir: REFERENCE_DIR,
});
