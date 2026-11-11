// Maps from Dyck paths to alternating sign matrices (Mp00035, Mp00137). Bodies are over `_raw`, the path's 0/1 steps
// (1 up).

import { at, forEach, lets, type CombinatorialMap, type MathJSON } from "../../src/map-helpers.ts";
import { dyckGuard } from "./maps.ts";

const steps: MathJSON = ["Length", "_raw"];
const semilength: MathJSON = ["Divide", steps, 2];
const upTo = (k: MathJSON): MathJSON => ["Range", 1, k, 1];
const isEmpty: MathJSON = ["Equal", steps, 0];
const plus = (...terms: MathJSON[]): MathJSON => ["Add", ...terms];
const minus = (a: MathJSON, b: MathJSON): MathJSON => ["Subtract", a, b];
/** 1 where `test` holds, else 0. */
const indicator = (test: MathJSON): MathJSON => ["If", test, 1, 0];
/** The matrix with entry `cell` at row r, column c (named `row`, `column`), both counted from `first`. */
const matrixOf = (cell: MathJSON, row: string, column: string, first: number): MathJSON => {
  const indices: MathJSON = ["Range", first, plus(semilength, first - 1), 1];
  return forEach(indices, forEach(indices, cell, column), row);
};

/** The ups among the first m steps, for m = 0..2n: entry m + 1. */
const upsBefore = (variable: string): MathJSON =>
  forEach(
    ["Range", 0, steps, 1],
    ["Sum", forEach(upTo(steps), indicator(["And", ["LessEqual", "p", variable], ["Equal", at("p"), 1]]), "p")],
    variable,
  );

/** Mp00035: row k of the matrix is the first k columns of the monotone triangle row {1, ..., k - 1, U(k)}, differenced,
 *  where U(k) is the number of ups before the k-th down step. */
const alternatingSignMatrixBody: MathJSON = [
  "If",
  isEmpty,
  ["List"],
  lets(
    [
      ["as_up", upsBefore("as_m"), "list<integer>"],
      // Entry k + 1 is U(k); U(0) = 0 names no column.
      [
        "as_u",
        forEach(
          ["Range", 0, semilength, 1],
          [
            "If",
            ["Equal", "as_k", 0],
            0,
            [
              "Sum",
              forEach(
                upTo(steps),
                indicator([
                  "And",
                  ["Equal", at("as_p"), 1],
                  ["Less", minus(minus("as_p", 1), at("as_p", "as_up")), "as_k"],
                ]),
                "as_p",
              ),
            ],
          ],
          "as_k",
        ),
        "list<integer>",
      ],
    ],
    matrixOf(
      minus(
        plus(indicator(["Equal", "as_c", minus("as_r", 1)]), indicator(["Equal", "as_c", at(plus("as_r", 1), "as_u")])),
        indicator(["Equal", "as_c", at("as_r", "as_u")]),
      ),
      "as_r",
      "as_c",
      1,
    ),
  ),
];

/** Mp00137: the cell (r, c) lies on the antidiagonal of step s = r + c. A peak there (up, then down) with i ups before
 *  it and j = s - i downs puts a 1 on the cells with j <= r <= i; a valley there (down, then up), after which i ups and
 *  j = s + 1 - i downs have passed, a -1 on those with j <= r <= i - 1. */
const symmetricMatrixBody: MathJSON = [
  "If",
  isEmpty,
  ["List"],
  lets(
    [["sm_up", upsBefore("sm_m"), "list<integer>"]],
    matrixOf(
      lets(
        [["sm_s", plus("sm_r", "sm_c")]],
        [
          "If",
          [
            "And",
            ["Equal", at(plus("sm_s", 1)), 0],
            ["Equal", at(plus("sm_s", 2)), 1],
            ["GreaterEqual", "sm_r", minus(plus("sm_s", 1), at(plus("sm_s", 1), "sm_up"))],
            ["LessEqual", "sm_r", minus(at(plus("sm_s", 1), "sm_up"), 1)],
          ],
          -1,
          [
            "If",
            [
              "And",
              ["Equal", at(plus("sm_s", 1)), 1],
              ["Equal", at(plus("sm_s", 2)), 0],
              ["GreaterEqual", "sm_r", minus("sm_s", at(plus("sm_s", 1), "sm_up"))],
              ["LessEqual", "sm_r", at(plus("sm_s", 1), "sm_up")],
            ],
            1,
            0,
          ],
        ],
      ),
      "sm_r",
      "sm_c",
      0,
    ),
  ),
];

export const DYCK_ALTERNATING_SIGN_MAPS: readonly CombinatorialMap[] = [
  {
    name: "AlternatingSignMatrix",
    convert: true,
    from: "dyck_path",
    to: "alternating_sign_matrix",
    body: alternatingSignMatrixBody,
    guard: dyckGuard,
    summary:
      "The alternating sign matrix whose monotone triangle has the rows {1, ..., k - 1} with one more entry, the number of ups before the k-th down step.",
    note: "FindStat's Mp00035, an injection onto certain n by n matrices; Mp00007 reads the path back.",
    findstat: ["Mp00035"],
  },
  {
    name: "SymmetricAlternatingSignMatrix",
    from: "dyck_path",
    to: "alternating_sign_matrix",
    body: symmetricMatrixBody,
    guard: dyckGuard,
    summary:
      "The diagonally symmetric alternating sign matrix of a path: a 1 along the antidiagonal under each peak, a -1 along the one under each valley, as far as the path's height.",
    note: "FindStat's Mp00137 (Rubey, arXiv 1707.06802), an injection.",
  },
];
