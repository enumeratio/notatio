// Readings for maps batch 17, after the Sage code FindStat states for each: Gelfand-Tsetlin patterns and semistandard
// tableaux (Mp00036, Mp00076, Mp00082, Mp00210 to Mp00213, Mp00075, Mp00107, Mp00225) and the insertion tableau of a
// parking function (Mp00302), as loops over mutable arrays. Same contract as map-findstat-readings.ts: FindStat's text
// in, FindStat's text out.

import type { Reading } from "./map-findstat-readings.ts";

const ints = (text: string): number[] => JSON.parse(text) as number[];
const rows = (text: string): number[][] => JSON.parse(text) as number[][];
const list = (items: readonly number[]): string => `[${items.join(",")}]`;
const range = (from: number, to: number): number[] =>
  Array.from({ length: Math.max(0, to - from + 1) }, (_, k) => from + k);
const rowsText = (items: readonly (readonly number[])[]): string => `[${items.map(list).join(",")}]`;

// --- Mp00036: the rows of the pattern from the bottom up, each row's entry growing the tableau's row j to that length ---

const tableauOfPattern = (pattern: readonly (readonly number[])[]): number[][] => {
  const tableau: number[][] = [];
  pattern.toReversed().forEach((row, i) => {
    for (let j = 0; j < row.length; j++) {
      const val = row[j]!;
      if (j >= tableau.length) {
        if (val === 0) break;
        tableau.push(Array.from({ length: val }, () => i + 1));
      } else tableau[j]!.push(...Array.from({ length: val - tableau[j]!.length }, () => i + 1));
    }
  });
  return tableau;
};

// --- Mp00076, Mp00082, and the way back from the tableau in Mp00210 to Mp00213: the shapes of the entries at most k ---

const patternOfTableau = (tableau: readonly (readonly number[])[], width: number): number[][] =>
  range(1, width)
    .toReversed()
    .map((k) => range(1, k).map((j) => (tableau[j - 1] ?? []).filter((x) => x <= k).length));

// --- Mp00210, Mp00211: promotion by jeu de taquin ---

/** Remove the entries equal to `m`, slide the rest outward into each hole, leftmost hole first, and fill the origin with 0; add one. */
const promotion = (tableau: readonly (readonly number[])[], m: number): number[][] => {
  const t = tableau.map((row) => [...row]);
  const holes = t.flatMap((row, r) => row.flatMap((x, c) => (x === m ? [[r, c] as const] : [])));
  holes.sort(([r1, c1], [r2, c2]) => r2 - r1 || c1 - c2);
  for (let [r, c] of holes) {
    t[r]![c] = 0;
    for (;;) {
      const left = c > 0 ? t[r]![c - 1]! : 0;
      const up = r > 0 ? t[r - 1]![c]! : 0;
      if (left === 0 && up === 0) break;
      if (left > up) {
        t[r]![c] = left;
        c--;
      } else {
        t[r]![c] = up;
        r--;
      }
      t[r]![c] = 0;
    }
  }
  return t.map((row) => row.map((x) => x + 1));
};

/** Remove the entries equal to 1, slide the rest inward into each hole, rightmost hole first, and fill the rim with m + 1; subtract one. */
const inversePromotion = (tableau: readonly (readonly number[])[], m: number): number[][] => {
  const t = tableau.map((row) => [...row]);
  const holes = t.flatMap((row, r) => row.flatMap((x, c) => (x === 1 ? [[r, c] as const] : [])));
  holes.sort(([, c1], [, c2]) => c2 - c1);
  for (let [r, c] of holes) {
    t[r]![c] = m + 1;
    for (;;) {
      const right = t[r]![c + 1] ?? m + 1;
      const down = t[r + 1]?.[c] ?? m + 1;
      if (right > m && down > m) break;
      if (right < down) {
        t[r]![c] = right;
        c++;
      } else {
        t[r]![c] = down;
        r++;
      }
      t[r]![c] = m + 1;
    }
  }
  return t.map((row) => row.map((x) => x - 1));
};

// --- Mp00212, Mp00213: the crystal reflection s_i on the row reading word (bottom row first) ---

/** Pair each i + 1 with a later i, nested; the unmatched letters read i^a (i + 1)^b and become i^b (i + 1)^a. */
const reflected = (tableau: readonly (readonly number[])[], i: number): number[][] => {
  const t = tableau.map((row) => [...row]);
  const cells = t.flatMap((row, r) => row.map((_, c) => [r, c] as const));
  cells.sort(([r1, c1], [r2, c2]) => r2 - r1 || c1 - c2);
  const open: number[] = [];
  const matched = new Set<number>();
  cells.forEach(([r, c], k) => {
    const x = t[r]![c]!;
    if (x === i + 1) open.push(k);
    else if (x === i && open.length > 0) {
      matched.add(open.pop()!);
      matched.add(k);
    }
  });
  const free = cells.flatMap(([r, c], k) =>
    (t[r]![c] === i || t[r]![c] === i + 1) && !matched.has(k) ? [[r, c] as const] : [],
  );
  const ups = free.filter(([r, c]) => t[r]![c] === i + 1).length;
  free.forEach(([r, c], k) => {
    t[r]![c] = k < ups ? i : i + 1;
  });
  return t;
};
const cycled = (pattern: readonly (readonly number[])[], order: readonly number[]): number[][] => {
  let t = tableauOfPattern(pattern);
  for (const i of order) t = reflected(t, i);
  return patternOfTableau(t, pattern.length);
};

