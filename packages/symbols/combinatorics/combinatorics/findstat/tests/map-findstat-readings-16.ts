// Readings for maps batch 16 (alternating sign matrices), each after the Sage code FindStat states, as a loop over
// mutable arrays: the semistandard tableau of the monotone triangle (Mp00001), the left key (Mp00002), the Dyck path of
// the triangle's last diagonal (Mp00007), the link pattern of the fully packed loop and its Dyck path (Mp00098,
// Mp00333), the diagonal height Dyck path (Mp00334), and the Dyck path as an alternating sign matrix (Mp00035,
// Mp00137). Same contract as map-findstat-readings.ts: FindStat's text in, FindStat's text out.

import type { Reading } from "./map-findstat-readings.ts";

const ints = (text: string): number[] => JSON.parse(text) as number[];
const list = (items: readonly number[]): string => `[${items.join(",")}]`;
const rows = (text: string): number[][] => JSON.parse(text) as number[][];
const rowsText = (matrix: readonly (readonly number[])[]): string => `[${matrix.map(list).join(",")}]`;
const range = (from: number, to: number): number[] =>
  Array.from({ length: Math.max(0, to - from + 1) }, (_, k) => from + k);
const transpose = (matrix: readonly (readonly number[])[]): number[][] =>
  matrix.length === 0 ? [] : matrix[0]!.map((_, c) => matrix.map((row) => row[c]!));

/** Row k of the monotone triangle: the columns whose sum over the first k rows is 1, increasing. */
const monotoneTriangle = (matrix: readonly (readonly number[])[]): number[][] => {
  const n = matrix.length;
  const sums = range(1, n).map(() => 0);
  const triangle: number[][] = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) sums[c]! += matrix[r]![c]!;
    triangle.push(range(1, n).filter((c) => sums[c - 1] === 1));
  }
  return triangle;
};

// --- Mp00001: row i of the tableau holds k as often as the i-th part n + 1 - (i-th entry) grows from row k - 1 to k ---

const semistandardTableau = (matrix: readonly (readonly number[])[]): number[][] => {
  const n = matrix.length;
  const triangle = monotoneTriangle(transpose(matrix));
  const tableau: number[][] = [];
  for (let i = 0; i < n; i++) {
    const row: number[] = [];
    for (let k = i; k < n; k++) {
      const before = k > i ? n + 1 - triangle[k - 1]![i]! : 0;
      for (let copies = n + 1 - triangle[k]![i]! - before; copies > 0; copies--) row.push(k + 1);
    }
    tableau.push(row);
  }
  return tableau;
};

// --- Mp00002: the left key, from the columns of the tableau by Willis's scan to the left ---

const leftKeyPermutation = (matrix: readonly (readonly number[])[]): number[] => {
  const n = matrix.length;
  const tableau = semistandardTableau(matrix);
  const columns = range(0, n - 1).map((j) => tableau.filter((row) => row.length > j).map((row) => row[j]!));
  // Column j of the key: its entries each slide left through the columns before, taking from the bottom the largest
  // unused entry that does not exceed them.
  const key = columns.map((_, j) => {
    let current = columns[j]!;
    for (let t = j - 1; t >= 0; t--) {
      const next = [...current];
      const used = new Set<number>();
      for (let i = current.length - 1; i >= 0; i--) {
        const pick = Math.max(...columns[t]!.filter((y) => y <= current[i]! && !used.has(y)));
        used.add(pick);
        next[i] = pick;
      }
      current = next.toSorted((a, b) => a - b);
    }
    return current;
  });
  // The entry dropped between consecutive key columns, read last to first.
  const dropped = key.map((column, j) => column.find((y) => !(key[j + 1] ?? []).includes(y))!);
  return dropped.toReversed();
};

// --- Mp00007: the parking function n + 1 - (largest entry of each row), its Dyck word reversed and complemented ---

const parkingFunctionDyckPath = (matrix: readonly (readonly number[])[]): number[] => {
  const n = matrix.length;
  const parking = monotoneTriangle(matrix).map((row) => n + 1 - Math.max(...row));
  const word: number[] = [];
  for (let value = 1; value <= n; value++) {
    for (const p of parking) if (p === value) word.push(1);
    word.push(0);
  }
  return word.toReversed().map((step) => 1 - step);
};

