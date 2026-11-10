// Readings for maps batch 21, after the Sage code FindStat states for each: the underlying partition of a plane
// partition (Mp00311), the maximal clique sizes of a graph (Mp00251) and the horizontal strip sizes of a standard
// tableau (Mp00207). Same contract as map-findstat-readings.ts: FindStat's text in, FindStat's text out.

import type { Reading } from "./map-findstat-readings.ts";

const list = (items: readonly number[]): string => `[${items.join(",")}]`;
const range = (from: number, to: number): number[] =>
  Array.from({ length: Math.max(0, to - from + 1) }, (_, k) => from + k);

// --- Mp00251: the maximal cliques by growing from each vertex through its higher neighbors ---

const maximalCliqueSizes = (text: string): number[] => {
  const match = /^\(\[(.*)\],(\d+)\)$/.exec(text)!;
  const n = Number(match[2]);
  const joined = range(0, n - 1).map(() => range(0, n - 1).map(() => false));
  for (const e of match[1]!.matchAll(/\((\d+),(\d+)\)/g)) {
    joined[Number(e[1])]![Number(e[2])] = true;
    joined[Number(e[2])]![Number(e[1])] = true;
  }
  const sizes: number[] = [];
  // Bron-Kerbosch: `current` is the clique, `candidates` extend it, `excluded` would repeat one already reported.
  const grow = (current: number[], candidates: number[], excluded: number[]): void => {
    if (candidates.length === 0 && excluded.length === 0) {
      sizes.push(current.length);
      return;
    }
    const left = [...candidates];
    const barred = [...excluded];
    for (const v of candidates) {
      grow(
        [...current, v],
        left.filter((w) => joined[v]![w]),
        barred.filter((w) => joined[v]![w]),
      );
      left.splice(left.indexOf(v), 1);
      barred.push(v);
    }
  };
  grow([], range(0, n - 1), []);
  return sizes.toSorted((a, b) => b - a);
};

// --- Mp00207: strips of consecutive entries, the running column reset to 0 after a cut ---

const stripSizes = (text: string): number[] => {
  const rows = JSON.parse(text) as number[][];
  const n = rows.flat().length;
  const column = new Map<number, number>();
  rows.forEach((row) => row.forEach((value, c) => column.set(value, c)));
  const strips: number[][] = [];
  let strip: number[] = [];
  let y = -1;
  for (let i = 1; i <= n; i++) {
    if (column.get(i)! <= y) {
      strips.push(strip);
      strip = [];
      y = 0;
    } else y = column.get(i)!;
    strip.push(i);
  }
  strips.push(strip);
  return strips.map((s) => s.length);
};

export const BATCH_TWENTYONE_READINGS: Readonly<Record<string, Reading>> = {
  "IntegerPartition@PlanePartition": (p) =>
    list((JSON.parse(p) as number[][]).map((row) => row.reduce((sum, value) => sum + value, 0))),
  "CliqueSizePartition@LabeledGraph": (g) => list(maximalCliqueSizes(g)),
  "HorizontalStripSizes@StandardTableau": (t) => list(stripSizes(t)),
};

/** Each reading's FindStat map. */
export const BATCH_TWENTYONE_IDS: Readonly<Record<string, string>> = {
  "IntegerPartition@PlanePartition": "Mp00311",
  "CliqueSizePartition@LabeledGraph": "Mp00251",
  "HorizontalStripSizes@StandardTableau": "Mp00207",
};
