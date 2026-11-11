// Maps from alternating sign matrices (Mp00001, Mp00002, Mp00007, Mp00333, Mp00334, Mp00098).

import { fold as typedFold } from "../../collections/src/families/tables.ts";
import { bind, lets, type CombinatorialMap, type MathJSON } from "../../src/map-helpers.ts";
import { vertexOf, withLinkPattern } from "./fully-packed-loop.ts";
import {
  corner,
  countOf,
  eachOf,
  entry,
  half,
  item,
  minus,
  order,
  plus,
  upTo,
  withTriangle,
} from "./monotone-triangle.ts";

const fold = (...args: Parameters<typeof typedFold>): MathJSON => typedFold(...args) as MathJSON;

const isEmpty: MathJSON = ["Equal", order, 0];

/** Mp00001: row i of the tableau holds k as often as the i-th part of the partition n + 1 - (i-th entry) of row k of
 *  the triangle of the transpose grows; entry j of row i is the first k >= i whose i-th entry is at most n + 1 - j. */
const semistandardTableauBody: MathJSON = [
  "If",
  isEmpty,
  ["List"],
  withTriangle(
    true,
    eachOf(
      upTo(order),
      eachOf(
        upTo(minus(plus(order, 1), "st_i")),
        plus(
          "st_i",
          countOf(
            ["Range", "st_i", order, 1],
            ["Greater", entry("st_k", "st_i"), minus(plus(order, 1), "st_j")],
            "st_k",
          ),
        ),
        "st_j",
      ),
      "st_i",
    ),
  ),
];

/** Mp00007: the numbers n + 1 - (largest entry of row k) form a nondecreasing parking function; with c_j of them at
 *  most j, the path has down steps at the positions 2n + 1 - (j + c_j) (the word with block j = c_j ups, a down, then
 *  reversed and complemented). */
const diagonalDyckBody: MathJSON = [
  "If",
  isEmpty,
  ["List"],
  withTriangle(
    false,
    lets(
      [
        [
          "dd_cars",
          eachOf(
            upTo(order),
            countOf(upTo(order), ["LessEqual", minus(plus(order, 1), entry("dd_k", "dd_k")), "dd_j"], "dd_k"),
            "dd_j",
          ),
          "list<integer>",
        ],
      ],
      eachOf(
        upTo(["Multiply", 2, order]),
        countOf(
          upTo(order),
          ["Equal", plus("dd_j", item("dd_cars", "dd_j")), minus(plus(["Multiply", 2, order], 1), "dd_t")],
          "dd_j",
        ),
        "dd_t",
      ),
    ),
  ),
];

/** Mp00334: the heights H(i, j) = i + j - 2 Q(i, j) of the transpose along the diagonal and the next diagonal,
 *  H(0, 0), H(0, 1), H(1, 1), H(1, 2), ..., H(n, n); up where the height rises. */
const diagonalHeightBody: MathJSON = [
  "If",
  isEmpty,
  ["List"],
  withTriangle(
    true,
    lets(
      [
        [
          "dh_h",
          eachOf(
            ["Range", 0, ["Multiply", 2, order], 1],
            [
              "If",
              ["Equal", ["Mod", "dh_m", 2], 0],
              minus("dh_m", ["Multiply", 2, corner(half("dh_m"), half("dh_m"))]),
              minus("dh_m", ["Multiply", 2, corner(plus(half("dh_m"), 1), half("dh_m"))]),
            ],
            "dh_m",
          ),
          "list<integer>",
        ],
      ],
      eachOf(
        upTo(["Multiply", 2, order]),
        ["If", ["Greater", item("dh_h", plus("dh_t", 1)), item("dh_h", "dh_t")], 1, 0],
        "dh_t",
      ),
    ),
  ),
];

/** Column j of the tableau of the transpose, read down: entry i is the first k >= i whose triangle row has dropped its
 *  i-th entry to n + 1 - j or below. */
const columnEntry = (i: MathJSON, j: MathJSON): MathJSON =>
  plus(i, countOf(["Range", i, order, 1], ["Greater", entry("lk_k", i), minus(plus(order, 1), j)], "lk_k"));

