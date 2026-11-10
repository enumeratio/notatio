// Combinatorial maps whose `from` carrier is a tableaux carrier (conventions as in
// `permutations/src/maps.ts`).

import { at, bind, forEach, lets, type CombinatorialMap, type MathJSON, positions } from "../../src/map-helpers.ts";
import { gyrationBody } from "./gyration.ts";
import { capacityState, evacuation, insertionRows, inversePromotion, inverseRsk, promotion } from "./flat.ts";

/** Rows must be nonempty and weakly shrinking: the carrier also holds the odd tableaux other families draw. */
const tableauGuard: MathJSON = [
  "And",
  ["Equal", ["Count", ["Filter", "_raw", ["Function", ["Equal", ["Length", "r"], 0], "r"]]], 0],
  [
    "Equal",
    [
      "Count",
      [
        "Filter",
        ["Range", 1, ["Subtract", ["Length", "_raw"], 1], 1],
        ["Function", ["Less", ["Length", at("i")], ["Length", at(["Add", "i", 1])]], "i"],
      ],
    ],
    0,
  ],
];

/** Whether part `side` of the pair `_raw` is a standard tableau: entries 1..n each once, rows and columns increasing,
 *  no empty row, and rows weakly shrinking (checked first in each column test, so the column read stays in range).
 *  Each part is bound inside its own check: the interpreter leaves a predicate undecided when it reads a name bound
 *  by an enclosing `bind` of another part. */
const standardRows = (side: number): MathJSON => bind("sr_t", at(side), standardBody("sr_t"), "list<list<integer>>");

const standardBody = (t: string): MathJSON => {
  const row = (i: MathJSON): MathJSON => at(i, t);
  const cell = (i: MathJSON, j: MathJSON): MathJSON => at(j, row(i));
  const count = (over: MathJSON, test: MathJSON, variable: string): MathJSON => [
    "Count",
    ["Filter", over, ["Function", test, variable]],
  ];
  // The entries are 1..n each once when each of 1..n occurs exactly once among the n entries (`Sort` doesn't compile).
  const onceEach: MathJSON = bind(
    "sr_f",
    ["Flatten", t],
    [
      "Equal",
      count(
        ["Range", 1, ["Length", "sr_f"], 1],
        ["Equal", count("sr_f", ["Equal", "sr_x", "sr_v"], "sr_x"), 1],
        "sr_v",
      ),
      ["Length", "sr_f"],
    ],
    "list<integer>",
  );
  return [
    "And",
    onceEach,
    ["Equal", count(["Range", 1, ["Length", t], 1], ["LessEqual", ["Length", row("sr_i")], 0], "sr_i"), 0],
    [
      "Equal",
      count(
        ["Range", 1, ["Length", t], 1],
        [
          "Greater",
          count(
            ["Range", 1, ["Subtract", ["Length", row("sr_i")], 1], 1],
            ["GreaterEqual", cell("sr_i", "sr_j"), cell("sr_i", ["Add", "sr_j", 1])],
            "sr_j",
          ),
          0,
        ],
        "sr_i",
      ),
      0,
    ],
    [
      "Equal",
      count(
        ["Range", 1, ["Subtract", ["Length", t], 1], 1],
        [
          "If",
          ["Greater", ["Length", row(["Add", "sr_i", 1])], ["Length", row("sr_i")]],
          "True",
          [
            "Greater",
            count(
              ["Range", 1, ["Length", row(["Add", "sr_i", 1])], 1],
              ["GreaterEqual", cell("sr_i", "sr_k"), cell(["Add", "sr_i", 1], "sr_k")],
              "sr_k",
            ),
            0,
          ],
        ],
        "sr_i",
      ),
      0,
    ],
  ];
};

/** The row lengths of part `side` of the pair `_raw`. */
const rowLengths = (side: number): MathJSON =>
  bind(
    "rl_t",
    at(side),
    forEach(["Range", 1, ["Length", "rl_t"], 1], ["Length", at("rl_i", "rl_t")], "rl_i"),
    "list<list<integer>>",
  );

