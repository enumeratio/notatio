// Readings for maps batch 11: the rotations and the reversal of a parking function (Mp00293, Mp00304, Mp00320),
// after the Sage code FindStat states for each. Same contract as map-findstat-readings.ts: FindStat's text in,
// FindStat's text out.

import type { Reading } from "./map-findstat-readings.ts";

const ints = (text: string): number[] => JSON.parse(text) as number[];
const list = (items: readonly number[]): string => `[${items.join(",")}]`;

export const BATCH_ELEVEN_READINGS: Readonly<Record<string, Reading>> = {
  "CyclicShift@ParkingFunction": (p) => list([...ints(p).slice(1), ...ints(p).slice(0, 1)]),
  "InverseCyclicShift@ParkingFunction": (p) => list([...ints(p).slice(-1), ...ints(p).slice(0, -1)]),
  "Reverse@ParkingFunction": (p) => list(ints(p).toReversed()),
};
