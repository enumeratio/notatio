// Graphs' own declare (https://github.com/enumeratio/notatio/wiki/Speculative-Combinatorics-Layering-and-Plausible §4 step 5, A-94).
import type { Engine } from "@enumeratio/engine";
import { declareCarriers } from "@enumeratio/structures";
import { declareFamilies } from "../../collections/src/families/declare.ts";
import { liftFamily } from "../../collections/src/families/epsil.ts";
import { declareStatistics } from "../../src/statistics/declare.ts";
import { GRAPHS_CARRIERS } from "./carrier-data.ts";
import { coreEntries } from "./families/index.ts";
import { GRAPH_STATISTICS } from "./statistics.ts";

export function declareGraphsArea(ce: Engine): void {
  declareCarriers(ce, GRAPHS_CARRIERS, { plurals: false });
  declareFamilies(ce, coreEntries.map(liftFamily));
  // Its statistics, after its own carriers and families.
  declareStatistics(ce, GRAPH_STATISTICS);
}
