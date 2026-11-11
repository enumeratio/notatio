// Maps from permutations (Mp00204, Mp00326, Mp00329, Mp00159).

import {
  at,
  bind,
  forEach,
  lets,
  positions,
  size,
  type CombinatorialMap,
  type MathJSON,
} from "../../src/map-helpers.ts";
import { fold as typedFold } from "../../collections/src/families/tables.ts";

const fold = (...args: Parameters<typeof typedFold>): MathJSON => typedFold(...args) as MathJSON;

const upTo = (count: MathJSON): MathJSON => ["Range", 1, count, 1];
const typed = "list<integer>";

/** Integer division of a non-negative a by b. */
const quotient = (a: MathJSON, b: MathJSON): MathJSON => ["Floor", ["Divide", a, b]];

// --- Mp00329: Tanimoto's operator ---

const plusOne = (list: MathJSON): MathJSON => ["Map", ["Function", ["Add", "x", 1], "x"], list];

const tanimotoBody: MathJSON = [
  "If",
  ["Equal", size, 0],
  ["List"],
  [
    "If",
    ["Equal", at(1), size],
    ["Join", plusOne(["Drop", "_raw", 1]), ["List", 1]],
    [
      "If",
      ["Equal", at(size), size],
      ["Join", ["List", 1], plusOne(["Most", "_raw"])],
      forEach(positions, ["Add", ["Mod", at("i"), size], 1]),
    ],
  ],
];

// --- Mp00159: π⁻¹ ⋆ π. Sorting π⁻¹ by exchanging its first descent, step by step, reads off a reduced word of π, and each
// letter multiplies the product on the right unless that shortens it. The state is the product so far (it starts as π⁻¹)
// followed by the part still to sort (also π⁻¹). ---

const demazureStart: MathJSON = forEach(
  upTo(["Multiply", 2, size]),
  ["IndexOf", "_raw", ["If", ["LessEqual", "q", size], "q", ["Subtract", "q", size]]],
  "q",
);

const demazureStep: MathJSON = bind(
  "dp_a",
  // The first descent of the second half, as its position; n when there is none.
  [
    "Min",
    [
      "Join",
      [
        "Filter",
        upTo(["Subtract", size, 1]),
        ["Function", ["Greater", at(["Add", size, "r"], "dp_acc"), at(["Add", size, "r", 1], "dp_acc")], "r"],
      ],
      ["List", size],
    ],
  ],
  [
    "If",
    ["Equal", "dp_a", size],
    "dp_acc",
    bind(
      // Where the product's exchange happens: none (past the end) when the exchange would shorten it.
      "dp_low",
      ["If", ["Less", at("dp_a", "dp_acc"), at(["Add", "dp_a", 1], "dp_acc")], "dp_a", ["Multiply", 3, size]],
      forEach(
        upTo(["Multiply", 2, size]),
        bind(
          "dp_at",
          ["If", ["LessEqual", "q", size], "dp_low", ["Add", size, "dp_a"]],
          [
            "At",
            "dp_acc",
            [
              "If",
              ["Equal", "q", "dp_at"],
              ["Add", "q", 1],
              ["If", ["Equal", "q", ["Add", "dp_at", 1]], ["Subtract", "q", 1], "q"],
            ],
          ],
          "integer",
        ),
        "q",
      ),
      "integer",
    ),
  ],
  "integer",
);

const demazureBody: MathJSON = [
  "If",
  ["Less", size, 2],
  "_raw",
  bind(
    "dp_done",
    fold(
      demazureStep,
      "dp_acc",
      "dp_step",
      demazureStart,
      upTo(quotient(["Multiply", size, ["Subtract", size, 1]], 2)),
      typed,
    ),
    forEach(upTo(size), at("i", "dp_done")),
    typed,
  ),
];

// --- Mp00204: the Lewis-Lyu-Pylyavskyy-Sen shape. Read the reversed word w. A'_k is the most that k blocks cutting w
// into consecutive pieces total, a piece counting its longest increasing subsequence; the shape is the conjugate of
// the increments of A'_k, and its parts are the positive ones. ---

const n1: MathJSON = ["Add", size, 1];

