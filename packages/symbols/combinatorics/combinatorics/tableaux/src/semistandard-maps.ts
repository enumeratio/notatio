// Maps from semistandard tableaux (Mp00075, Mp00107, Mp00225).

import { at, forEach, lets, type CombinatorialMap, type MathJSON } from "../../src/map-helpers.ts";
import { weakInsertionRows } from "./weak-insertion.ts";

const upTo = (n: MathJSON): MathJSON => ["Range", 1, n, 1];
const rowCount: MathJSON = ["Length", "_raw"];
const cells: MathJSON = ["Length", ["Flatten", "_raw"]];
const keep = (over: MathJSON, test: MathJSON, variable: string): MathJSON => [
  "Filter",
  over,
  ["Function", test, variable],
];

/** The row `r` places from the bottom (r = 1 is the last row). */
const rowFromBottom = (r: MathJSON): MathJSON => at(["Subtract", ["Add", rowCount, 1], r]);

/** The standardization read bottom row first: each cell takes one more than the number of cells before it in the order
 *  (value, column), which is the order equal entries (a horizontal strip, one to a column) take left to right. */
const readingWord: MathJSON = [
  "If",
  ["Equal", cells, 0],
  ["List"],
  lets(
    [
      ["rw_e", ["Flatten", forEach(upTo(rowCount), rowFromBottom("rw_r"), "rw_r")], "list<integer>"],
      [
        "rw_c",
        ["Flatten", forEach(upTo(rowCount), forEach(upTo(["Length", rowFromBottom("rw_r")]), "rw_k", "rw_k"), "rw_r")],
        "list<integer>",
      ],
    ],
    forEach(
      upTo(cells),
      [
        "Add",
        1,
        [
          "Count",
          keep(
            upTo(cells),
            [
              "Or",
              ["Less", at("rw_q", "rw_e"), at("rw_i", "rw_e")],
              [
                "And",
                ["Equal", at("rw_q", "rw_e"), at("rw_i", "rw_e")],
                ["Less", at("rw_q", "rw_c"), at("rw_i", "rw_c")],
              ],
            ],
            "rw_q",
          ),
        ],
      ],
      "rw_i",
    ),
  ),
];

/** The first row, then the reading word (rows from the bottom up) of the rest. Row-inserting it column-inserts the first
 *  row's entries, largest first, into the rest. */
const catabolismWord: MathJSON = [
  "Flatten",
  forEach(upTo(rowCount), at(["If", ["Equal", "cb_r", 1], 1, ["Subtract", ["Add", rowCount, 2], "cb_r"]]), "cb_r"),
];

/** The weight sorted largest first: part k counts the entries v whose multiplicity is at least t, for as many t as
 *  there are, and part k is the number of t at which that count is at least k. */
const sortedWeight: MathJSON = [
  "If",
  ["Equal", cells, 0],
  ["List"],
  lets(
    [
      ["sw_m", ["Max", ["Flatten", "_raw"]], "integer"],
      [
        "sw_w",
        forEach(upTo("sw_m"), ["Count", keep(["Flatten", "_raw"], ["Equal", "sw_x", "sw_v"], "sw_x")], "sw_v"),
        "list<integer>",
      ],
      [
        "sw_u",
        forEach(
          upTo(cells),
          ["Count", keep(upTo("sw_m"), ["GreaterEqual", at("sw_v", "sw_w"), "sw_t"], "sw_v")],
          "sw_t",
        ),
        "list<integer>",
      ],
    ],
    forEach(
      upTo(at(1, "sw_u")),
      ["Count", keep(upTo(cells), ["GreaterEqual", at("sw_t", "sw_u"), "sw_k"], "sw_t")],
      "sw_k",
    ),
  ),
];

export const SEMISTANDARD_MAPS: readonly CombinatorialMap[] = [
  {
    name: "ReadingWord",
    from: "semistandard_tableau",
    to: "permutation",
    body: readingWord,
    summary: "The rows read left to right, from the bottom row up, standardized into a permutation.",
    note: "FindStat's Mp00075. Equal entries are ranked left to right, so the permutation's insertion tableau is the standardization of the tableau.",
  },
  {
    name: "Catabolism",
    from: "semistandard_tableau",
    to: "semistandard_tableau",
    body: ["If", ["Equal", cells, 0], ["List"], weakInsertionRows("cb", catabolismWord)],
    summary: "Remove the first row and column-insert its entries back into the rest, largest first.",
    note: "FindStat's Mp00107. Not injective.",
  },
  {
    name: "TableauWeight",
    from: "semistandard_tableau",
    to: "integer_partition",
    body: sortedWeight,
    summary: "The multiplicities of the entries, largest first: the weight, sorted.",
    note: "FindStat's Mp00225. Entries that do not occur contribute nothing.",
  },
];
