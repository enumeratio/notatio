// The rank of a matrix of JavaScript values. The compiled code of `MatrixRank` inlines this function's
// text (`MATRIX_RANK_SOURCE`), so it names nothing outside itself (only globals), and the lowering and
// the kernel cannot differ.
//
// Integers (numbers or bigints) are eliminated exactly, fraction-free (Bareiss: every entry stays an
// integer, each division by the previous pivot being exact), so a matrix of integers or of scaled
// rationals gets its exact rank. A matrix with any non-integer entry is a float one: Gaussian
// elimination with partial pivoting, a column counting as a pivot only above
// `max(rows, columns) * epsilon * largest |entry|` (the tolerance of a numerical rank, and the only
// place one is used). A non-finite entry or a ragged or empty argument throws: the rank is not defined.
export function matrixRank(m: readonly unknown[]): number {
  if (!Array.isArray(m) || m.length === 0) throw new TypeError("MatrixRank needs a matrix");
  const a = (Array.isArray(m[0]) ? m : [m]) as unknown[][];
  const columns = a[0].length;
  if (columns === 0 || a.some((row) => !Array.isArray(row) || row.length !== columns))
    throw new TypeError("MatrixRank needs a rectangular matrix");
  let exact = true;
  for (const row of a)
    for (const x of row) {
      if (typeof x === "bigint") continue;
      if (typeof x !== "number" || !Number.isFinite(x)) throw new RangeError("MatrixRank needs finite numbers");
      if (!Number.isInteger(x)) exact = false;
    }
  let rank = 0;
  if (exact) {
    const b = a.map((row) => row.map((x) => BigInt(x as bigint | number)));
    let previous = 1n;
    for (let c = 0; c < columns && rank < b.length; c++) {
      let p = rank;
      while (p < b.length && b[p][c] === 0n) p++;
      if (p === b.length) continue;
      [b[rank], b[p]] = [b[p], b[rank]];
      for (let i = rank + 1; i < b.length; i++) {
        for (let j = c + 1; j < columns; j++) b[i][j] = (b[rank][c] * b[i][j] - b[i][c] * b[rank][j]) / previous;
        b[i][c] = 0n;
      }
      previous = b[rank][c];
      rank++;
    }
    return rank;
  }
  const f = a.map((row) => row.map((x) => Number(x)));
  const scale = Math.max(...f.map((row) => Math.max(...row.map(Math.abs))));
  const tolerance = Math.max(f.length, columns) * Number.EPSILON * scale;
  for (let c = 0; c < columns && rank < f.length; c++) {
    let p = rank;
    for (let i = rank + 1; i < f.length; i++) if (Math.abs(f[i][c]) > Math.abs(f[p][c])) p = i;
    if (Math.abs(f[p][c]) <= tolerance) continue;
    [f[rank], f[p]] = [f[p], f[rank]];
    for (let i = rank + 1; i < f.length; i++) {
      const factor = f[i][c] / f[rank][c];
      for (let j = c; j < columns; j++) f[i][j] -= factor * f[rank][j];
    }
    rank++;
  }
  return rank;
}

/** The function as source text: a function expression that needs nothing but globals. */
export const MATRIX_RANK_SOURCE = `(${matrixRank.toString()})`;
