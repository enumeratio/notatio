// Promotion and the crystal cycle of a Gelfand-Tsetlin pattern, as Epsil. Both act on the pattern's tableau (the entries at
// most k form the shape at level k) by m - 1 passes, one per letter pair i, i + 1, over a flat list of the tableau's cells,
// row by row from the top, and read the pattern back off the cells.
//
// - Promotion is the product of the Bender-Knuth involutions t_i (a row's free i's and (i + 1)'s swap their counts), applied
//   t_{m-1} first; the inverse promotion applies t_1 first. This is the jeu de taquin promotion that removes the largest
//   entries, slides the rest outward and adds one.
// - The crystal reflection s_i brackets each i + 1 with a later i in the row reading word (bottom row first) and swaps the
//   counts of the unmatched i's and (i + 1)'s. The cycle applies s_{m-1} first, the inverse cycle s_1 first.

import { fold as typedFold } from "../../collections/src/families/tables.ts";
import { forEach, lets, type MathJSON } from "../../src/map-helpers.ts";

const fold = (...args: Parameters<typeof typedFold>): MathJSON => typedFold(...args) as MathJSON;
const at = (list: MathJSON, index: MathJSON): MathJSON => ["At", list, index];
const upTo = (n: MathJSON): MathJSON => ["Range", 1, n, 1];
const add = (...terms: MathJSON[]): MathJSON => ["Add", ...terms];
const sub = (a: MathJSON, b: MathJSON): MathJSON => ["Subtract", a, b];
const equal = (a: MathJSON, b: MathJSON): MathJSON => ["Equal", a, b];
const when = (condition: MathJSON, then: MathJSON, otherwise: MathJSON): MathJSON => ["If", condition, then, otherwise];
const keep = (over: MathJSON, test: MathJSON, variable: string): MathJSON => [
  "Filter",
  over,
  ["Function", test, variable],
];
const tally = (over: MathJSON, test: MathJSON, variable: string): MathJSON => ["Count", keep(over, test, variable)];
/** `forEach` as a fold: a list that is a value, not a lazy `Map`. */
const built = (over: MathJSON, body: MathJSON, variable: string): MathJSON =>
  fold(["Join", `${variable}_built`, ["List", body]], `${variable}_built`, variable, ["List"], over);
const flag = (condition: MathJSON): MathJSON => when(condition, 1, 0);

/** The pattern `_raw`'s tableau, as its rows: the rows are the shapes of the entries at most k, k = m down to 1 (row j of the
 *  shape at level k is entry j of the row of length k). Cell (j, c) holds the least k at which row j has reached length c. */
export const tableauOfPattern: MathJSON = [
  "If",
  ["Equal", ["Length", "_raw"], 0],
  ["List"],
  forEach(
    keep(upTo(["Length", "_raw"]), ["Greater", at(at("_raw", 1), "gt_j"), 0], "gt_j"),
    forEach(
      upTo(at(at("_raw", 1), "gt_j")),
      [
        "Min",
        keep(
          ["Range", "gt_j", ["Length", "_raw"], 1],
          ["GreaterEqual", at(at("_raw", sub(add(["Length", "_raw"], 1), "gt_k")), "gt_j"), "gt_c"],
          "gt_k",
        ),
      ],
      "gt_c",
    ),
    "gt_j",
  ),
];

/** The pattern of width `m` whose tableau has the cells `entries`, the cell p in row `rowOf[p]`: level k lists, for each row
 *  j at most k, how many of its cells hold an entry at most k. */
const patternOfCells = (m: MathJSON, entries: MathJSON, rowOf: MathJSON, size: MathJSON): MathJSON =>
  forEach(
    upTo(m),
    forEach(
      upTo(sub(add(m, 1), "pc_t")),
      tally(
        upTo(size),
        ["And", equal(at(rowOf, "pc_q"), "pc_j"), ["LessEqual", at(entries, "pc_q"), sub(add(m, 1), "pc_t")]],
        "pc_q",
      ),
      "pc_j",
    ),
    "pc_t",
  );