/** Willis's scan for the left key: column j of the key starts as column j of the tableau and, for each column t before
 *  it from j - 1 down to 1, every entry (the bottom one first) is replaced by the largest entry of column t that does
 *  not exceed it and lies below the entry just chosen beneath it. */
const scanned = (j: MathJSON): MathJSON =>
  fold(
    [
      "If",
      ["Less", "lk_s", j],
      bind(
        "lk_picks",
        fold(
          // The pick for row h + 1 - r, appended after the picks so far (the first entry is a bound above every pick).
          [
            "Join",
            "lk_acc",
            [
              "List",
              item(
                item("lk_c", minus(j, "lk_s")),
                countOf(
                  item("lk_c", minus(j, "lk_s")),
                  [
                    "LessEqual",
                    "lk_y",
                    [
                      "Min",
                      item("lk_cur", minus(plus(["Length", "lk_cur"], 1), "lk_r")),
                      minus(item("lk_acc", "lk_r"), 1),
                    ],
                  ],
                  "lk_y",
                ),
              ),
            ],
          ],
          "lk_acc",
          "lk_r",
          ["List", ["Multiply", 2, plus(order, 1)]],
          upTo(["Length", "lk_cur"]),
          "list<integer>",
        ),
        eachOf(upTo(["Length", "lk_cur"]), item("lk_picks", plus(["Length", "lk_cur"], 2, ["Negate", "lk_i"])), "lk_i"),
        "list<integer>",
      ),
      "lk_cur",
    ],
    "lk_cur",
    "lk_s",
    item("lk_c", j),
    upTo(order),
    "list<integer>",
  ) as MathJSON;

/** Mp00002: the entry dropped from key column j to key column j + 1, read from the last column to the first. */
const leftKeyBody: MathJSON = [
  "If",
  isEmpty,
  ["List"],
  withTriangle(
    true,
    lets(
      [
        [
          "lk_c",
          eachOf(upTo(order), eachOf(upTo(minus(plus(order, 1), "lk_j")), columnEntry("lk_i", "lk_j"), "lk_i"), "lk_j"),
          "list<list<integer>>",
        ],
        ["lk_key", eachOf(upTo(order), scanned("lk_j"), "lk_j"), "list<list<integer>>"],
      ],
      eachOf(
        upTo(order),
        [
          "Subtract",
          ["Sum", eachOf(item("lk_key", minus(plus(order, 1), "lk_q")), "lk_x", "lk_x")],
          [
            "If",
            ["Less", minus(plus(order, 1), "lk_q"), order],
            ["Sum", eachOf(item("lk_key", plus(minus(plus(order, 1), "lk_q"), 1)), "lk_x", "lk_x")],
            0,
          ],
        ],
        "lk_q",
      ),
    ),
  ),
];

const partnerOf = (a: MathJSON): MathJSON => item("fp_partner", a);

/** Mp00098: the pairs (a, partner of a) with a the smaller, in order of a. */
const linkPatternBody: MathJSON = [
  "If",
  isEmpty,
  ["List"],
  withLinkPattern(
    lets(
      [
        [
          "lp_flat",
          [
            "Flatten",
            eachOf(
              upTo(["Multiply", 2, order]),
              ["If", ["Greater", partnerOf("lp_a"), "lp_a"], ["List", "lp_a", partnerOf("lp_a")], ["List"]],
              "lp_a",
            ),
          ],
          "list<integer>",
        ],
      ],
      eachOf(
        upTo(order),
        ["List", item("lp_flat", minus(["Multiply", 2, "lp_k"], 1)), item("lp_flat", ["Multiply", 2, "lp_k"])],
        "lp_k",
      ),
    ),
  ),
];

/** Mp00333: join the vertices (points 2v - 1 and 2v) along the pairs of the link pattern, which takes n rounds of
 *  passing the smallest label to the vertices each vertex's points are joined to; vertex v then opens one up step
 *  and, when it is the largest of its block, closes as many times as the block has vertices. */
