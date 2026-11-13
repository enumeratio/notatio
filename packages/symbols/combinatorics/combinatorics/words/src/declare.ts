// Words' own declare (https://github.com/enumeratio/notatio/wiki/Speculative-Combinatorics-Layering-and-Plausible §4 step 5, A-94).
import type { Engine } from "@notatio/engine";
import { declareCarriers } from "@notatio/structures";
import { declareFamilies } from "../../collections/src/families/declare.ts";
import { liftFamily } from "../../collections/src/families/epsil.ts";
import { declareStatistics } from "../../src/statistics/declare.ts";
import { WORDS_CARRIERS } from "./carrier-data.ts";
import { binaryWordFamiliesEntries, coreEntries, tableauxTreesEntries, wordsEntries } from "./families/index.ts";
import { WORD_STATISTICS } from "./statistics.ts";

export function declareWords(ce: Engine): void {
  declareCarriers(ce, WORDS_CARRIERS, { plurals: false });
  declareFamilies(
    ce,
    [...coreEntries, ...wordsEntries, ...binaryWordFamiliesEntries, ...tableauxTreesEntries].map(liftFamily),
  );
  // Its statistics, after its own carriers and families.
  declareStatistics(ce, WORD_STATISTICS);
}