// --- Mp00075: the reading word, equal entries numbered left to right ---

const readingWord = (tableau: readonly (readonly number[])[]): number[] => {
  const cells = tableau.flatMap((row, r) => row.map((x, c) => ({ x, r, c })));
  const order = cells.toSorted((a, b) => a.x - b.x || a.c - b.c);
  const rank = (cell: { r: number; c: number }): number => order.findIndex((o) => o.r === cell.r && o.c === cell.c) + 1;
  return tableau.toReversed().flatMap((row, k) => row.map((_, c) => rank({ r: tableau.length - 1 - k, c })));
};

// --- Mp00107 and Mp00302: row insertion, an entry bumping the leftmost larger one ---

const insertionTableau = (word: readonly number[]): number[][] => {
  const t: number[][] = [];
  for (let x of word) {
    let placed = false;
    for (const row of t) {
      const at = row.findIndex((y) => y > x);
      if (at < 0) {
        row.push(x);
        placed = true;
        break;
      }
      [row[at], x] = [x, row[at]!];
    }
    if (!placed) t.push([x]);
  }
  return t;
};
/** The first row's entries column-inserted, largest first, into the rest: row-inserting the first row then the rest's reading word. */
const catabolism = (tableau: readonly (readonly number[])[]): number[][] =>
  tableau.length === 0 ? [] : insertionTableau([...tableau[0]!, ...tableau.slice(1).toReversed().flat()]);

// --- Mp00225: the weight, sorted ---

const sortedWeight = (tableau: readonly (readonly number[])[]): number[] => {
  const weight = new Map<number, number>();
  for (const x of tableau.flat()) weight.set(x, (weight.get(x) ?? 0) + 1);
  return [...weight.values()].toSorted((a, b) => b - a);
};

const widthOf = (pattern: readonly (readonly number[])[]): number => pattern.length;
const up = (m: number): number[] => range(1, m - 1);
const down = (m: number): number[] => range(1, m - 1).toReversed();
const maxEntry = (tableau: readonly (readonly number[])[]): number => Math.max(0, ...tableau.flat());

export const BATCH_SEVENTEEN_READINGS: Readonly<Record<string, Reading>> = {
  "SemistandardTableau@GelfandTsetlinPattern": (g) => rowsText(tableauOfPattern(rows(g))),
  "GelfandTsetlinPattern@SemistandardTableau": (t) => rowsText(patternOfTableau(rows(t), maxEntry(rows(t)))),
  "GelfandTsetlinPattern@StandardTableau": (t) => rowsText(patternOfTableau(rows(t), maxEntry(rows(t)))),
  "GelfandTsetlinPromotion@GelfandTsetlinPattern": (g) =>
    rowsText(patternOfTableau(promotion(tableauOfPattern(rows(g)), widthOf(rows(g))), widthOf(rows(g)))),
  "InverseGelfandTsetlinPromotion@GelfandTsetlinPattern": (g) =>
    rowsText(patternOfTableau(inversePromotion(tableauOfPattern(rows(g)), widthOf(rows(g))), widthOf(rows(g)))),
  "InverseGelfandTsetlinCycle@GelfandTsetlinPattern": (g) => rowsText(cycled(rows(g), up(widthOf(rows(g))))),
  "GelfandTsetlinCycle@GelfandTsetlinPattern": (g) => rowsText(cycled(rows(g), down(widthOf(rows(g))))),
  "ReadingWord@SemistandardTableau": (t) => list(readingWord(rows(t))),
  "Catabolism@SemistandardTableau": (t) => rowsText(catabolism(rows(t))),
  "TableauWeight@SemistandardTableau": (t) => list(sortedWeight(rows(t))),
  "RskInsertion@ParkingFunction": (p) => rowsText(insertionTableau(ints(p))),
};

/** Each reading's FindStat map. */
export const BATCH_SEVENTEEN_IDS: Readonly<Record<string, string>> = {
  "SemistandardTableau@GelfandTsetlinPattern": "Mp00036",
  "GelfandTsetlinPattern@SemistandardTableau": "Mp00076",
  "GelfandTsetlinPattern@StandardTableau": "Mp00082",
  "GelfandTsetlinPromotion@GelfandTsetlinPattern": "Mp00210",
  "InverseGelfandTsetlinPromotion@GelfandTsetlinPattern": "Mp00211",
  "InverseGelfandTsetlinCycle@GelfandTsetlinPattern": "Mp00212",
  "GelfandTsetlinCycle@GelfandTsetlinPattern": "Mp00213",
  "ReadingWord@SemistandardTableau": "Mp00075",
  "Catabolism@SemistandardTableau": "Mp00107",
  "TableauWeight@SemistandardTableau": "Mp00225",
  "RskInsertion@ParkingFunction": "Mp00302",
};
