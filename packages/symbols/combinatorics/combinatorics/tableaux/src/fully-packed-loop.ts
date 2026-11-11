// The fully packed loop of an alternating sign matrix, and the link pattern of its boundary. On the n by n grid of
// vertices, the edge right of vertex (i, j) is on the loop when the row sum A(i, 1) + ... + A(i, j) plus i + j is
// even, and the edge below it when the column sum A(1, j) + ... + A(i, j) plus i + j is odd, so every vertex has two
// loop edges. The 4n boundary edges, numbered clockwise from the top left, 2n of them on the loop, are joined in
// pairs by the loop's paths; the link pattern numbers those 2n points in the same order.

import { fold as typedFold } from "../../collections/src/families/tables.ts";
import { lets, type MathJSON } from "../../src/map-helpers.ts";
import { corner, countOf, eachOf, half, item, minus, order, plus, upTo, withCorners } from "./monotone-triangle.ts";

const fold = (...args: Parameters<typeof typedFold>): MathJSON => typedFold(...args) as MathJSON;

const ring = (p: MathJSON): MathJSON => item("fp_ring", p);
/** The loop edge right of vertex (i, j), for 1 <= i <= n and 0 <= j <= n. */
const across = (i: MathJSON, j: MathJSON): MathJSON => item(item("fp_h", i), plus(j, 1));
/** The loop edge below vertex (i, j), for 0 <= i <= n and 1 <= j <= n. */
const down = (i: MathJSON, j: MathJSON): MathJSON => item(item("fp_v", plus(i, 1)), j);
const four = ["Multiply", 4, order] as const;

/** Whether the vertex's side `side` (0 left, 1 right, 2 up, 3 down) carries a loop edge. */
const sideOccupied = (row: MathJSON, column: MathJSON, side: MathJSON): MathJSON => [
  "If",
  ["Equal", side, 0],
  across(row, minus(column, 1)),
  [
    "If",
    ["Equal", side, 1],
    across(row, column),
    ["If", ["Equal", side, 2], down(minus(row, 1), column), down(row, column)],
  ],
];

/** Where a walk on the state [row, column, side entered by, boundary position reached] goes next. */
const walkStep: MathJSON = [
  "If",
  ["Greater", item("fp_state", 4), 0],
  "fp_state",
  lets(
    [
      ["fp_row", item("fp_state", 1)],
      ["fp_column", item("fp_state", 2)],
      ["fp_side", item("fp_state", 3)],
    ],
    lets(
      [
        [
          "fp_exit",
          [
            "Sum",
            eachOf(
              ["Range", 0, 3, 1],
              [
                "Multiply",
                "fp_s",
                ["If", ["Equal", "fp_s", "fp_side"], 0, sideOccupied("fp_row", "fp_column", "fp_s")],
              ],
              "fp_s",
            ),
          ],
        ],
      ],
      [
        "If",
        ["Equal", "fp_exit", 0],
        [
          "If",
          ["Equal", "fp_column", 1],
          ["List", "fp_row", "fp_column", 0, minus(plus(four, 1), "fp_row")],
          ["List", "fp_row", minus("fp_column", 1), 1, 0],
        ],
        [
          "If",
          ["Equal", "fp_exit", 1],
          [
            "If",
            ["Equal", "fp_column", order],
            ["List", "fp_row", "fp_column", 0, plus(order, "fp_row")],
            ["List", "fp_row", plus("fp_column", 1), 0, 0],
          ],
          [
            "If",
            ["Equal", "fp_exit", 2],
            [
              "If",
              ["Equal", "fp_row", 1],
              ["List", "fp_row", "fp_column", 0, "fp_column"],
              ["List", minus("fp_row", 1), "fp_column", 3, 0],
            ],
            [
              "If",
              ["Equal", "fp_row", order],
              ["List", "fp_row", "fp_column", 0, minus(plus(["Multiply", 3, order], 1), "fp_column")],
              ["List", plus("fp_row", 1), "fp_column", 2, 0],
            ],
          ],
        ],
      ],
    ),
  ),
];