// --- Mp00334: heights H[i, j] = i + j - 2 (corner sum of the transpose), read along the diagonals ---

const diagonalHeightDyckPath = (matrix: readonly (readonly number[])[]): number[] => {
  const n = matrix.length;
  const flipped = transpose(matrix);
  const heights: number[][] = [];
  for (let i = 0; i <= n; i++) {
    heights.push([]);
    for (let j = 0; j <= n; j++) {
      let corner = 0;
      for (let a = 0; a < i; a++) for (let b = 0; b < j; b++) corner += flipped[a]![b]!;
      heights[i]!.push(i + j - 2 * corner);
    }
  }
  const sequence: number[] = [];
  for (let i = 0; i <= n; i++) for (const j of [i, i + 1]) if (j <= n) sequence.push(heights[i]![j]!);
  return sequence.slice(1).map((height, k) => (height > sequence[k]! ? 1 : 0));
};

// --- Mp00098: the fully packed loop of the matrix, its boundary points numbered clockwise from the top left ---

/** The link pattern as pairs: an edge of the loop lies on the grid where its partial sum and position have the parity
 *  the six-vertex model gives (rows: sum + i + j even; columns: odd), and each path leaves where it ends. */
const linkPattern = (matrix: readonly (readonly number[])[]): [number, number][] => {
  const n = matrix.length;
  const across = (i: number, j: number): boolean => {
    let sum = 0;
    for (let c = 0; c < j; c++) sum += matrix[i - 1]![c]!;
    return (sum + i + j) % 2 === 0;
  };
  const down = (i: number, j: number): boolean => {
    let sum = 0;
    for (let r = 0; r < i; r++) sum += matrix[r]![j - 1]!;
    return (sum + i + j) % 2 === 1;
  };
  type Edge = ["H" | "V", number, number];
  const occupied = (edge: Edge): boolean => (edge[0] === "H" ? across(edge[1], edge[2]) : down(edge[1], edge[2]));
  const ring: Edge[] = [
    ...range(1, n).map((j): Edge => ["V", 0, j]),
    ...range(1, n).map((i): Edge => ["H", i, n]),
    ...range(1, n).map((j): Edge => ["V", n, n + 1 - j]),
    ...range(1, n).map((i): Edge => ["H", n + 1 - i, 0]),
  ].filter(occupied);
  const same = (a: Edge, b: Edge): boolean => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
  const label = (edge: Edge): number => ring.findIndex((e) => same(e, edge)) + 1;
  const walk = (start: Edge): Edge => {
    let [row, column] = start[0] === "V" ? [start[1] === 0 ? 1 : n, start[2]] : [start[1], start[2] === 0 ? 1 : n];
    let came = start;
    for (;;) {
      const around: Edge[] = [
        ["H", row, column - 1],
        ["H", row, column],
        ["V", row - 1, column],
        ["V", row, column],
      ];
      const next = around.filter((e) => occupied(e) && !same(e, came))[0]!;
      if (label(next) > 0) return next;
      if (next[0] === "H") column = next[2] === column ? column + 1 : column - 1;
      else row = next[1] === row ? row + 1 : row - 1;
      came = next;
    }
  };
  const pairs: [number, number][] = [];
  for (const edge of ring) {
    const a = label(edge);
    const b = label(walk(edge));
    if (a < b) pairs.push([a, b]);
  }
  return pairs.toSorted((p, q) => p[0] - q[0]);
};

// --- Mp00333: the vertices (points 2v - 1 and 2v) joined along the arcs; v opens 1 then closes as many times as its
// block has elements if it is the block's largest vertex ---

const linkPatternDyckPath = (matrix: readonly (readonly number[])[]): number[] => {
  const n = matrix.length;
  const root = range(0, n - 1);
  const find = (x: number): number => (root[x] === x ? x : find(root[x]!));
  for (const [a, b] of linkPattern(matrix)) {
    const x = find(Math.floor((a - 1) / 2));
    const y = find(Math.floor((b - 1) / 2));
    if (x !== y) root[Math.max(x, y)] = Math.min(x, y);
  }
  const word: number[] = [];
  for (let v = 0; v < n; v++) {
    const block = range(0, n - 1).filter((u) => find(u) === find(v));
    word.push(1);
    if (Math.max(...block) === v) for (let k = 0; k < block.length; k++) word.push(0);
  }
  return word;
};