/** `_raw` is a valid RSK image: two standard tableaux of one shape. Outside it inverse RSK has no permutation. */
// Staged with `If`, which is lazy: `And` evaluates every operand, and a read past the rows of a mismatched tableau is an error.
const rskImageGuard: MathJSON = [
  "If",
  ["Equal", rowLengths(1), rowLengths(2)],
  ["And", standardRows(1), standardRows(2)],
  "False",
];

/** The number of entries. */
const cells: MathJSON = ["Length", ["Flatten", "_raw"]];

/** The row holding entry v. */
const rowOfEntry = (v: MathJSON): MathJSON => [
  "IndexWhere",
  "_raw",
  // `Element` errors on the empty row the odd tableaux carry, so an empty row holds nothing by definition.
  ["Function", ["If", ["Equal", ["Length", "r"], 0], "False", ["Element", v, "r"]], "r"],
];

/** Whether entry i is a descent: i + 1 sits in a lower row. */
const descentAt = (i: MathJSON): MathJSON => ["Greater", rowOfEntry(["Add", i, 1]), rowOfEntry(i)];

/** The composition of n whose cut set is the entries i in 2 .. n - 1 satisfying `cut` (a predicate of i). */
const compositionCutWhere = (cut: MathJSON): MathJSON => [
  "If",
  ["Equal", cells, 0],
  ["List"],
  bind(
    "bounds",
    [
      "Join",
      ["List", 0],
      [
        "Fold",
        ["Function", ["If", cut, ["Join", "acc", ["List", "i"]], "acc"], "acc", "i"],
        ["List"],
        ["Range", 2, ["Subtract", cells, 1], 1],
      ],
      ["List", cells],
    ],
    forEach(
      ["Range", 1, ["Subtract", ["Length", "bounds"], 1], 1],
      ["Subtract", at(["Add", "q", 1], "bounds"), at("q", "bounds")],
      "q",
    ),
    "list<integer>",
  ),
];

const upTo = (count: MathJSON): MathJSON => ["Range", 1, count, 1];
const entryOf = (list: MathJSON, index: MathJSON): MathJSON => ["At", list, index];
/** The position of v in `list`, which holds it once (`IndexWhere` may be Nothing, which a `Map` body can't compile). */
const positionOf = (list: MathJSON, v: MathJSON): MathJSON => [
  "Min",
  ["Filter", upTo(["Length", list]), ["Function", ["Equal", entryOf(list, "z"), v], "z"]],
];
/** `list` with the entries at positions a and b exchanged. */
const exchanged = (list: MathJSON, a: MathJSON, b: MathJSON): MathJSON =>
  forEach(
    upTo(["Length", list]),
    ["If", ["Equal", "q", a], entryOf(list, b), ["If", ["Equal", "q", b], entryOf(list, a), entryOf(list, "q")]],
    "q",
  );

/** Two lists of `cells` entries end to end, as a fresh list: a `Join` of lazy lists stays lazy, and an accumulator must not. */
const appended = (first: MathJSON, second: MathJSON): MathJSON =>
  forEach(
    upTo(["Multiply", 2, cells]),
    ["If", ["LessEqual", "j", cells], entryOf(first, "j"), entryOf(second, ["Subtract", "j", cells])],
    "j",
  );

/** Whether the two lists have the same descent positions. */
const sameDescents = (first: MathJSON, second: MathJSON): MathJSON => [
  "Equal",
  [
    "Count",
    [
      "Filter",
      upTo(["Subtract", cells, 1]),
      [
        "Function",
        [
          "Not",
          [
            "Equal",
            ["If", ["Greater", entryOf(first, "e"), entryOf(first, ["Add", "e", 1])], 1, 0],
            ["If", ["Greater", entryOf(second, "e"), entryOf(second, ["Add", "e", 1])], 1, 0],
          ],
        ],
        "e",
      ],
    ],
  ],
  0,
];

/** One t-action. The state is the labelling P then the tableau T, each by cell in reading order. P goes to P with its
 *  first column descent d exchanged with d + 1; T has the two cells' entries exchanged unless that leaves the descents
 *  of the linear extension unchanged. */
