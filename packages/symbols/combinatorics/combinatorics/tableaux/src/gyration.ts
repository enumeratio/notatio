// Mp00006: the gyration of an alternating sign matrix, by Wieland's toggles on its height function. The height
// function h(i, j) = i + j - 2 c(i, j), with c the corner sums, is kept as one list of (n + 1)^2 entries read row by
// row; the toggle at an interior vertex replaces h with the sum of its largest and smallest neighbor less h.

import { bind, lets, type MathJSON } from "../../src/map-helpers.ts";

const n: MathJSON = ["Length", "_raw"];
const plus = (...terms: MathJSON[]): MathJSON => ["Add", ...terms];
const minus = (a: MathJSON, b: MathJSON): MathJSON => ["Subtract", a, b];
const upTo = (m: MathJSON): MathJSON => ["Range", 1, m, 1];
const item = (list: MathJSON, index: MathJSON): MathJSON => ["At", list, index];
const eachOf = (over: MathJSON, body: MathJSON, variable: string): MathJSON => [
  "Map",
  ["Function", body, variable],
  over,
];
/** `body` with `row` and `column` the 1-based position of entry `k` of a list of width `w`. */
const atPosition = (k: MathJSON, row: string, column: string, body: MathJSON): MathJSON =>
  bind(
    row,
    plus(["Floor", ["Divide", minus(k, 1), "gy_w"]], 1),
    bind(column, minus(k, ["Multiply", minus(row, 1), "gy_w"]), body, "integer"),
    "integer",
  );
const entry = (list: string, row: MathJSON, column: MathJSON): MathJSON =>
  item(list, plus(["Multiply", minus(row, 1), "gy_w"], column));

/** The sum of the matrix entries above and left of the vertex (row, column): its corner sum. */
const cornerSum = (row: MathJSON, column: MathJSON): MathJSON => [
  "Fold",
  [
    "Function",
    [
      "Add",
      "gy_a",
      [
        "Fold",
        ["Function", plus("gy_b", item(item("_raw", "gy_r"), "gy_c")), "gy_b", "gy_c"],
        0,
        upTo(minus(column, 1)),
      ],
    ],
    "gy_a",
    "gy_r",
  ],
  0,
  upTo(minus(row, 1)),
];

/** One round of toggles at the interior vertices whose row and column sum has parity `parity`; they are never
 *  neighbors, so each reads the heights from before the round. */
const toggled = (from: string, parity: number): MathJSON =>
  eachOf(
    upTo(["Multiply", "gy_w", "gy_w"]),
    atPosition("gy_k", "gy_i", "gy_j", [
      "If",
      ["Less", "gy_i", 2],
      item(from, "gy_k"),
      [
        "If",
        ["Greater", "gy_i", n],
        item(from, "gy_k"),
        [
          "If",
          ["Less", "gy_j", 2],
          item(from, "gy_k"),
          [
            "If",
            ["Greater", "gy_j", n],
            item(from, "gy_k"),
            [
              "If",
              ["Equal", ["Mod", plus("gy_i", "gy_j"), 2], parity],
              bind(
                "gy_nb",
                [
                  "List",
                  entry(from, minus("gy_i", 1), "gy_j"),
                  entry(from, plus("gy_i", 1), "gy_j"),
                  entry(from, "gy_i", minus("gy_j", 1)),
                  entry(from, "gy_i", plus("gy_j", 1)),
                ],
                minus(plus(["Max", "gy_nb"], ["Min", "gy_nb"]), item(from, "gy_k")),
                "list<integer>",
              ),
              item(from, "gy_k"),
            ],
          ],
        ],
      ],
    ]),
    "gy_k",
  );

/** Even vertices toggle first, then odd; the entry of the matrix at (i, j) is half the alternating sum of the heights
 *  around the face, which is -2, 0 or 2. */
export const gyrationBody: MathJSON = lets(
  [
    ["gy_w", plus(n, 1), "integer"],
    [
      "gy_h",
      eachOf(
        upTo(["Multiply", "gy_w", "gy_w"]),
        atPosition("gy_k", "gy_i", "gy_j", minus(plus("gy_i", "gy_j", -2), ["Multiply", 2, cornerSum("gy_i", "gy_j")])),
        "gy_k",
      ),
      "list<integer>",
    ],
    ["gy_e", toggled("gy_h", 0), "list<integer>"],
    ["gy_o", toggled("gy_e", 1), "list<integer>"],
  ],
  eachOf(
    upTo(n),
    eachOf(
      upTo(n),
      [
        "Sign",
        minus(
          plus(entry("gy_o", "gy_r", plus("gy_c", 1)), entry("gy_o", plus("gy_r", 1), "gy_c")),
          plus(entry("gy_o", "gy_r", "gy_c"), entry("gy_o", plus("gy_r", 1), plus("gy_c", 1))),
        ),
      ],
      "gy_c",
    ),
    "gy_r",
  ),
);