/** The vertex and side where the walk from boundary position p enters the grid. */
const walkStart = (p: MathJSON): MathJSON => [
  "If",
  ["LessEqual", p, order],
  ["List", 1, p, 2, 0],
  [
    "If",
    ["LessEqual", p, ["Multiply", 2, order]],
    ["List", minus(p, order), order, 1, 0],
    [
      "If",
      ["LessEqual", p, ["Multiply", 3, order]],
      ["List", order, minus(plus(["Multiply", 3, order], 1), p), 3, 0],
      ["List", minus(plus(four, 1), p), 1, 0, 0],
    ],
  ],
];

/** `body` with `fp_partner` the link pattern: entry a is the point joined to point a, for 1 <= a <= 2n. */
export const withLinkPattern = (body: MathJSON): MathJSON =>
  withCorners(
    lets(
      [
        [
          "fp_h",
          eachOf(
            upTo(order),
            eachOf(
              ["Range", 0, order, 1],
              [
                "If",
                [
                  "Equal",
                  ["Mod", plus(minus(corner("fp_i", "fp_j"), corner(minus("fp_i", 1), "fp_j")), "fp_i", "fp_j"), 2],
                  0,
                ],
                1,
                0,
              ],
              "fp_j",
            ),
            "fp_i",
          ),
          "list<list<integer>>",
        ],
        [
          "fp_v",
          eachOf(
            ["Range", 0, order, 1],
            eachOf(
              upTo(order),
              [
                "If",
                [
                  "Equal",
                  ["Mod", plus(minus(corner("fp_i", "fp_j"), corner("fp_i", minus("fp_j", 1))), "fp_i", "fp_j"), 2],
                  1,
                ],
                1,
                0,
              ],
              "fp_j",
            ),
            "fp_i",
          ),
          "list<list<integer>>",
        ],
        [
          "fp_ring",
          eachOf(
            upTo(four),
            [
              "If",
              ["LessEqual", "fp_p", order],
              down(0, "fp_p"),
              [
                "If",
                ["LessEqual", "fp_p", ["Multiply", 2, order]],
                across(minus("fp_p", order), order),
                [
                  "If",
                  ["LessEqual", "fp_p", ["Multiply", 3, order]],
                  down(order, minus(plus(["Multiply", 3, order], 1), "fp_p")),
                  across(minus(plus(four, 1), "fp_p"), 0),
                ],
              ],
            ],
            "fp_p",
          ),
          "list<integer>",
        ],
        // The number of loop edges on the boundary up to and including position p.
        [
          "fp_rank",
          eachOf(
            upTo(four),
            ["Sum", eachOf(upTo(four), ["If", ["LessEqual", "fp_q", "fp_p"], ring("fp_q"), 0], "fp_q")],
            "fp_p",
          ),
          "list<integer>",
        ],
        [
          "fp_end",
          eachOf(
            upTo(four),
            [
              "If",
              ["Equal", ring("fp_p"), 0],
              0,
              item(
                fold(
                  walkStep,
                  "fp_state",
                  "fp_t",
                  walkStart("fp_p"),
                  upTo(plus(["Multiply", order, order], 1)),
                  "list<integer>",
                ),
                4,
              ),
            ],
            "fp_p",
          ),
          "list<integer>",
        ],
        [
          "fp_partner",
          eachOf(
            upTo(["Multiply", 2, order]),
            item(
              "fp_rank",
              item("fp_end", plus(1, countOf(upTo(four), ["Less", item("fp_rank", "fp_u"), "fp_a"], "fp_u"))),
            ),
            "fp_a",
          ),
          "list<integer>",
        ],
      ],
      body,
    ),
  );

/** The vertex of boundary point a: points 2v - 1 and 2v belong to vertex v. */
export const vertexOf = (a: MathJSON): MathJSON => half(plus(a, 1));