const tableauAction: MathJSON = bind(
  "ra_p",
  forEach(upTo(cells), entryOf("ra_acc", "q"), "q"),
  bind(
    "ra_t",
    forEach(upTo(cells), entryOf("ra_acc", ["Add", "q", cells]), "q"),
    bind(
      "ra_d",
      [
        "Min",
        [
          "Join",
          [
            "Filter",
            upTo(["Subtract", cells, 1]),
            [
              "Function",
              [
                "Less",
                entryOf("ra_col", positionOf("ra_p", ["Add", "d", 1])),
                entryOf("ra_col", positionOf("ra_p", "d")),
              ],
              "d",
            ],
          ],
          ["List", cells],
        ],
      ],
      [
        "If",
        ["Equal", "ra_d", cells],
        "ra_acc",
        bind(
          "ra_a",
          positionOf("ra_p", "ra_d"),
          bind(
            "ra_b",
            positionOf("ra_p", ["Add", "ra_d", 1]),
            bind(
              "ra_q",
              exchanged("ra_p", "ra_a", "ra_b"),
              bind(
                "ra_s",
                [
                  "If",
                  sameDescents(
                    forEach(upTo(cells), entryOf("ra_p", positionOf("ra_t", "e")), "e"),
                    forEach(upTo(cells), entryOf("ra_q", positionOf("ra_t", "e")), "e"),
                  ),
                  "ra_t",
                  exchanged("ra_t", "ra_a", "ra_b"),
                ],
                appended("ra_q", "ra_s"),
                "list<integer>",
              ),
              "list<integer>",
            ),
            "integer",
          ),
          "integer",
        ),
      ],
      "integer",
    ),
    "list<integer>",
  ),
  "list<integer>",
);

/** Start from the natural labelling P = 1, 2, … and act by t_d at its first column descent d until it has none, carrying
 *  the tableau along. P's column descents depend on P alone, and n² steps are more than it needs. */
const rowDescentsToColumnDescents: MathJSON = [
  "If",
  ["Less", cells, 2],
  "_raw",
  bind(
    "ra_col",
    ["Flatten", forEach(upTo(["Length", "_raw"]), forEach(upTo(["Length", at("r")]), "c", "c"), "r")],
    bind(
      "ra_row",
      ["Flatten", forEach(upTo(["Length", "_raw"]), forEach(upTo(["Length", at("r")]), "r", "c"), "r")],
      lets(
        [
          // Indexing a list not typed a list of integers may give Nothing, which a `Map` body can't compile.
          ["ra_natural", forEach(upTo(cells), "c", "c"), "list<integer>"],
          ["ra_flat", ["Flatten", "_raw"], "list<integer>"],
          [
            "ra_end",
            [
              "Fold",
              ["Function", bind("ra_acc", "ra_state", tableauAction, "list<integer>"), "ra_state", "ra_step"],
              appended("ra_natural", "ra_flat"),
              upTo(["Multiply", cells, cells]),
            ],
            "list<integer>",
          ],
        ],
        // T's cell in reading order c is entry cells + c of the state, and the cells of row r are consecutive.
        forEach(
          upTo(["Length", "_raw"]),
          forEach(
            upTo(["Length", at("r")]),
            entryOf("ra_end", [
              "Add",
              cells,
              ["Count", ["Filter", upTo(cells), ["Function", ["Less", entryOf("ra_row", "z"), "r"], "z"]]],
              "c",
            ]),
            "c",
          ),
          "r",
        ),
      ),
      "list<integer>",
    ),
    "list<integer>",
  ),
];