/** One Bender-Knuth involution t_i on the cells `e`. A cell holding i is free unless the cell below holds i + 1, one holding
 *  i + 1 unless the cell above holds i. In a row the free cells hold b i's after the pass, then the rest (i + 1)'s, where b
 *  is the row's number of free (i + 1)'s. */
const benderKnuth = (i: MathJSON): MathJSON =>
  lets(
    [
      [
        "bk_free",
        built(
          upTo("gp_size"),
          lets(
            [
              ["bk_j", at("gp_rowOf", "bk_p"), "integer"],
              ["bk_c", at("gp_columnOf", "bk_p"), "integer"],
              ["bk_v", at("gp_e", "bk_p"), "integer"],
            ],
            flag(
              when(
                equal("bk_v", i),
                [
                  "Not",
                  [
                    "And",
                    ["GreaterEqual", at("gp_lengths", add("bk_j", 1)), "bk_c"],
                    equal(at("gp_e", add("bk_p", at("gp_lengths", "bk_j"))), add(i, 1)),
                  ],
                ],
                when(
                  equal("bk_v", add(i, 1)),
                  [
                    "Not",
                    [
                      "And",
                      ["Greater", "bk_j", 1],
                      equal(at("gp_e", sub("bk_p", at("gp_lengths", sub("bk_j", 1)))), i),
                    ],
                  ],
                  "False",
                ),
              ),
            ),
          ),
          "bk_p",
        ),
        "list<integer>",
      ],
    ],
    built(
      upTo("gp_size"),
      when(
        equal(at("bk_free", "bk_p"), 1),
        when(
          [
            "LessEqual",
            tally(
              upTo("gp_size"),
              [
                "And",
                equal(at("gp_rowOf", "bk_q"), at("gp_rowOf", "bk_p")),
                ["LessEqual", "bk_q", "bk_p"],
                equal(at("bk_free", "bk_q"), 1),
              ],
              "bk_q",
            ),
            tally(
              upTo("gp_size"),
              [
                "And",
                equal(at("gp_rowOf", "bk_q"), at("gp_rowOf", "bk_p")),
                equal(at("bk_free", "bk_q"), 1),
                equal(at("gp_e", "bk_q"), add(i, 1)),
              ],
              "bk_q",
            ),
          ],
          i,
          add(i, 1),
        ),
        at("gp_e", "bk_p"),
      ),
      "bk_p",
    ),
  );

/** Whether cell q comes strictly before cell p in the reading word: a lower row, or the same row and further left. */
const before = (q: MathJSON, p: MathJSON): MathJSON => [
  "Or",
  ["Greater", at("gp_rowOf", q), at("gp_rowOf", p)],
  ["And", equal(at("gp_rowOf", q), at("gp_rowOf", p)), ["Less", q, p]],
];
const after = (q: MathJSON, p: MathJSON): MathJSON => before(p, q);

/** One crystal reflection s_i on the cells `e`: with S the running count of (i + 1)'s less i's along the reading word, an i is
 *  unmatched when S is below 0 and below every earlier S there, an (i + 1) when no later S falls below its own. The
 *  unmatched cells take b i's then the rest (i + 1)'s, b the number of unmatched (i + 1)'s. */
