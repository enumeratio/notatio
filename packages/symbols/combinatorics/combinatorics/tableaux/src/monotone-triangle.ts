// The monotone triangle of an alternating sign matrix A, read off its corner sums. Row k of the triangle lists the
// columns whose partial sum over the first k rows is 1; the number of its entries at most c is the corner sum
// Q(k, c) = sum of A[r][b] over r <= k, b <= c, so its i-th smallest entry is 1 + #{c : Q(k, c) < i}.

import { lets, type MathJSON } from "../../src/map-helpers.ts";

/** The order of the matrix. */
export const order: MathJSON = ["Length", "_raw"];
export const upTo = (m: MathJSON): MathJSON => ["Range", 1, m, 1];
export const plus = (...terms: MathJSON[]): MathJSON => ["Add", ...terms];
export const minus = (a: MathJSON, b: MathJSON): MathJSON => ["Subtract", a, b];
export const eachOf = (over: MathJSON, body: MathJSON, variable: string): MathJSON => [
  "Map",
  ["Function", body, variable],
  over,
];
export const item = (list: MathJSON, index: MathJSON): MathJSON => ["At", list, index];
/** The number of `over` whose `test` holds, as a sum of 0/1 (a filter cannot read the names around it). */
export const countOf = (over: MathJSON, test: MathJSON, variable: string): MathJSON => [
  "Sum",
  eachOf(over, ["If", test, 1, 0], variable),
];
/** The integer quotient of m by 2. */
export const half = (m: MathJSON): MathJSON => ["Divide", minus(m, ["Mod", m, 2]), 2];

/** Q(r, c) of the bound corner table `mt_q`, for 0 <= r, c <= n. */
export const corner = (row: MathJSON, column: MathJSON): MathJSON => item(item("mt_q", plus(row, 1)), plus(column, 1));

/** The table of corner sums, row r (0..n) holding Q(r, 0..n). */
const cornerTable: MathJSON = eachOf(
  ["Range", 0, order, 1],
  eachOf(
    ["Range", 0, order, 1],
    [
      "Fold",
      [
        "Function",
        [
          "Add",
          "mt_a",
          ["Fold", ["Function", plus("mt_b", item(item("_raw", "mt_r"), "mt_c")), "mt_b", "mt_c"], 0, upTo("mt_j")],
        ],
        "mt_a",
        "mt_r",
      ],
      0,
      upTo("mt_i"),
    ],
    "mt_j",
  ),
  "mt_i",
);

/** The i-th smallest entry of row k of the triangle of the matrix, or of its transpose. */
export const entryOf = (row: MathJSON, rank: MathJSON, transposed: boolean): MathJSON =>
  plus(1, countOf(upTo(order), ["Less", transposed ? corner("mt_c", row) : corner(row, "mt_c"), rank], "mt_c"));

/** `body` with `mt_q` the corner table. */
export const withCorners = (body: MathJSON): MathJSON => lets([["mt_q", cornerTable, "list<list<integer>>"]], body);

/** `body` with `mt_q` the corner table and `mt_t` the table of entries: row k, rank i of the triangle of the matrix,
 *  or of its transpose. */
export const withTriangle = (transposed: boolean, body: MathJSON): MathJSON =>
  lets(
    [
      ["mt_q", cornerTable, "list<list<integer>>"],
      [
        "mt_t",
        eachOf(upTo(order), eachOf(upTo(order), entryOf("mt_k", "mt_i", transposed), "mt_i"), "mt_k"),
        "list<list<integer>>",
      ],
    ],
    body,
  );

/** The entry at row k, rank i of the bound table `mt_t`. */
export const entry = (row: MathJSON, rank: MathJSON): MathJSON => item(item("mt_t", row), rank);