/** E, flat: entry (s - 1) n + p is the longest increasing subsequence of w[s..p] that ends at p (0 before s). */
const endingAt: MathJSON = fold(
  forEach(
    upTo(["Multiply", size, size]),
    bind(
      "ll_s",
      ["Add", quotient(["Subtract", "ll_idx", 1], size), 1],
      bind(
        "ll_c",
        ["Add", ["Mod", ["Subtract", "ll_idx", 1], size], 1],
        [
          "If",
          ["And", ["Equal", "ll_c", "ll_p"], ["LessEqual", "ll_s", "ll_p"]],
          [
            "Add",
            1,
            [
              "Max",
              [
                "Join",
                ["List", 0],
                forEach(
                  upTo(["Max", ["Subtract", "ll_p", 1], 1]),
                  [
                    "If",
                    [
                      "And",
                      ["GreaterEqual", "ll_q", "ll_s"],
                      ["Less", "ll_q", "ll_p"],
                      ["Less", at("ll_q", "ll_w"), at("ll_p", "ll_w")],
                    ],
                    at(["Add", ["Multiply", ["Subtract", "ll_s", 1], size], "ll_q"], "ll_e"),
                    0,
                  ],
                  "ll_q",
                ),
              ],
            ],
          ],
          at("ll_idx", "ll_e"),
        ],
        "integer",
      ),
      "integer",
    ),
    "ll_idx",
  ),
  "ll_e",
  "ll_p",
  forEach(upTo(["Multiply", size, size]), 0, "ll_z"),
  upTo(size),
  typed,
);

/** The longest increasing subsequence of w[i + 1..j], for 0 <= i < j <= n. */
const blockScore = (i: MathJSON, j: MathJSON): MathJSON => [
  "Max",
  forEach(["Range", ["Add", i, 1], j, 1], at(["Add", ["Multiply", i, size], "ll_r"], "ll_e"), "ll_r"),
];

/** Row k of the cut-point table, flat with row length n + 1: entry k (n + 1) + j + 1 is the most k blocks can score on w[1..j]. */
const NONE = -1000;
const cutRows: MathJSON = fold(
  forEach(
    upTo(["Multiply", n1, n1]),
    [
      "If",
      ["Equal", quotient(["Subtract", "ll_idx", 1], n1), "ll_k"],
      bind(
        "ll_j",
        ["Mod", ["Subtract", "ll_idx", 1], n1],
        [
          "If",
          ["Equal", "ll_j", 0],
          NONE,
          [
            "Max",
            forEach(
              upTo("ll_j"),
              [
                "Add",
                at(["Add", ["Multiply", ["Subtract", "ll_k", 1], n1], "ll_i"], "ll_rows"),
                blockScore(["Subtract", "ll_i", 1], "ll_j"),
              ],
              "ll_i",
            ),
          ],
        ],
        "integer",
      ),
      at("ll_idx", "ll_rows"),
    ],
    "ll_idx",
  ),
  "ll_rows",
  "ll_k",
  forEach(upTo(["Multiply", n1, n1]), ["If", ["Equal", "ll_z", 1], 0, NONE], "ll_z"),
  upTo(size),
  typed,
);

/** The score of k blocks over the whole word, A'_k. */
const best = (k: MathJSON): MathJSON => at(["Add", ["Multiply", k, n1], n1], "ll_rows");

const lewisLyuPylyavskyySenBody: MathJSON = [
  "If",
  ["Equal", size, 0],
  ["List"],
  lets(
    [
      ["ll_w", forEach(positions, at(["Subtract", n1, "i"])), typed],
      ["ll_e", endingAt, typed],
      ["ll_rows", cutRows, typed],
    ],
    [
      "Filter",
      forEach(positions, ["Subtract", best("i"), ["If", ["Equal", "i", 1], 0, best(["Subtract", "i", 1])]]),
      ["Function", ["Greater", "d", 0], "d"],
    ],
  ),
];

// --- Mp00326: the reversal of the inverse of the Laguerre heap. The heap's pieces are the maximal descending runs of π
// (each read upward); only their order changes, so a piece is a run's number r, with the run's first value (its top)
// and last (its bottom). The pieces start in the order m, ..., 1, and the first adjacent pair whose first piece lies
// wholly above the second is exchanged until none is (each pair is exchanged at most once, so at most m(m-1)/2
// steps). Then the pieces are cut into groups, each group a maximal stretch whose every piece lies wholly above or
// wholly below all those before it in the group, and each group is written by increasing bottom, every run as it is
// in π; the whole word read backwards is the image. ---

