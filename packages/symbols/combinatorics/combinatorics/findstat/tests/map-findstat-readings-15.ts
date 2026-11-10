// Readings for maps batch 15, after the Sage code FindStat states for each. Same contract as
// map-findstat-readings.ts: FindStat's text in, FindStat's text out.

import type { Reading } from "./map-findstat-readings.ts";

const list = (items: readonly number[]): string => `[${items.join(",")}]`;

export const BATCH_FIFTEEN_READINGS: Readonly<Record<string, Reading>> = {
  "TableauShape@SemistandardTableau": (t) => list((JSON.parse(t) as number[][]).map((row) => row.length)),
};

export const BATCH_FIFTEEN_IDS: Readonly<Record<string, string>> = {
  "TableauShape@SemistandardTableau": "Mp00077",
};
