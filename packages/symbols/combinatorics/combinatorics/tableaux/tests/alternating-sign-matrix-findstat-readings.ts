// Independent readings of the alternating-sign-matrix statistics adopted from FindStat, written
// against FindStat's own code (the diagonals it walks, the rows and columns it scans) rather than
// against the expressions. A matrix is its rows.

export type Matrix = readonly (readonly number[])[];

const sum = (a: readonly number[]): number => a.reduce((x, y) => x + y, 0);
const indices = (n: number): number[] => Array.from({ length: n }, (_, i) => i);
const entries = (m: Matrix): number[] => m.flat();
const columnOf = (m: Matrix, c: number): number[] => m.map((row) => row[c]!);
/** FindStat's diagonals: for k = 1 .. 2n - 1, the entries P[n - k + j][j] for j from max(0, k - n) to min(k, n) - 1. */
const diagonals = (m: Matrix): number[][] => {
  const n = m.length;
  return indices(2 * n - 1).map((k0) => {
    const k = k0 + 1;
    const from = Math.max(0, k - n);
    return indices(Math.min(k, n) - from).map((t) => m[n - k + from + t]![from + t]!);
  });
};

export type Reading = (m: Matrix) => number;

export const ALTERNATING_SIGN_MATRIX_READINGS: Record<string, Reading> = {
  NegativeOneCount: (m) => entries(m).filter((a) => a === -1).length,
  PositiveOneCount: (m) => entries(m).filter((a) => a === 1).length,
  OnesOnMainDiagonal: (m) => indices(m.length).filter((i) => m[i]![i] === 1).length,
  ZerosOnMainDiagonal: (m) => indices(m.length).filter((i) => m[i]![i] === 0).length,
  // The unique 1 of a boundary row or column, 1-based.
  FirstRowOnePosition: (m) => m[0]!.indexOf(1) + 1,
  FirstColumnOnePosition: (m) => columnOf(m, 0).indexOf(1) + 1,
  LastRowOnePosition: (m) => m[m.length - 1]!.indexOf(1) + 1,
  LastColumnOnePosition: (m) => columnOf(m, m.length - 1).indexOf(1) + 1,
  MaximalDiagonalSum: (m) => Math.max(...diagonals(m).map(sum)),
};
