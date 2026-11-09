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

/** The determinant by the Leibniz formula: the signed sum over the permutations of the products down the chosen entries. */
const determinant = (m: Matrix): number => {
  const n = m.length;
  const sign = (p: readonly number[]): number =>
    p.reduce((s, a, i) => s * p.slice(i + 1).reduce((t, b) => t * (a > b ? -1 : 1), 1), 1);
  const extend = (chosen: number[]): number =>
    chosen.length === n
      ? sign(chosen) * chosen.reduce((product, column, row) => product * m[row]![column]!, 1)
      : sum(
          indices(n)
            .filter((c) => !chosen.includes(c))
            .map((c) => extend([...chosen, c])),
        );
  return extend([]);
};
/** The rank by Gauss-Jordan elimination over exact fractions (a numerator and a denominator, as bigints). */
const rank = (m: Matrix): number => {
  type Fraction = readonly [bigint, bigint];
  const times = ([a, b]: Fraction, [c, d]: Fraction): Fraction => [a * c, b * d];
  const minus = ([a, b]: Fraction, [c, d]: Fraction): Fraction => [a * d - c * b, b * d];
  const over = ([a, b]: Fraction, [c, d]: Fraction): Fraction => (c < 0n ? [-a * d, -b * c] : [a * d, b * c]);
  const rows = m.map((row) => row.map((a): Fraction => [BigInt(a), 1n]));
  let found = 0;
  for (let column = 0; column < (m[0]?.length ?? 0); column++) {
    const pivot = rows.findIndex((row, i) => i >= found && row[column]![0] !== 0n);
    if (pivot < 0) continue;
    [rows[found], rows[pivot]] = [rows[pivot]!, rows[found]!];
    for (let i = found + 1; i < rows.length; i++) {
      const factor = over(rows[i]![column]!, rows[found]![column]!);
      rows[i] = rows[i]!.map((a, j) => minus(a, times(factor, rows[found]![j]!)));
    }
    found++;
  }
  return found;
};
/** FindStat's corner_sum_matrix: the sum of the first i rows and j columns, i, j from 0 to n. */
const cornerSums = (m: Matrix): number[][] =>
  indices(m.length + 1).map((i) =>
    indices(m.length + 1).map((j) => sum(m.slice(0, i).map((row) => sum(row.slice(0, j))))),
  );
/** FindStat's St001977: the interior positions where the corner sum can go down by one or up by one. */
const cornerSumDegree = (m: Matrix): number => {
  const c = cornerSums(m);
  const n = c.length;
  const at = (i: number, j: number): number => c[i]![j]!;
  let total = 0;
  for (let i = 1; i < n - 1; i++)
    for (let j = 1; j < n - 1; j++) {
      if (
        at(i, j) === at(i + 1, j) &&
        at(i, j) === at(i, j + 1) &&
        at(i, j) === at(i - 1, j) + 1 &&
        at(i, j) === at(i, j - 1) + 1
      )
        total++;
      if (
        at(i, j) === at(i - 1, j) &&
        at(i, j) === at(i, j - 1) &&
        at(i, j) === at(i + 1, j) - 1 &&
        at(i, j) === at(i, j + 1) - 1
      )
        total++;
    }
  return total;
};
/** FindStat's monotone triangle, rows from the longest: the columns holding a 1 in the column sums of the first n - k rows, descending. */
const monotoneTriangle = (m: Matrix): number[][] =>
  indices(m.length).map((k) =>
    indices(m.length)
      .filter((c) => sum(m.slice(0, m.length - k).map((row) => row[c]!)) === 1)
      .map((c) => c + 1)
      .toReversed(),
  );
/** FindStat's St000898: the last entry of a row is maximal when it equals the second last entry of the row above, or one less than the second last of its own row. */
const maximalLastDiagonal = (m: Matrix): number => {
  const rows = monotoneTriangle(m);
  return rows.filter((row, i) => {
    const last = row.at(-1)!;
    return (i >= 1 && last === rows[i - 1]!.at(-2)) || (i < rows.length - 1 && last === row.at(-2)! - 1);
  }).length;
};

export type Reading = (m: Matrix) => number;

export const ALTERNATING_SIGN_MATRIX_READINGS: Record<string, Reading> = {
  MatrixDeterminant: (m) => (m.length === 0 ? 1 : determinant(m)),
  AlternatingSignMatrixRank: rank,
  AlternatingSignMatrixCorank: (m) => m.length - rank(m),
  CornerSumLatticeDegree: cornerSumDegree,
  MonotoneTriangleMaximalLastDiagonalCount: maximalLastDiagonal,
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
