// Independent readings of the semistandard-tableau statistics adopted from FindStat, written against the
// rows of the tableau as FindStat's Sage code reads them (rows of T, T[row][column] counted from 0)
// rather than against the expressions. The empty tableau has no entries and every reading gives 0.

export type Rows = readonly (readonly number[])[];

const sum = (a: readonly number[]): number => a.reduce((x, y) => x + y, 0);

/** Whether `t` is a semistandard tableau: positive entries, rows weakly and columns strictly increasing. */
const isSemistandard = (t: Rows): boolean =>
  t.every((row, r) =>
    row.every(
      (entry, c) => entry >= 1 && (c === 0 || row[c - 1]! <= entry) && (r === 0 || (t[r - 1]![c] ?? Infinity) < entry),
    ),
  );

/** `t` with the entry at (row, column) replaced by `entry`. */
const replaced = (t: Rows, row: number, column: number, entry: number): Rows =>
  t.map((r, i) => (i === row ? r.map((e, j) => (j === column ? entry : e)) : r));

/** The standardization: the cells numbered 1 .. n by entry, equal entries from left to right. */
function standardization(t: Rows): number[][] {
  const cells = t.flatMap((row, r) => row.map((entry, c) => ({ entry, r, c })));
  const order = cells.toSorted((a, b) => a.entry - b.entry || a.c - b.c);
  return t.map((row, r) => row.map((_, c) => order.findIndex((cell) => cell.r === r && cell.c === c) + 1));
}

/** The major index of a word: the sum of the positions, counted from 1, of its descents. */
const majorIndexOf = (word: readonly number[]): number =>
  word.reduce((total, letter, i) => (i + 1 < word.length && letter > word[i + 1]! ? total + i + 1 : total), 0);

/** The segments as FindStat's code finds them: the first column of each value, in each row, other than the row's own number. */
function segmentStarts(t: Rows): Map<string, number> {
  const starts = new Map<string, number>();
  t.forEach((row, r) =>
    row.forEach((_, c) => {
      for (let j = 0; j <= c; j++) {
        const key = `${r},${row[j]}`;
        if (row[j] !== r + 1 && !starts.has(key)) starts.set(key, j);
      }
    }),
  );
  return starts;
}

/** The flush statistic, transliterated from FindStat's Sage code. */
function flush(t: Rows): number {
  const segments = [...segmentStarts(t)].map(([key, start]) => {
    const [r, k] = key.split(",").map(Number) as [number, number];
    return { r, k, start };
  });
  let f = 0;
  for (const s of segments) {
    const below = t[s.r + 1];
    if (s.r !== t.length - 1 && s.start === below!.length && below![below!.length - 1]! <= s.k) f++;
    if (s.r === t.length - 1 && s.start === 0) f++;
    else
      for (const other of segments)
        if (s.r + 1 === other.r && s.start === other.start) {
          if (s.start >= 1 && below![s.start] !== below![s.start - 1]) f++;
          if (s.start < 1 && below![s.start] !== s.r + 2) f++;
        }
  }
  return f;
}

/** The overlap, as FindStat's code counts it: rows as long as the first, from the bottom up, whose first entry is at least the first row's last. */
function overlap(t: Rows): number {
  if (t.length === 0) return 0;
  const width = t[0]!.length;
  let d = 0;
  while (d < t.length && t[d]!.length === width && t[0]![width - 1]! <= t[t.length - 1 - d]![0]!) d++;
  return d;
}

const diagonal = (t: Rows): number[] => {
  const entries: number[] = [];
  for (let i = 0; i < t.length && i < t[i]!.length; i++) entries.push(t[i]![i]!);
  return entries;
};

/** The entries that stay semistandard under no replacement by `entry + step`. */
const stuck = (t: Rows, step: number): number =>
  t.flatMap((row, r) => row.filter((entry, c) => !isSemistandard(replaced(t, r, c, entry + step)))).length;

export const SEMISTANDARD_TABLEAU_READINGS: Record<string, (t: Rows) => number> = {
  EntrySum: (t) => sum(t.flat()),
  RowReducedEntrySum: (t) => sum(t.flatMap((row, i) => row.map((entry) => entry - (i + 1)))),
  StandardizedMajorIndex: (t) => majorIndexOf(standardization(t).toReversed().flat()),
  Trace: (t) => sum(diagonal(t)),
  SegmentCount: (t) => segmentStarts(t).size,
  FlushSegmentCount: flush,
  LastEntryInFirstRow: (t) => t[0]?.at(-1) ?? 0,
  LastEntryOnMainDiagonal: (t) => diagonal(t).at(-1) ?? 0,
  FirstEntryInLastRow: (t) => t.at(-1)?.[0] ?? 0,
  DistinctEntryCount: (t) => new Set(t.flat()).size,
  MinimalEntryCount: (t) => stuck(t, -1),
  MaximalEntryCount: (t) => stuck(t, 1),
  LargestEntry: (t) => Math.max(0, ...t.flat()),
  SmallestEntry: (t) => t[0]?.[0] ?? 0,
  CylindricalTableauOverlap: overlap,
};