export const TABLEAUX_MAPS: readonly CombinatorialMap[] = [
  {
    name: "TableauShape",
    from: "standard_tableau",
    to: "integer_partition",
    body: forEach(["Range", 1, ["Length", "_raw"], 1], ["Length", at("i")]),
    summary: "The shape of a standard tableau: its row lengths.",
    note: "Lossy: the entries are forgotten, so it is not a constructor overload.",
  },
  {
    name: "TransposeTableau",
    from: "standard_tableau",
    to: "standard_tableau",
    // Column j collects entry j of every row long enough to have one.
    body: [
      "If",
      ["Equal", ["Length", "_raw"], 0],
      ["List"],
      forEach(
        ["Range", 1, ["Length", at(1)], 1],
        [
          "Map",
          ["Function", at("j", at("r")), "r"],
          [
            "Filter",
            ["Range", 1, ["Length", "_raw"], 1],
            ["Function", ["GreaterEqual", ["Length", at("r")], "j"], "r"],
          ],
        ],
        "j",
      ),
    ],
    guard: tableauGuard,
    summary: "The conjugate tableau: rows and columns exchanged.",
    note: "Its shape is the conjugate of the original's, so it is TransposePartition on shapes.",
  },
  {
    name: "ToPermutation",
    from: "standard_tableau_pair",
    to: "permutation",
    // The pair is read bare (`argumentParts`) and typed as its rows (`compiledFrom`): the carrier alias has no compiled type.
    body: lets(
      [
        ["tp_pp", at(1), "list<list<integer>>"],
        ["tp_qq", at(2), "list<list<integer>>"],
        ["tp_n", ["Length", ["Flatten", "tp_pp"]], "integer"],
        ["tp_p", capacityState("tp_a", "tp_pp", "tp_n"), "list<integer>"],
        ["tp_q", capacityState("tp_b", "tp_qq", "tp_n"), "list<integer>"],
      ],
      inverseRsk("tp_r", "tp_p", "tp_q", "tp_n"),
    ),
    guard: rskImageGuard,
    argumentParts: ["StandardTableau", "StandardTableau"],
    compiledFrom: "tuple<list<list<integer>>, list<list<integer>>>",
    summary: "The permutation an RSK pair comes from: inverse RSK.",
    note: "Unbumps the cell holding n in Q, then n − 1, and so on, each time reading a letter off the first row of P.",
  },
  {
    name: "TableauDescentWord",
    from: "standard_tableau",
    to: "binary_word",
    body: forEach(["Range", 1, ["Subtract", cells, 1], 1], ["If", descentAt("i"), 1, 0]),
    guard: tableauGuard,
    summary: "Letter i is 1 when entry i + 1 sits in a lower row than entry i.",
    note: "FindStat's Mp00134. The word is one letter shorter than the tableau has entries.",
  },
  {
    name: "ReadingWord",
    from: "standard_tableau",
    to: "permutation",
    body: [
      "Flatten",
      forEach(["Range", 1, ["Length", "_raw"], 1], at(["Subtract", ["Add", ["Length", "_raw"], 1], "i"])),
    ],
    guard: tableauGuard,
    summary: "The rows read left to right, from the bottom row up, as a permutation.",
    note: "FindStat's Mp00081, the row reading word. Injective; RskInsertion of it is the tableau back again.",
  },
  {
    name: "PeakComposition",
    from: "standard_tableau",
    to: "composition",
    body: compositionCutWhere(["And", descentAt("i"), ["Not", descentAt(["Subtract", "i", 1])]]),
    guard: tableauGuard,
    summary: "The composition cut at the peaks: entries i that are descents after an ascent.",
    note: "FindStat's Mp00294. An entry is a descent when the next one sits in a lower row.",
  },
  {
    name: "ValleyComposition",
    from: "standard_tableau",
    to: "composition",
    body: compositionCutWhere(["And", descentAt(["Subtract", "i", 1]), ["Not", descentAt("i")]]),
    guard: tableauGuard,
    summary: "The composition cut at the valleys: entries i that are ascents after a descent.",
    note: "FindStat's Mp00295.",
  },
  {
    name: "Evacuation",
    from: "standard_tableau",
    to: "standard_tableau",
    body: evacuation("ev", "_raw"),
    guard: tableauGuard,
    summary:
      "Schützenberger's evacuation (involution): remove the entry 1, slide the rest in, and give the cell that empties the largest label, until nothing is left.",
    note: "FindStat's Mp00085. Computed as the insertion tableau of the reading word reversed and complemented; the same shape, and an involution.",
  },
  {
    name: "TableauPromotion",
    from: "standard_tableau",
    to: "standard_tableau",
    body: promotion("_raw"),
    guard: tableauGuard,
    summary:
      "Promotion: replace the largest entry by a hole, slide it to the corner at the origin, and add one to every entry.",
    note: "FindStat's Mp00155, the inverse of InverseTableauPromotion. The hole is walked through the rows entry by entry, as jeu de taquin does.",
  },
  {
    name: "InverseTableauPromotion",
    from: "standard_tableau",
    to: "standard_tableau",
    body: inversePromotion("_raw"),
    guard: tableauGuard,
    summary:
      "Inverse promotion: replace the entry 1 by n + 1, slide it out to the rim, and subtract one from every entry.",
    note: "FindStat's Mp00153, the inverse of TableauPromotion. The hole is walked through the rows entry by entry, as jeu de taquin does.",
  },
  {
    name: "Catabolism",
    from: "standard_tableau",
    to: "standard_tableau",
    // Column-inserting the removed row's entries, largest first, into what is left is row-inserting the row followed by
    // the reading word of what is left (a letter put in front of a word's tableau is column-inserted into it).
    body: [
      "If",
      ["Equal", cells, 0],
      ["List"],
      insertionRows("cb", [
        "Flatten",
        forEach(
          ["Range", 1, ["Length", "_raw"], 1],
          at(["If", ["Equal", "r", 1], 1, ["Subtract", ["Add", ["Length", "_raw"], 2], "r"]]),
          "r",
        ),
      ]),
    ],
    guard: tableauGuard,
    summary: "Remove the first row and column-insert its entries back into the rest, largest first.",
    note: "FindStat's Mp00106. Not injective: a row and a column of the same size both give the row.",
  },
  {
    name: "RowDescentsToColumnDescents",
    from: "standard_tableau",
    to: "standard_tableau",
    body: rowDescentsToColumnDescents,
    guard: tableauGuard,
    summary: "A standard tableau of the same shape whose column descents are the original's row descents.",
    note: "FindStat's Mp00226, a bijection. From the natural labelling of the shape, d and d + 1 are exchanged at each column descent d, the tableau following by the same exchange unless that keeps its descents.",
  },
  {
    name: "RowSetPartition",
    from: "standard_tableau",
    to: "set_partition",
    body: "_raw",
    guard: tableauGuard,
    summary: "The set partition whose blocks are the rows of the tableau.",
    note: "FindStat's Mp00284. Injective on the tableaux of a given shape; the shape is the sequence of block sizes.",
  },
  {
    name: "CounterclockwiseRotation",
    from: "alternating_sign_matrix",
    to: "alternating_sign_matrix",
    // Row i of the turn is column n + 1 - i of the matrix, read down.
    body: forEach(positions, forEach(positions, at(["Subtract", ["Add", ["Length", "_raw"], 1], "i"], at("j")), "j")),
    summary: "The quarter turn counterclockwise: the last column becomes the first row.",
    note: "FindStat's Mp00003; the inverse is ClockwiseRotation.",
  },
  {
    name: "ClockwiseRotation",
    from: "alternating_sign_matrix",
    to: "alternating_sign_matrix",
    // Row i of the turn is column i of the matrix, read up.
    body: forEach(positions, forEach(positions, at("i", at(["Subtract", ["Add", ["Length", "_raw"], 1], "j"])), "j")),
    summary: "The quarter turn clockwise: the first column becomes the first row, read from the bottom.",
    note: "FindStat's Mp00004; the inverse is CounterclockwiseRotation.",
  },
  {
    name: "TransposeAlternatingSignMatrix",
    from: "alternating_sign_matrix",
    to: "alternating_sign_matrix",
    body: forEach(positions, forEach(positions, at("i", at("j")), "j")),
    summary: "The transpose: rows become columns.",
    note: "FindStat's Mp00005, an involution.",
  },
  {
    name: "Gyration",
    from: "alternating_sign_matrix",
    to: "alternating_sign_matrix",
    body: gyrationBody,
    summary: "Wieland's gyration: the height function toggled at the vertices of even parity, then of odd parity.",
    note: "FindStat's Mp00006, a bijection of the alternating sign matrices of a size.",
  },
  {
    name: "SemistandardTableauShape",
    from: "semistandard_tableau",
    to: "integer_partition",
    body: forEach(["Range", 1, ["Length", "_raw"], 1], ["Length", at("i")]),
    summary: "The shape of a semistandard tableau: its row lengths.",
    note: "FindStat's Mp00077.",
  },
];
