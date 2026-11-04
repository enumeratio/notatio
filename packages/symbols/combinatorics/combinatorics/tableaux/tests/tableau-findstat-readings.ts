// Independent readings of the standard-tableau statistics adopted from FindStat, written against
// FindStat's definitions (cell coordinates, the scans its code makes) rather than against the
// expressions.

type Tableau = readonly (readonly number[])[];

const sum = (a: readonly number[]): number => a.reduce((x, y) => x + y, 0);
const size = (t: Tableau): number => sum(t.map((row) => row.length));

/** The 0-based (row, column) of each entry. */
function cells(t: Tableau): Map<number, [number, number]> {
  const found = new Map<number, [number, number]>();
  for (const [r, row] of t.entries()) for (const [c, entry] of row.entries()) found.set(entry, [r, c]);
  return found;
}

/** The conjugate: the columns, read top to bottom. */
const columns = (t: Tableau): number[][] =>
  Array.from({ length: Math.max(0, ...t.map((row) => row.length)) }, (_, c) =>
    t.filter((row) => row.length > c).map((row) => row[c]!),
  );

const entriesWithSuccessor = (t: Tableau): number[] =>
  Array.from({ length: Math.max(0, size(t) - 1) }, (_, i) => i + 1);

/** The descents: entries whose successor is in a strictly lower row. */
const descents = (t: Tableau): number[] => {
  const where = cells(t);
  return entriesWithSuccessor(t).filter((e) => where.get(e + 1)![0] > where.get(e)![0]);
};

/** FindStat's scan: from the top, the first row holding e or e + 1 settles it, and e + 1 first is a natural descent. */
const naturalDescents = (t: Tableau): number[] =>
  entriesWithSuccessor(t).filter((e) => {
    for (const row of t) {
      if (row.includes(e)) return false;
      if (row.includes(e + 1)) return true;
    }
    return false;
  });

export const TABLEAU_READINGS: Record<string, (t: Tableau) => number> = {
  // The first row whose largest entry beats those above it is the one holding n.
  RowOfLargestEntry: (t) => {
    let found = 0;
    let best = -1;
    for (const [r, row] of t.entries())
      if (Math.max(...row) > best) {
        found = r + 1;
        best = Math.max(...row);
      }
    return found;
  },
  LastEntryInFirstRow: (t) => t[0]?.at(-1) ?? 0,
  // FindStat's scan: walk down the diagonal until a row is too short.
  LastEntryOnMainDiagonal: (t) => {
    let last = 0;
    for (const [i, row] of t.entries()) {
      if (i >= row.length) break;
      last = row[i]!;
    }
    return last;
  },
  FirstEntryInLastRow: (t) => t.at(-1)?.[0] ?? 0,
  // FindStat's count: consecutive values side by side in a row, and in a row of the conjugate.
  AdjacentSuccessorCount: (t) =>
    [...t, ...columns(t)].reduce((total, row) => total + row.slice(1).filter((f, i) => row[i]! + 1 === f).length, 0),
  PathLengthToLargestEntry: (t) => {
    const where = cells(t).get(size(t));
    return where === undefined ? 0 : where[0] + where[1];
  },
  // FindStat's scan: the first row whose first entry exceeds its number ends the run.
  FirstColumnInitialSequenceLength: (t) => {
    let i = 0;
    for (const [r, row] of t.entries()) {
      i = r + 1;
      if (row[0]! > i) return i - 1;
    }
    return i;
  },
  ModularMajorIndex: (t) => (size(t) === 0 ? 0 : sum(descents(t)) % size(t)),
  NaturalDescentCount: (t) => naturalDescents(t).length,
  NaturalMajorIndex: (t) => sum(naturalDescents(t)),
};
