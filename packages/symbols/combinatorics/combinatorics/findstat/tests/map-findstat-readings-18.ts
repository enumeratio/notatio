// Readings for maps batch 18, after the Sage code FindStat states for each. Same contract as
// map-findstat-readings.ts: FindStat's text in, FindStat's text out.

import type { Reading } from "./map-findstat-readings.ts";

const ints = (text: string): number[] => JSON.parse(text) as number[];
const list = (items: readonly number[]): string => `[${items.join(",")}]`;

/** The arcs of a perfect matching's text `[(1,4),(2,3)]`, each as [least, greatest]. */
const arcs = (text: string): [number, number][] =>
  (JSON.parse(text.replaceAll("(", "[").replaceAll(")", "]")) as number[][]).map(
    ([a, b]) => [Math.min(a!, b!), Math.max(a!, b!)] as [number, number],
  );
const arcsText = (items: readonly (readonly [number, number])[]): string =>
  `[${items
    .toSorted((x, y) => x[0] - y[0])
    .map(([a, b]) => `(${a},${b})`)
    .join(",")}]`;

/** Sage's partner(i): the point joined to i (1-based). */
const partners = (matching: readonly (readonly [number, number])[]): number[] => {
  const partner = new Array<number>(2 * matching.length + 1).fill(0);
  for (const [a, b] of matching) {
    partner[a] = b;
    partner[b] = a;
  }
  return partner;
};

// --- Mp00058: the fixed point free involution of the transpositions ---

const toPermutation = (text: string): string => list(partners(arcs(text)).slice(1));

// --- Mp00283: each closer's position holds its opener; the openers' positions take the missing values in order ---

const nonNestingExceedence = (text: string): string => {
  const matching = arcs(text);
  const n = 2 * matching.length;
  const pi: (number | null)[] = new Array<number | null>(n).fill(null);
  const missing = Array.from({ length: n }, (_, k) => k + 1);
  for (const [a, b] of matching) {
    pi[b - 1] = a;
    missing.splice(missing.indexOf(a), 1);
  }
  for (let i = 0; i < n; i++) if (pi[i] === null) pi[i] = missing.shift()!;
  return list(pi as number[]);
};

// --- Mp00092: the blocks are the arcs ---

const toSetPartition = (text: string): string =>
  `{${arcs(text)
    .toSorted((x, y) => x[0] - y[0])
    .map(([a, b]) => `{${a},${b}}`)
    .join(",")}}`;

// --- Mp00150: 1 where the partner is later, 0 where it is earlier ---

const toDyckPath = (text: string): string => {
  const partner = partners(arcs(text));
  return list(partner.slice(1).map((p, k) => (p > k + 1 ? 1 : 0)));
};

// --- Mp00146: an up step at i and the down step that closes its tunnel at j ---

const tunnelMatching = (text: string): string => {
  const stack: number[] = [];
  const found: [number, number][] = [];
  ints(text).forEach((step, k) => {
    if (step === 1) stack.push(k + 1);
    else found.push([stack.pop()!, k + 1]);
  });
  return arcsText(found);
};

export const BATCH_EIGHTEEN_READINGS: Readonly<Record<string, Reading>> = {
  "Permutation@PerfectMatching": toPermutation,
  "NonNestingExceedencePermutation@PerfectMatching": nonNestingExceedence,
  "SetPartition@PerfectMatching": toSetPartition,
  "DyckPath@PerfectMatching": toDyckPath,
  "PerfectMatching@DyckPath": tunnelMatching,
};

/** Each reading's FindStat map. */
export const BATCH_EIGHTEEN_IDS: Readonly<Record<string, string>> = {
  "Permutation@PerfectMatching": "Mp00058",
  "NonNestingExceedencePermutation@PerfectMatching": "Mp00283",
  "SetPartition@PerfectMatching": "Mp00092",
  "DyckPath@PerfectMatching": "Mp00150",
  "PerfectMatching@DyckPath": "Mp00146",
};