const reflection = (i: MathJSON): MathJSON =>
  lets(
    [
      [
        "cr_s",
        built(
          upTo("gp_size"),
          sub(
            tally(
              upTo("gp_size"),
              ["And", ["Or", before("cr_q", "cr_p"), equal("cr_q", "cr_p")], equal(at("gp_e", "cr_q"), add(i, 1))],
              "cr_q",
            ),
            tally(
              upTo("gp_size"),
              ["And", ["Or", before("cr_q", "cr_p"), equal("cr_q", "cr_p")], equal(at("gp_e", "cr_q"), i)],
              "cr_q",
            ),
          ),
          "cr_p",
        ),
        "list<integer>",
      ],
      [
        "cr_u",
        built(
          upTo("gp_size"),
          flag([
            "Or",
            [
              "And",
              equal(at("gp_e", "cr_p"), i),
              ["Less", at("cr_s", "cr_p"), 0],
              equal(
                tally(
                  upTo("gp_size"),
                  ["And", before("cr_q", "cr_p"), ["LessEqual", at("cr_s", "cr_q"), at("cr_s", "cr_p")]],
                  "cr_q",
                ),
                0,
              ),
            ],
            [
              "And",
              equal(at("gp_e", "cr_p"), add(i, 1)),
              equal(
                tally(
                  upTo("gp_size"),
                  ["And", after("cr_q", "cr_p"), ["Less", at("cr_s", "cr_q"), at("cr_s", "cr_p")]],
                  "cr_q",
                ),
                0,
              ),
            ],
          ]),
          "cr_p",
        ),
        "list<integer>",
      ],
      [
        "cr_b",
        tally(upTo("gp_size"), ["And", equal(at("cr_u", "cr_q"), 1), equal(at("gp_e", "cr_q"), add(i, 1))], "cr_q"),
        "integer",
      ],
    ],
    built(
      upTo("gp_size"),
      when(
        equal(at("cr_u", "cr_p"), 1),
        when(
          [
            "LessEqual",
            tally(
              upTo("gp_size"),
              ["And", ["Or", before("cr_q", "cr_p"), equal("cr_q", "cr_p")], equal(at("cr_u", "cr_q"), 1)],
              "cr_q",
            ),
            "cr_b",
          ],
          i,
          add(i, 1),
        ),
        at("gp_e", "cr_p"),
      ),
      "cr_p",
    ),
  );

/** The pattern `_raw` after `pass(i)` for i = m - 1 down to 1 (`descending`) or 1 up to m - 1. */
const passes = (pass: (i: MathJSON) => MathJSON, descending: boolean): MathJSON =>
  lets(
    [
      ["gp_m", ["Length", "_raw"], "integer"],
      ["gp_tableau", tableauOfPattern, "list<list<integer>>"],
      ["gp_start", ["Flatten", "gp_tableau"], "list<integer>"],
      ["gp_size", ["Length", "gp_start"], "integer"],
    ],
    when(
      equal("gp_size", 0),
      "_raw",
      lets(
        [
          [
            "gp_rowOf",
            [
              "Flatten",
              forEach(
                upTo(["Length", "gp_tableau"]),
                forEach(upTo(["Length", at("gp_tableau", "gp_r")]), "gp_r", "gp_k"),
                "gp_r",
              ),
            ],
            "list<integer>",
          ],
          [
            "gp_columnOf",
            [
              "Flatten",
              forEach(
                upTo(["Length", "gp_tableau"]),
                forEach(upTo(["Length", at("gp_tableau", "gp_r")]), "gp_k", "gp_k"),
                "gp_r",
              ),
            ],
            "list<integer>",
          ],
          // The top row's lengths, then a zero: the row below the last is empty.
          ["gp_lengths", ["Join", at("_raw", 1), ["List", 0]], "list<integer>"],
          [
            "gp_end",
            fold(
              lets([["gp_i", descending ? sub("gp_m", "gp_step") : "gp_step", "integer"]], pass("gp_i")),
              "gp_e",
              "gp_step",
              "gp_start",
              keep(upTo("gp_m"), ["Less", "gp_step", "gp_m"], "gp_step"),
              "list<integer>",
            ),
            "list<integer>",
          ],
        ],
        patternOfCells("gp_m", "gp_end", "gp_rowOf", "gp_size"),
      ),
    ),
  );

export const promotionBody: MathJSON = passes(benderKnuth, true);
export const inversePromotionBody: MathJSON = passes(benderKnuth, false);
export const cycleBody: MathJSON = passes(reflection, true);
export const inverseCycleBody: MathJSON = passes(reflection, false);