/** The sum of `term` over k = 1..count (zero for none). */
const sumTo = (count: MathJSON, term: (k: MathJSON) => MathJSON): MathJSON => [
  "Fold",
  ["Function", ["Add", "wr_total", term("wr_k")], "wr_total", "wr_k"],
  0,
  upTo(count),
];

/** `list` with entry q replaced by `value` where `at` is q. */
const withEntry = (list: MathJSON, position: MathJSON, value: MathJSON, length: MathJSON): MathJSON =>
  forEach(upTo(length), ["If", ["Equal", "q", position], value, at("q", list)], "q");

const wrM: MathJSON = "wr_m";
const wrAt = (list: string, index: MathJSON): MathJSON => at(index, list);
const wrTop = (position: MathJSON): MathJSON => wrAt("wr_top", wrAt("wr_ord", position));
const wrBottom = (position: MathJSON): MathJSON => wrAt("wr_bot", wrAt("wr_ord", position));

const exchangeStep: MathJSON = bind(
  "wr_a",
  [
    "Min",
    forEach(upTo(["Subtract", wrM, 1]), [
      "If",
      ["Greater", wrBottom("i"), wrTop(["Add", "i", 1])],
      "i",
      ["Multiply", 3, wrM],
    ]),
  ],
  forEach(
    upTo(wrM),
    [
      "If",
      ["Equal", "q", "wr_a"],
      at(["Add", "q", 1], "wr_ord"),
      ["If", ["Equal", "q", ["Add", "wr_a", 1]], at(["Subtract", "q", 1], "wr_ord"), at("q", "wr_ord")],
    ],
    "q",
  ),
  "integer",
);

/** Whether the piece at position j of the final order joins the group begun at g: it lies wholly above or wholly below the group so far. */
const joinsGroup = (j: MathJSON, g: MathJSON): MathJSON => {
  const stretch = (term: (f: MathJSON) => MathJSON): MathJSON =>
    forEach(["Range", g, ["Max", ["Subtract", j, 1], g], 1], term("f"), "f");
  return [
    "If",
    ["Equal", j, 1],
    "False",
    [
      "Or",
      ["GreaterEqual", at(wrAt("wr_ord", j), "wr_bot"), ["Max", stretch((f) => at(wrAt("wr_ord", f), "wr_top"))]],
      ["LessEqual", at(wrAt("wr_ord", j), "wr_top"), ["Min", stretch((f) => at(wrAt("wr_ord", f), "wr_bot"))]],
    ],
  ];
};

/** The group each piece of the final order is in, by the position where its group begins. */
const groupStep: MathJSON = bind(
  "wr_g",
  ["If", ["Equal", "wr_j", 1], 1, at(["Max", ["Subtract", "wr_j", 1], 1], "wr_groups")],
  withEntry("wr_groups", "wr_j", ["If", joinsGroup("wr_j", "wr_g"), "wr_g", "wr_j"], wrM),
  "integer",
);

const sameGroupBefore = (j: MathJSON, other: MathJSON): MathJSON => [
  "If",
  ["Less", at(other, "wr_groups"), at(j, "wr_groups")],
  1,
  [
    "If",
    ["Equal", at(other, "wr_groups"), at(j, "wr_groups")],
    ["If", ["Less", wrBottom(other), wrBottom(j)], 1, 0],
    0,
  ],
];

