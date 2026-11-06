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

/** The monotone triangle: row k lists the columns where the first k rows sum to 1, and the rank is its entries' sum less C(n + 2, 3). */
const monotoneTriangleRank = (m: Matrix): number => {
  const n = m.length;
  const total = sum(
    indices(n).map((k) =>
      sum(
        indices(n)
          .filter((j) => sum(m.slice(0, k + 1).map((row) => row[j]!)) === 1)
          .map((j) => j + 1),
      ),
    ),
  );
  return total - ((n + 2) * (n + 1) * n) / 6;
};
/** FindStat's St000067: the products over every pair of nonzero entries with i > k and j < l. */
const inversionNumber = (m: Matrix): number => {
  const nonzero = indices(m.length).flatMap((i) =>
    indices(m.length)
      .filter((j) => m[i]![j] !== 0)
      .map((j) => [i, j]),
  );
  return sum(
    nonzero.flatMap(([i, j]) =>
      nonzero.filter(([k, l]) => i! > k! && j! < l!).map(([k, l]) => m[i!]![j!]! * m[k!]![l!]!),
    ),
  );
};
/** FindStat's St001981: the first z for which the z x z corner holds a nonzero entry, less 1. */
const cornerZeroSquare = (m: Matrix): number => {
  let z = 0;
  while (!indices(z).some((i) => indices(z).some((j) => m[i]![j] !== 0))) z++;
  return z - 1;
};

/** FindStat's St001965: the corner sum matrix is (n + 1) x (n + 1) with c[i][j] the sum of the first i rows and j columns. */
const decreasableCornerSums = (m: Matrix): number => {
  const n = m.length;
  const c = indices(n + 1).map((i) => indices(n + 1).map((j) => sum(m.slice(0, i).map((row) => sum(row.slice(0, j))))));
  let found = 0;
  for (let i = 1; i < n; i++)
    for (let j = 1; j < n; j++)
      if (
        c[i]![j] === c[i + 1]![j] &&
        c[i + 1]![j] === c[i]![j + 1] &&
        c[i]![j + 1] === c[i - 1]![j]! + 1 &&
        c[i - 1]![j]! + 1 === c[i]![j - 1]! + 1
      )
        found++;
  return found;
};
/** The permanent, summed over every permutation of the columns. */
const permanent = (m: Matrix): number => {
  const extend = (row: number, used: readonly number[]): number =>
    row === m.length
      ? 1
      : sum(
          indices(m.length)
            .filter((j) => !used.includes(j))
            .map((j) => m[row]![j]! * extend(row + 1, [...used, j])),
        );
  return extend(0, []);
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
  MaximalDiagonalNonzeroCount: (m) => Math.max(...diagonals(m).map((d) => d.filter((a) => a !== 0).length)),
  DistinctDiagonalSumCount: (m) => new Set(diagonals(m).map(sum)).size,
  NonzeroEntryCount: (m) => entries(m).filter((a) => a !== 0).length,
  MainDiagonalSum: (m) => sum(indices(m.length).map((i) => m[i]![i]!)),
  MinimalRowZeroCount: (m) => Math.min(...m.map((row) => row.filter((a) => a === 0).length)),
  TopLeftZeroSquareSize: cornerZeroSquare,
  AlternatingSignMatrixPosetRank: monotoneTriangleRank,
  MatrixInversionNumber: inversionNumber,
  PositiveMatrixInversionNumber: (m) => inversionNumber(m) - entries(m).filter((a) => a === -1).length,
  MatrixPermanent: permanent,
  DecreasableCornerSumPositions: decreasableCornerSums,
};
