// Parking functions to semistandard tableaux (Mp00302).

import type { CombinatorialMap } from "../../src/map-helpers.ts";
import { weakInsertionRows } from "../../tableaux/src/weak-insertion.ts";

export const PARKING_TABLEAU_MAPS: readonly CombinatorialMap[] = [
  {
    name: "RskInsertion",
    from: "parking_function",
    to: "semistandard_tableau",
    body: ["If", ["Equal", ["Length", "_raw"], 0], ["List"], weakInsertionRows("pk", "_raw")],
    summary:
      "The insertion tableau of the RSK correspondence on the word: row insertion, an entry bumping the leftmost larger one.",
    note: "FindStat's Mp00302. The word repeats letters, so the tableau is semistandard; its content is the multiset of the entries.",
  },
];