// --- Mp00035: the path's parking function n + 1 - p gives the first entry of each row of a monotone triangle ---

const alternatingSignMatrixOfDyckPath = (path: readonly number[]): number[][] => {
  const n = path.length / 2;
  // The reversed complement's i-th up step falls in block (its position among the downs) + 1.
  const reversed = path.toReversed().map((step) => 1 - step);
  const parking: number[] = [];
  let block = 1;
  for (const step of reversed) {
    if (step === 1) parking.push(block);
    else block++;
  }
  const first = parking.map((p) => n + 1 - p);
  // Rows of the triangle, longest first: row i holds first[i] and then length - 1, ..., 1.
  const triangle = range(0, n - 1).map((i) => {
    const length = n - i;
    return range(0, length - 1).map((j) => (j === 0 ? first[i]! : length - j));
  });
  const matrix: number[][] = [];
  let previous = range(1, n).map(() => 0);
  for (const row of triangle.toReversed()) {
    const indicator = range(1, n).map((c) => (row.includes(c) ? 1 : 0));
    matrix.push(indicator.map((x, c) => x - previous[c]!));
    previous = indicator;
  }
  return matrix;
};

// --- Mp00137: ones along the antidiagonal under each peak, minus ones along the one under each valley ---

const symmetricAlternatingSignMatrix = (path: readonly number[]): number[][] => {
  const n = path.length / 2;
  const matrix = range(1, n).map(() => range(1, n).map(() => 0));
  const heights = [0];
  for (const step of path) heights.push(heights.at(-1)! + (step === 1 ? 1 : -1));
  const count = (prefix: readonly number[], value: number): number => prefix.filter((s) => s === value).length;
  for (let p = 0; p + 1 < path.length; p++) {
    if (path[p] === 1 && path[p + 1] === 0) {
      const [i, j] = [count(path.slice(0, p), 1), count(path.slice(0, p), 0)];
      for (let k = 0; k <= heights[p]!; k++) matrix[i - k]![j + k] = 1;
    }
  }
  for (let v = 0; v + 1 < path.length; v++) {
    if (path[v] === 0 && path[v + 1] === 1) {
      const [i, j] = [count(path.slice(0, v + 1), 1), count(path.slice(0, v + 1), 0)];
      for (let k = 0; k < heights[v + 1]!; k++) matrix[i - k - 1]![j + k] = -1;
    }
  }
  return matrix;
};

export const BATCH_SIXTEEN_READINGS: Readonly<Record<string, Reading>> = {
  "SemistandardTableau@AlternatingSignMatrix": (a) => rowsText(semistandardTableau(rows(a))),
  "LeftKeyPermutation@AlternatingSignMatrix": (a) => list(leftKeyPermutation(rows(a))),
  "DyckPath@AlternatingSignMatrix": (a) => list(parkingFunctionDyckPath(rows(a))),
  "DiagonalHeightDyckPath@AlternatingSignMatrix": (a) => list(diagonalHeightDyckPath(rows(a))),
  "PerfectMatching@AlternatingSignMatrix": (a) =>
    `[${linkPattern(rows(a))
      .map(([x, y]) => `(${x},${y})`)
      .join(",")}]`,
  "LinkPatternDyckPath@AlternatingSignMatrix": (a) => list(linkPatternDyckPath(rows(a))),
  "AlternatingSignMatrix@DyckPath": (d) => rowsText(alternatingSignMatrixOfDyckPath(ints(d))),
  "SymmetricAlternatingSignMatrix@DyckPath": (d) => rowsText(symmetricAlternatingSignMatrix(ints(d))),
};

/** Each reading's FindStat map. */
export const BATCH_SIXTEEN_IDS: Readonly<Record<string, string>> = {
  "SemistandardTableau@AlternatingSignMatrix": "Mp00001",
  "LeftKeyPermutation@AlternatingSignMatrix": "Mp00002",
  "DyckPath@AlternatingSignMatrix": "Mp00007",
  "DiagonalHeightDyckPath@AlternatingSignMatrix": "Mp00334",
  "PerfectMatching@AlternatingSignMatrix": "Mp00098",
  "LinkPatternDyckPath@AlternatingSignMatrix": "Mp00333",
  "AlternatingSignMatrix@DyckPath": "Mp00035",
  "SymmetricAlternatingSignMatrix@DyckPath": "Mp00137",
};
