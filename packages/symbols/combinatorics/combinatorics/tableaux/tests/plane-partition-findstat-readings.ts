// Independent readings of the plane-partition statistics adopted from FindStat, written against
// FindStat's own code and titles (the loops it runs, the plane partition it checks a box against)
// rather than against the expressions. A plane partition is its rows.

export type Plane = readonly (readonly number[])[];

const sum = (a: readonly number[]): number => a.reduce((x, y) => x + y, 0);
const entries = (p: Plane): number[] => p.flat();
const count = (a: readonly number[], value: number): number => a.filter((e) => e === value).length;

/** The array padded with zeros to a rectangle, so a lowered entry that reaches 0 is just a missing box. */
const grid = (p: Plane): number[][] => p.map((row) => Array.from({ length: p[0]!.length }, (_, j) => row[j] ?? 0));
/** The entries weakly decrease along every row and down every column. */
const decreases = (m: readonly (readonly number[])[]): boolean =>
  m.every((row, i) =>
    row.every(
      (entry, j) => (j + 1 >= row.length || row[j + 1]! <= entry) && (i + 1 >= m.length || m[i + 1]![j]! <= entry),
    ),
  );
/** FindStat's St001445: the boxes that can be removed so that the result is a plane partition. */
const removableBoxes = (p: Plane): number =>
  p
    .flatMap((row, i) => row.map((_, j) => [i, j] as const))
    .filter(([i, j]) =>
      decreases(grid(p).map((row, r) => row.map((entry, c) => (r === i && c === j ? entry - 1 : entry)))),
    ).length;
/** FindStat's St001451: the largest s with the first s diagonal cells present and the d-th entry at least d. */
const cubeSide = (p: Plane): number => {
  let s = 0;
  while (s < p.length && s < p[s]!.length && s < p[s]![s]!) s++;
  return s;
};
/** FindStat's St001449. */
const missingPart = (p: Plane): number => {
  const present = new Set(entries(p));
  let i = 1;
  while (present.has(i)) i++;
  return i;
};

/** FindStat's St001921: for each row, with a row of one zero added, and each entry, with a zero added, a box can go there when it is below its left and upper neighbors. */
const addableBoxes = (p: Plane): number => {
  let total = 0;
  [...p, [0]].forEach((row, i) => {
    [...row, 0].forEach((entry, j) => {
      const left = j === 0 ? undefined : row[j - 1];
      const above = i === 0 || p[i - 1]!.length === j ? undefined : p[i - 1]![j];
      if ((left === undefined || entry < left) && (above === undefined || entry < above)) total++;
    });
  });
  return total;
};

export const PLANE_PARTITION_READINGS: Record<string, (p: Plane) => number> = {
  // St001598: the cells (row, column, level) of the stack of boxes, counted from 0, and the largest coordinate sum.
  MaximalCellDistance: (p) =>
    Math.max(...p.flatMap((row, i) => row.flatMap((height, j) => Array.from({ length: height }, (_, k) => i + j + k)))),
  AddableBoxCount: (p) => (p.length === 0 ? 1 : addableBoxes(p)),
  LargestPart: (p) => p[0]![0]!,
  Trace: (p) => sum(p.flatMap((row, i) => (row.length > i ? [row[i]!] : []))),
  BoxCount: (p) => sum(p.map(sum)),
  RemovableBoxCount: removableBoxes,
  RowCount: (p) => p.length,
  ColumnCount: (p) => p[0]!.length,
  OddParts: (p) => entries(p).filter((e) => e % 2 === 1).length,
  EvenParts: (p) => entries(p).filter((e) => e % 2 === 0).length,
  SmallestMissingPart: missingPart,
  DurfeeCube: cubeSide,
  DistinctParts: (p) => new Set(entries(p)).size,
  PartRange: (p) => Math.max(...entries(p)) - Math.min(...entries(p)),
  LargestRepeatedPart: (p) => Math.max(0, ...entries(p).filter((e) => count(entries(p), e) > 1)),
  FirstRowSum: (p) => sum(p[0]!),
  MultiplicityOfSmallestPart: (p) => count(entries(p), Math.min(...entries(p))),
  AmbientCubeSize: (p) => Math.max(p.length, p[0]!.length, p[0]![0]!),
  PartCount: (p) => sum(p.map((row) => row.length)),
  ConjugateTrace: (p) => sum(p.map((row, i) => row.filter((e) => e >= i + 1).length)),
};
