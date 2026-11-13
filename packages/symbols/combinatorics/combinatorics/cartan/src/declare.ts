// The finite Cartan types' own declare: the carrier, the family that lists the types of a rank, and the statistics.
import type { Engine } from "@notatio/engine";
import { declareCarriers } from "@notatio/structures";
import { declareFamilies } from "../../collections/src/families/declare.ts";
import { liftFamily } from "../../collections/src/families/epsil.ts";
import { declareStatistics } from "../../src/statistics/declare.ts";
import { CARTAN_CARRIERS } from "./carrier-data.ts";
import { finiteCartanTypes } from "./families/index.ts";
import { CARTAN_STATISTICS } from "./statistics.ts";

export function declareCartan(ce: Engine): void {
  declareCarriers(ce, CARTAN_CARRIERS, { plurals: false });
  declareFamilies(ce, [finiteCartanTypes].map(liftFamily));
  // Its statistics, after its own carrier and family.
  declareStatistics(ce, CARTAN_STATISTICS);
}
