// Posets' own declare.
import type { Engine } from "@notatio/engine";
import { declareCarriers } from "@notatio/structures";
import { declareStatistics } from "../../src/statistics/declare.ts";
import { POSETS_CARRIERS } from "./carrier-data.ts";
import { POSET_STATISTICS } from "./statistics.ts";

export function declarePosetsArea(ce: Engine): void {
  declareCarriers(ce, POSETS_CARRIERS, { plurals: false });
  // Its statistics, after its own carriers.
  declareStatistics(ce, POSET_STATISTICS);
}
