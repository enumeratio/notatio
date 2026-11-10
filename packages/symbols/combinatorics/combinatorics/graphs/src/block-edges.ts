// Mp00276, over `_raw` = Tuple(n, edges): the vertices 1 .. n and the edges [u, v] with u < v.

import { fold } from "../../collections/src/families/tables.ts";
import { lets, type MathJSON } from "../../src/map-helpers.ts";

const LIST = "list<integer>";
const plus = (...terms: MathJSON[]): MathJSON => ["Add", ...terms];
const minus = (a: MathJSON, b: MathJSON): MathJSON => ["Subtract", a, b];
const times = (a: MathJSON, b: MathJSON): MathJSON => ["Multiply", a, b];
const upTo = (m: MathJSON): MathJSON => ["Range", 1, m, 1];
const item = (list: MathJSON, index: MathJSON): MathJSON => ["At", list, index];
const when = (test: MathJSON, then: MathJSON, otherwise: MathJSON): MathJSON => ["If", test, then, otherwise];
const eachOf = (over: MathJSON, body: MathJSON, variable: string): MathJSON => [
  "Map",
  ["Function", body, variable],
  over,
];
/** How many of `over` pass `test`, which reads the loop variable `v`. */
const tally = (over: MathJSON, test: MathJSON, v: string, acc: string): MathJSON => [
  "Fold",
  ["Function", when(test, plus(acc, 1), acc), acc, v],
  0,
  over,
];

const n = "bl_n";
const m = "bl_m";
/** Entry (row, column) of the flat n x n list `list`. */
const entry = (list: string, row: MathJSON, column: MathJSON): MathJSON =>
  item(list, plus(times(minus(row, 1), n), column));

/** Mp00276: the edge counts of the blocks, largest first. Two edges lie in one block exactly when, whichever vertex x
 *  is deleted, an end of the first that is not x is joined to an end of the second that is not x in the graph less x
 *  (components by label propagation, n rounds; `labels` holds row x of labels for the graph less x). Each edge then
 *  has its block's edge count, and a block of s edges is s edges of count s. */
export const blockEdgePartitionBody: MathJSON = lets(
  [
    [n, item("_raw", 1), "integer"],
    ["bl_edges", item("_raw", 2), "list<list<integer>>"],
    [m, ["Length", "bl_edges"], "integer"],
    ["bl_a", eachOf("bl_edges", item("bl_e", 1), "bl_e"), LIST],
    ["bl_b", eachOf("bl_edges", item("bl_e", 2), "bl_e"), LIST],
    [
      "bl_adj",
      eachOf(
        upTo(times(n, n)),
        lets(
          [
            ["bl_r", plus(["Floor", ["Divide", minus("bl_t", 1), n]], 1), "integer"],
            ["bl_c", minus("bl_t", times(["Floor", ["Divide", minus("bl_t", 1), n]], n)), "integer"],
          ],
          tally(
            upTo(m),
            [
              "Or",
              ["And", ["Equal", item("bl_a", "bl_f"), "bl_r"], ["Equal", item("bl_b", "bl_f"), "bl_c"]],
              ["And", ["Equal", item("bl_a", "bl_f"), "bl_c"], ["Equal", item("bl_b", "bl_f"), "bl_r"]],
            ],
            "bl_f",
            "bl_g",
          ),
        ),
        "bl_t",
      ),
      LIST,
    ],
    [
      "bl_labels",
      fold(
        eachOf(
          upTo(times(n, n)),
          lets(
            [
              ["bl_x", plus(["Floor", ["Divide", minus("bl_t", 1), n]], 1), "integer"],
              ["bl_v", minus("bl_t", times(["Floor", ["Divide", minus("bl_t", 1), n]], n)), "integer"],
            ],
            [
              "Fold",
              [
                "Function",
                when(
                  ["Equal", entry("bl_adj", "bl_v", "bl_u"), 1],
                  when(["Equal", "bl_u", "bl_x"], "bl_h", ["Min", "bl_h", entry("bl_s", "bl_x", "bl_u")]),
                  "bl_h",
                ),
                "bl_h",
                "bl_u",
              ],
              item("bl_s", "bl_t"),
              upTo(n),
            ],
          ),
          "bl_t",
        ),
        "bl_s",
        "bl_round",
        eachOf(upTo(times(n, n)), minus("bl_t", times(["Floor", ["Divide", minus("bl_t", 1), n]], n)), "bl_t"),
        upTo(n),
        LIST,
      ) as MathJSON,
      LIST,
    ],
    [
      "bl_sizes",
      eachOf(
        upTo(m),
        tally(
          upTo(m),
          [
            "Equal",
            tally(
              upTo(n),
              [
                "Not",
                [
                  "Or",
                  ...[
                    [item("bl_a", "bl_e"), item("bl_a", "bl_f")],
                    [item("bl_a", "bl_e"), item("bl_b", "bl_f")],
                    [item("bl_b", "bl_e"), item("bl_a", "bl_f")],
                    [item("bl_b", "bl_e"), item("bl_b", "bl_f")],
                  ].map(([p, q]) => [
                    "And",
                    ["NotEqual", p, "bl_x"],
                    ["NotEqual", q, "bl_x"],
                    ["Equal", entry("bl_labels", "bl_x", p!), entry("bl_labels", "bl_x", q!)],
                  ]),
                ],
              ],
              "bl_x",
              "bl_k",
            ),
            0,
          ],
          "bl_f",
          "bl_g",
        ),
        "bl_e",
      ),
      LIST,
    ],
  ],
  when(
    ["Equal", m, 0],
    ["List"],
    [
      "Flatten",
      eachOf(
        upTo(m),
        eachOf(
          upTo([
            "Floor",
            [
              "Divide",
              tally("bl_sizes", ["Equal", "bl_z", minus(plus(m, 1), "bl_i")], "bl_z", "bl_y"),
              minus(plus(m, 1), "bl_i"),
            ],
          ]),
          minus(plus(m, 1), "bl_i"),
          "bl_w",
        ),
        "bl_i",
      ),
    ],
  ),
);
