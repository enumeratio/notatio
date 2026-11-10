// Readings for maps batch 20, after the Sage code FindStat states for each: the underlying and the Grassmann interval
// permutations of a decorated permutation (Mp00253, Mp00255, Mp00256), the Tanimoto operator (Mp00329), the Demazure
// product with the inverse (Mp00159), the Lewis-Lyu-Pylyavskyy-Sen shape (Mp00204) and weak order rowmotion
// (Mp00326). Same contract as map-findstat-readings.ts: FindStat's text in, FindStat's text out.

import type { Reading } from "./map-findstat-readings.ts";

const ints = (text: string): number[] => JSON.parse(text) as number[];
const list = (items: readonly number[]): string => `[${items.join(",")}]`;
const range = (from: number, to: number): number[] =>
  Array.from({ length: Math.max(0, to - from + 1) }, (_, k) => from + k);

/** Sage's list of a decorated permutation: a fixed point decorated `-` is negated, one decorated `+` stays. */
const decorated = (text: string): number[] =>
  text
    .slice(1, -1)
    .split(",")
    .filter((entry) => entry !== "")
    .map((entry, k) => (entry === "+" ? k + 1 : entry === "-" ? -(k + 1) : Number(entry)));

// --- Mp00253: the underlying permutation ---

const underlying = (text: string): string => list(decorated(text).map(Math.abs));

// --- Mp00255, Mp00256: the Grassmann interval [u, v] of the decorated permutation ---

const grassmannInterval = (text: string): [number[], number[]] => {
  const x = decorated(text);
  const pi = x.map(Math.abs);
  const n = pi.length;
  const inverse = Array<number>(n + 1).fill(0);
  pi.forEach((value, k) => (inverse[value] = k + 1));
  const anti: number[] = [];
  for (let i = 1; i <= n; i++) if (i < inverse[i]! || x[i - 1] === i) anti.push(inverse[i]!);
  const u1: number[] = [];
  const u2: number[] = [];
  const v1: number[] = [];
  const v2: number[] = [];
  for (let i = 1; i <= n; i++) {
    if (anti.includes(i)) {
      v1.push(i);
      u1.push(Math.abs(x[i - 1]!));
    } else {
      v2.push(i);
      u2.push(Math.abs(x[i - 1]!));
    }
  }
  return [u1.concat(u2), v1.concat(v2)];
};

// --- Mp00329: Tanimoto's operator ---

const tanimoto = (text: string): string => {
  const pi = ints(text);
  const n = pi.length;
  if (pi[0] === n) return list([...pi.slice(1, n).map((i) => i + 1), 1]);
  if (pi[n - 1] === n) return list([1, ...pi.slice(0, n - 1).map((i) => i + 1)]);
  return list(pi.map((i) => (i % n) + 1));
};

// --- Mp00159: π⁻¹ ⋆ π, the Demazure product: each letter of a reduced word of π multiplies on the right, and the
// product stays put when the letter would shorten it ---

const demazureWithInverse = (text: string): string => {
  const pi = ints(text);
  const n = pi.length;
  // A reduced word of π by bubble sort: sorting π by adjacent swaps, read backwards.
  const rest = [...pi];
  const word: number[] = [];
  for (let found = true; found;) {
    found = false;
    for (let i = 0; i + 1 < n; i++)
      if (rest[i]! > rest[i + 1]!) {
        [rest[i], rest[i + 1]] = [rest[i + 1]!, rest[i]!];
        word.push(i);
        found = true;
        break;
      }
  }
  word.reverse();
  const product = range(1, n).map((v) => pi.indexOf(v) + 1);
  for (const i of word)
    if (product[i]! < product[i + 1]!) [product[i], product[i + 1]] = [product[i + 1]!, product[i]!];
  return list(product);
};

// --- Mp00204: the conjugate of the increments of A'_k, the most ascent runs k disjoint subsequences of the word can total ---

const lewisLyuPylyavskyySenShape = (text: string): string => {
  const pi = ints(text).toReversed();
  const n = pi.length;
  const increasing = (u: readonly number[]): number => {
    const best: number[] = [];
    for (const value of u) {
      let at = best.findIndex((b) => b >= value);
      if (at < 0) at = best.length;
      best[at] = value;
    }
    return best.length;
  };
  const shape: number[] = [];
  let total = 0;
  for (let k = 1; k <= n; k++) {
    // Every composition of n into k parts, by its cut points.
    let a = 0;
    const cut = (parts: number, from: number, sum: number): void => {
      if (parts === 0) {
        if (from === n) a = Math.max(a, sum);
        return;
      }
      for (let to = from + 1; to <= n - (parts - 1); to++) cut(parts - 1, to, sum + increasing(pi.slice(from, to)));
    };
    cut(k, 0, 0);
    if (a === total) break;
    shape.push(a - total);
    total = a;
  }
  return list(shape);
};

// --- Mp00326: the reversal of the inverse of the Laguerre heap ---

const weakOrderRowmotion = (text: string): string => {
  const pi = ints(text);
  let buffer: number[] = [];
  let heap: number[][] = [];
  pi.forEach((value, i) => {
    if (i === 0 || pi[i - 1]! > value) buffer.push(value);
    else {
      heap.push(buffer.toReversed());
      buffer = [value];
    }
  });
  if (buffer.length > 0) heap.push(buffer.toReversed());
  heap.reverse();
  // Bubble sort the pieces.
  for (;;) {
    const i = range(0, heap.length - 2).find((j) => heap[j]![0]! > heap[j + 1]!.at(-1)!);
    if (i === undefined) break;
    [heap[i], heap[i + 1]] = [heap[i + 1]!, heap[i]!];
  }
  const sigma: number[] = [];
  while (heap.length > 0) {
    const m: number[][] = [];
    let taken = 0;
    for (const e of heap) {
      if (m.every((f) => Math.min(...e) >= Math.max(...f)) || m.every((f) => Math.max(...e) <= Math.min(...f))) {
        m.push(e);
        taken++;
      } else break;
    }
    heap = heap.slice(taken);
    for (const e of m.toSorted((a, b) => Math.min(...a) - Math.min(...b))) sigma.push(...e.toReversed());
  }
  return list(sigma.toReversed());
};

export const BATCH_TWENTY_READINGS: Readonly<Record<string, Reading>> = {
  "Permutation@DecoratedPermutation": underlying,
  "LowerGrassmannPermutation@DecoratedPermutation": (text) => list(grassmannInterval(text)[0]),
  "UpperGrassmannPermutation@DecoratedPermutation": (text) => list(grassmannInterval(text)[1]),
  "Tanimoto@Permutation": tanimoto,
  "DemazureProductWithInverse@Permutation": demazureWithInverse,
  "LewisLyuPylyavskyySenShape@Permutation": lewisLyuPylyavskyySenShape,
  "WeakOrderRowmotion@Permutation": weakOrderRowmotion,
};

/** Each reading's FindStat map. */
export const BATCH_TWENTY_IDS: Readonly<Record<string, string>> = {
  "Permutation@DecoratedPermutation": "Mp00253",
  "LowerGrassmannPermutation@DecoratedPermutation": "Mp00255",
  "UpperGrassmannPermutation@DecoratedPermutation": "Mp00256",
  "Tanimoto@Permutation": "Mp00329",
  "DemazureProductWithInverse@Permutation": "Mp00159",
  "LewisLyuPylyavskyySenShape@Permutation": "Mp00204",
  "WeakOrderRowmotion@Permutation": "Mp00326",
};
