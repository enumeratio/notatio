// Graphs to integer partitions (Mp00251), over `_raw` = Tuple(n, edges): the vertices 1 .. n and the edges [u, v] with
// u < v.

import { fold as typedFold } from "../../collections/src/families/tables.ts";
import { bind, lets, type CombinatorialMap, type MathJSON } from "../../src/map-helpers.ts";

const fold = (...args: Parameters<typeof typedFold>): MathJSON => typedFold(...args) as MathJSON;

const LIST = "list<integer>";
const n = "cq_n";
const upTo = (m: MathJSON): MathJSON => ["Range", 1, m, 1];
const item = (list: MathJSON, index: MathJSON): MathJSON => ["At", list, index];
const eachOf = (over: MathJSON, body: MathJSON, variable: string): MathJSON => [
  "Map",
  ["Function", body, variable],
  over,
];
const count = (over: MathJSON, test: MathJSON, variable: string): MathJSON => [
  "Count",
  ["Filter", over, ["Function", test, variable]],
];
/** The highest vertex of the subset whose bitmask is `mask` (the exponent of its top bit, plus one). */
const top = (mask: MathJSON): MathJSON =>
  count(upTo(n), ["LessEqual", ["Power", 2, ["Subtract", "cq_b", 1]], mask], "cq_b");
/** Whether vertex `v` is in the subset whose bitmask is `mask`. */
const member = (mask: MathJSON, v: MathJSON): MathJSON => [
  "Equal",
  ["Mod", ["Floor", ["Divide", mask, ["Power", 2, ["Subtract", v, 1]]]], 2],
  1,
];
/** Whether vertices `u` and `v` are joined: the flat n x n list `cq_adj` holds 1 for an edge. */
const joined = (u: MathJSON, v: MathJSON): MathJSON => [
  "Equal",
  item("cq_adj", ["Add", ["Multiply", ["Subtract", u, 1], n], v]),
  1,
];

/** Mp00251: the subsets of the vertices are the bitmasks 1 .. 2^n - 1. A subset is a clique when the subset without its
 *  top vertex is a clique (earlier in the fold) and the top vertex is joined to all of it, and maximal when no vertex
 *  added gives a clique; a maximal clique's mask has its size, any other mask 0. The sizes of the maximal cliques, largest first, are read off by value from n down to 1. */
const body: MathJSON = lets(
  [
    [n, item("_raw", 1), "integer"],
    ["cq_edges", item("_raw", 2), "list<list<integer>>"],
    [
      "cq_adj",
      eachOf(
        upTo(["Multiply", n, n]),
        count(
          "cq_edges",
          [
            "Or",
            ...[
              [
                ["Floor", ["Divide", ["Subtract", "cq_t", 1], n]],
                ["Mod", ["Subtract", "cq_t", 1], n],
              ],
              [
                ["Mod", ["Subtract", "cq_t", 1], n],
                ["Floor", ["Divide", ["Subtract", "cq_t", 1], n]],
              ],
            ].map(([r, c]) => [
              "And",
              ["Equal", item("cq_e", 1), ["Add", r!, 1]],
              ["Equal", item("cq_e", 2), ["Add", c!, 1]],
            ]),
          ],
          "cq_e",
        ),
        "cq_t",
      ),
      LIST,
    ],
    [
      "cq_clique",
      fold(
        [
          "If",
          ["Equal", ["Subtract", "cq_s", ["Power", 2, ["Subtract", top("cq_s"), 1]]], 0],
          ["Join", "cq_flags", ["List", 1]],
          bind(
            "cq_rest",
            ["Subtract", "cq_s", ["Power", 2, ["Subtract", top("cq_s"), 1]]],
            [
              "If",
              ["Equal", item("cq_flags", "cq_rest"), 0],
              ["Join", "cq_flags", ["List", 0]],
              [
                "Join",
                "cq_flags",
                [
                  "List",
                  [
                    "If",
                    [
                      "Equal",
                      count(
                        upTo(["Subtract", top("cq_s"), 1]),
                        ["And", member("cq_rest", "cq_v"), ["Not", joined("cq_v", top("cq_s"))]],
                        "cq_v",
                      ),
                      0,
                    ],
                    1,
                    0,
                  ],
                ],
              ],
            ],
          ),
        ],
        "cq_flags",
        "cq_s",
        ["List"],
        upTo(["Subtract", ["Power", 2, n], 1]),
        LIST,
      ),
      LIST,
    ],
    [
      "cq_sizes",
      eachOf(
        upTo(["Subtract", ["Power", 2, n], 1]),
        [
          "If",
          [
            "And",
            ["Equal", item("cq_clique", "cq_s"), 1],
            [
              "Equal",
              [
                "Sum",
                eachOf(
                  upTo(n),
                  [
                    "If",
                    member("cq_s", "cq_w"),
                    0,
                    item("cq_clique", ["Add", "cq_s", ["Power", 2, ["Subtract", "cq_w", 1]]]),
                  ],
                  "cq_w",
                ),
              ],
              0,
            ],
          ],
          count(upTo(n), member("cq_s", "cq_u"), "cq_u"),
          0,
        ],
        "cq_s",
      ),
      LIST,
    ],
  ],
  [
    "If",
    ["Equal", n, 0],
    ["List"],
    [
      "Flatten",
      eachOf(
        upTo(n),
        ["Filter", "cq_sizes", ["Function", ["Equal", "cq_z", ["Subtract", ["Add", n, 1], "cq_k"]], "cq_z"]],
        "cq_k",
      ),
    ],
  ],
);

export const CLIQUE_MAPS: readonly CombinatorialMap[] = [
  {
    name: "CliqueSizePartition",
    from: "labeled_graph",
    to: "integer_partition",
    body,
    summary: "The sizes of the maximal cliques of a graph, largest first.",
    note: "FindStat's Mp00251. An isolated vertex is a maximal clique of size 1.",
  },
];
