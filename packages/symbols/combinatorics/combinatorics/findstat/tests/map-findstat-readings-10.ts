// Readings for maps batch 10: the cycle-as-one-line notation (Mp00090), the Simion-Schmidt map (Mp00068), toric
// promotion and its inverse (Mp00310, Mp00309), the standard permutation of a binary word (Mp00336) and the
// labeling and car permutations of a parking function (Mp00055, Mp00053), after the Sage code FindStat states
// for each. Same contract as map-findstat-readings.ts: FindStat's text in, FindStat's text out.

import type { Reading } from "./map-findstat-readings.ts";

const ints = (text: string): number[] => JSON.parse(text) as number[];
const list = (items: readonly number[]): string => `[${items.join(",")}]`;
const range = (from: number, to: number): number[] =>
  Array.from({ length: Math.max(0, to - from + 1) }, (_, k) => from + k);

/** Indices 0 .. n - 1 ordered by entry, equal entries by index: the stable sort of the word. */
const stableOrder = (word: readonly number[]): number[] =>
  range(0, word.length - 1).toSorted((a, b) => word[a]! - word[b]! || a - b);

// --- Mp00090: Sage's cycle_tuples, each cycle from its least point, concatenated ---

const cycleAsOneLine = (pi: readonly number[]): number[] => {
  const seen = new Set<number>();
  const out: number[] = [];
  for (const start of range(1, pi.length)) {
    for (let point = start; !seen.has(point); point = pi[point - 1]!) {
      seen.add(point);
      out.push(point);
    }
  }
  return out;
};

// --- Mp00068: Sage's simion_schmidt(avoid=[1,2,3]) ---

const simionSchmidt = (pi: readonly number[]): number[] => {
  let least = Number.POSITIVE_INFINITY;
  const minima = new Set<number>();
  for (const value of pi) {
    if (value < least) {
      least = value;
      minima.add(value);
    }
  }
  // The values that are not minima, largest first, dealt to the positions that are not.
  const others = range(1, pi.length)
    .filter((value) => !minima.has(value))
    .toReversed();
  let next = 0;
  return pi.map((value) => (minima.has(value) ? value : others[next++]!));
};

// --- Mp00310 and Mp00309: the toggles of the code FindStat states, applied one at a time ---

const toggle = (pi: number[], a: number, b: number): void => {
  const at = pi.indexOf(a);
  const to = pi.indexOf(b);
  if (Math.abs(at - to) === 1) return;
  pi[at] = b;
  pi[to] = a;
};

const toricPromotion = (pi: readonly number[]): number[] => {
  const out = [...pi];
  if (pi.length < 2) return out;
  for (const i of range(1, pi.length - 1)) toggle(out, i, i + 1);
  toggle(out, pi.length, 1);
  return out;
};

const inverseToricPromotion = (pi: readonly number[]): number[] => {
  const out = [...pi];
  if (pi.length < 2) return out;
  toggle(out, pi.length, 1);
  for (const i of range(1, pi.length - 1).toReversed()) toggle(out, i, i + 1);
  return out;
};

// --- Mp00053: cars park one at a time ---

const carPermutation = (preferences: readonly number[]): number[] => {
  const spots = preferences.map(() => 0);
  preferences.forEach((preference, car) => {
    let spot = preference - 1;
    while (spots[spot] !== 0) spot++;
    spots[spot] = car + 1;
  });
  return spots;
};

export const BATCH_TEN_READINGS: Readonly<Record<string, Reading>> = {
  "CycleAsOneLineNotation@Permutation": (p) => list(cycleAsOneLine(ints(p))),
  "SimionSchmidt@Permutation": (p) => list(simionSchmidt(ints(p))),
  "ToricPromotion@Permutation": (p) => list(toricPromotion(ints(p))),
  "InverseToricPromotion@Permutation": (p) => list(inverseToricPromotion(ints(p))),
  // The rank of each letter in the stable sort: the inverse of the order the sort lists the positions in.
  "StandardPermutation@BinaryWord": (w) => {
    const order = stableOrder(w.split("").map(Number));
    const ranks: number[] = [];
    order.forEach((position, rank) => (ranks[position] = rank + 1));
    return list(ranks);
  },
  "LabelingPermutation@ParkingFunction": (p) => list(stableOrder(ints(p)).map((position) => position + 1)),
  "CarPermutation@ParkingFunction": (p) => list(carPermutation(ints(p))),
};