const linkPatternDyckBody: MathJSON = [
  "If",
  isEmpty,
  ["List"],
  withLinkPattern(
    lets(
      [
        [
          "ld_label",
          fold(
            eachOf(
              upTo(order),
              [
                "Min",
                item("ld_acc", "ld_v"),
                item("ld_acc", vertexOf(partnerOf(minus(["Multiply", 2, "ld_v"], 1)))),
                item("ld_acc", vertexOf(partnerOf(["Multiply", 2, "ld_v"]))),
              ],
              "ld_v",
            ),
            "ld_acc",
            "ld_t",
            upTo(order),
            upTo(order),
            "list<integer>",
          ),
          "list<integer>",
        ],
      ],
      [
        "Flatten",
        eachOf(
          upTo(order),
          [
            "Join",
            ["List", 1],
            eachOf(
              [
                "Range",
                1,
                [
                  "If",
                  [
                    "Equal",
                    countOf(
                      upTo(order),
                      [
                        "And",
                        ["Equal", item("ld_label", "ld_u"), item("ld_label", "ld_v")],
                        ["Greater", "ld_u", "ld_v"],
                      ],
                      "ld_u",
                    ),
                    0,
                  ],
                  countOf(upTo(order), ["Equal", item("ld_label", "ld_u"), item("ld_label", "ld_v")], "ld_u"),
                  0,
                ],
                1,
              ],
              0,
              "ld_z",
            ),
          ],
          "ld_v",
        ),
      ],
    ),
  ),
];

export const ALTERNATING_SIGN_MAPS: readonly CombinatorialMap[] = [
  {
    name: "LeftKeyPermutation",
    from: "alternating_sign_matrix",
    to: "permutation",
    body: leftKeyBody,
    summary:
      "The permutation of the left key of the matrix: the columns of its tableau slid left by Willis's scan give a key tableau, whose columns drop one entry each.",
    note: "FindStat's Mp00002 (Lascoux; Aval, Keys and alternating sign matrices). Surjective.",
  },
  {
    name: "SemistandardTableau",
    convert: true,
    from: "alternating_sign_matrix",
    to: "semistandard_tableau",
    body: semistandardTableauBody,
    summary:
      "The semistandard tableau of the monotone triangle: each row of the triangle is a partition, and the cells between consecutive partitions are filled with the next number.",
    note: "FindStat's Mp00001, Sage's to_semistandard_tableau. Injective: the monotone triangle is read back from the tableau.",
    findstat: ["Mp00001"],
  },
  {
    name: "DyckPath",
    convert: true,
    from: "alternating_sign_matrix",
    to: "dyck_path",
    body: diagonalDyckBody,
    summary:
      "The Dyck path of the last diagonal of the monotone triangle: its entries n + 1 - (largest entry of row k) are a nondecreasing parking function, whose Dyck path is reversed and complemented.",
    note: "FindStat's Mp00007. Surjective; a permutation matrix goes to the path of its parking function.",
    findstat: ["Mp00007"],
  },
  {
    name: "PerfectMatching",
    convert: true,
    from: "alternating_sign_matrix",
    to: "perfect_matching",
    body: linkPatternBody,
    summary:
      "The link pattern of the matrix's fully packed loop: the 2n boundary points on the loop, numbered clockwise from the top left, joined by the loop's paths.",
    note: "FindStat's Mp00098, Sage's FullyPackedLoop(A).link_pattern(). A noncrossing matching; every one is reached.",
    findstat: ["Mp00098"],
  },
  {
    name: "LinkPatternDyckPath",
    from: "alternating_sign_matrix",
    to: "dyck_path",
    body: linkPatternDyckBody,
    summary:
      "The Dyck path of the link pattern: the pattern's points taken two at a time as n vertices, a vertex opening one up step and, when it is the largest of its block of joined vertices, closing once per vertex of the block.",
    note: "FindStat's Mp00333, Sage's to_dyck_word('link_pattern'). Surjective.",
  },
  {
    name: "DiagonalHeightDyckPath",
    from: "alternating_sign_matrix",
    to: "dyck_path",
    body: diagonalHeightBody,
    summary:
      "The Dyck path whose heights are the height function of the matrix along the diagonal and the diagonal beside it.",
    note: "FindStat's Mp00334 (Lemma 3.7 of arXiv 2511.06968). Surjective.",
  },
];