const weakOrderRowmotionBody: MathJSON = [
  "If",
  ["Equal", size, 0],
  ["List"],
  lets(
    [
      [
        "wr_starts",
        [
          "Filter",
          positions,
          ["Function", ["Or", ["Equal", "p", 1], ["Less", at(["Max", ["Subtract", "p", 1], 1]), at("p")]], "p"],
        ],
        typed,
      ],
      ["wr_m", ["Count", "wr_starts"], "integer"],
      ["wr_top", forEach(upTo(wrM), at(at("r", "wr_starts")), "r"), typed],
      [
        "wr_bot",
        forEach(
          upTo(wrM),
          at(["If", ["Equal", "r", wrM], size, ["Subtract", at(["Min", ["Add", "r", 1], wrM], "wr_starts"), 1]]),
          "r",
        ),
        typed,
      ],
      [
        "wr_len",
        forEach(
          upTo(wrM),
          [
            "Subtract",
            ["If", ["Equal", "r", wrM], ["Add", size, 1], at(["Min", ["Add", "r", 1], wrM], "wr_starts")],
            at("r", "wr_starts"),
          ],
          "r",
        ),
        typed,
      ],
      [
        "wr_ord",
        [
          "If",
          ["Less", wrM, 2],
          forEach(upTo(wrM), ["Subtract", ["Add", wrM, 1], "r"], "r"),
          fold(
            exchangeStep,
            "wr_ord",
            "wr_t",
            forEach(upTo(wrM), ["Subtract", ["Add", wrM, 1], "r"], "r"),
            upTo(quotient(["Multiply", wrM, ["Subtract", wrM, 1]], 2)),
            typed,
          ),
        ],
        typed,
      ],
      ["wr_groups", fold(groupStep, "wr_groups", "wr_j", forEach(upTo(wrM), 0, "z"), upTo(wrM), typed), typed],
      [
        "wr_runs",
        forEach(
          upTo(wrM),
          [
            "Max",
            forEach(
              upTo(wrM),
              [
                "If",
                ["Equal", sumTo(wrM, (k) => sameGroupBefore("wr_j2", k)), ["Subtract", "wr_k2", 1]],
                at("wr_j2", "wr_ord"),
                0,
              ],
              "wr_j2",
            ),
          ],
          "wr_k2",
        ),
        typed,
      ],
      [
        "wr_ends",
        forEach(
          upTo(wrM),
          sumTo("wr_k3", (k) => at(at(k, "wr_runs"), "wr_len")),
          "wr_k3",
        ),
        typed,
      ],
    ],
    forEach(
      positions,
      bind(
        "wr_p",
        ["Subtract", n1, "i"],
        bind(
          "wr_k",
          [
            "Add",
            1,
            [
              "Fold",
              ["Function", ["Add", "wr_c", ["If", ["Less", "wr_e", "wr_p"], 1, 0]], "wr_c", "wr_e"],
              0,
              "wr_ends",
            ],
          ],
          at([
            "Subtract",
            ["Add", at(at("wr_k", "wr_runs"), "wr_starts"), "wr_p"],
            ["Add", 1, ["If", ["Equal", "wr_k", 1], 0, at(["Max", ["Subtract", "wr_k", 1], 1], "wr_ends")]],
          ]),
          "integer",
        ),
        "integer",
      ),
    ),
  ),
];

export const PERMUTATION_BATCH_TEN_MAPS: readonly CombinatorialMap[] = [
  {
    name: "Tanimoto",
    from: "permutation",
    to: "permutation",
    body: tanimotoBody,
    summary:
      "Tanimoto's operator: every entry goes up by one with n becoming 1, except that an n at the front or the back is removed and a 1 is placed at the other end.",
    note: "FindStat's Mp00329, a bijection.",
  },
  {
    name: "DemazureProductWithInverse",
    from: "permutation",
    to: "permutation",
    body: demazureBody,
    summary: "The Demazure product π⁻¹ ⋆ π in the symmetric group.",
    note: "FindStat's Mp00159: π⁻¹ ⋆ π, the inverse on the left, folded over a reduced word of π. Not injective: it is a surjection onto the involutions.",
  },
  {
    name: "LewisLyuPylyavskyySenShape",
    from: "permutation",
    to: "integer_partition",
    body: lewisLyuPylyavskyySenBody,
    summary:
      "The Lewis, Lyu, Pylyavskyy and Sen shape: the conjugate of the partition whose k-th part is how much a k-th disjoint run of ascents adds to the most the first k − 1 total.",
    note: "FindStat's Mp00204, Sage's LLPS. A'_k = the most that k disjoint subsequences total in ascending runs, here by dynamic programming over the cut points of the reversed word (best[k][j] = max over i < j of best[k − 1][i] + the longest increasing subsequence of the block i + 1 .. j).",
  },
  {
    name: "WeakOrderRowmotion",
    from: "permutation",
    to: "permutation",
    body: weakOrderRowmotionBody,
    summary:
      "Rowmotion on the weak order: the reversal of the permutation whose Laguerre heap is the inverse of the input's, the heap's pieces being the descending runs.",
    note: "FindStat's Mp00326, a bijection (conjecturally rowmotion of the weak order, a semidistributive lattice).",
  },
];
