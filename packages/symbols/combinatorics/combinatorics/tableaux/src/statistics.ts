// Standard-tableau statistics, over `_x` = the rows of the tableau (English notation, entries 1 .. n).
//
// A list of rows can be mapped and flattened but not indexed, so every definition reads integer
// lists: the entries row by row, the length of each row, and the first or last entry of each row.
// Where a statistic follows entry e to e + 1, `rowIds` and `columnIds` give the row and column of
// each reading position, and `IndexOf` finds the position of an entry.

import type { Definition, MathJSON } from "../../src/statistics/types.ts";
import {
  add,
  and,
  at,
  atLeastValue,
  atMostValue,
  bindList,
  equals,
  floored,
  forEach,
  greater,
  length,
  less,
  max,
  nonEmpty,
  or,
  positions,
  subtract,
  sumOver,
  x,
} from "../../src/statistics/vocabulary.ts";

const on = "StandardTableau";
const stat = (head: string, summary: string, expr: MathJSON, note?: string): Definition => ({
  head,
  on,
  summary,
  expr,
  ...(note ? { note } : {}),
});

const through = (n: MathJSON): MathJSON => ["Range", 1, n, 1];

const reading: MathJSON = ["Flatten", x];
const lengths: MathJSON = forEach(x, length("r"), "r");
const firsts: MathJSON = forEach(x, at(1, "r"), "r");
const lasts: MathJSON = forEach(x, ["Last", "r"], "r");
/** `body` with the entries row by row as `reading` and the row lengths as `lengths`. */
const withReading = (body: MathJSON): MathJSON => bindList("reading", reading, bindList("lengths", lengths, body));
/** `body` for a tableau of at least `m` entries, 0 otherwise. */
const cellsAtLeast = (m: number, body: MathJSON): MathJSON => ["If", less(length(reading), m), 0, body];

/** The row and the column of the cell at each position of `reading`. */
const rowIds: MathJSON = ["Flatten", forEach(positions, forEach(through(at("i", "lengths")), "i", "j"), "i")];
const columnIds: MathJSON = ["Flatten", forEach(positions, through(at("i", "lengths")), "i")];
const rowOf = (entry: MathJSON): MathJSON => at(["IndexOf", "reading", entry], "rowIds");
const columnOf = (entry: MathJSON): MathJSON => at(["IndexOf", "reading", entry], "columnIds");
const withRows = (body: MathJSON): MathJSON => withReading(bindList("rowIds", rowIds, body));
const withColumns = (body: MathJSON): MathJSON => withRows(bindList("columnIds", columnIds, body));

/** The entries e = 1 .. n - 1, those with a successor, counted (or summed, `weight` being e) where `test` holds. */
const overSuccessors = (test: MathJSON, weight: MathJSON = 1): MathJSON =>
  floored(sumOver(through(subtract(length("reading"), 1)), ["If", test, weight, 0], "e"));
const successor = add("e", 1);
const successorBelow = greater(rowOf(successor), rowOf("e"));
const successorAbove = less(rowOf(successor), rowOf("e"));
const successorNotBelow = atMostValue(rowOf(successor), rowOf("e"));
/** Each entry e with a successor counts n - e, the entries from e + 1 on. */
const entriesAfter = subtract(length("reading"), "e");

/** The rows 1 .. d reach their own column; the cell (d, d) is the cells of the rows above it, then d along. */
const diagonalLength = floored(sumOver(positions, ["If", atLeastValue(at("i", "lengths"), "i"), 1, 0]));
const diagonalPosition = add(
  floored(sumOver(positions, ["If", less("i", "diagonal"), at("i", "lengths"), 0])),
  "diagonal",
);
/** The largest entry is the last of the row it is in. */
const rowOfLargest: MathJSON = ["IndexOf", "lasts", max("lasts")];

/** The largest entry ends row `largestRow`, at its own column; the top left cell is at distance 0. */
const largestEntryPath = bindList(
  "largestRow",
  rowOfLargest,
  subtract(add("largestRow", at("largestRow", "lengths")), 2),
  "integer",
);

/** Each cell by its position in `reading`: how many cells lie west of it in its row, and whether it has a row above. */
const cellsWest: MathJSON = subtract(at("i", "columnIds"), 1);
const belowFirstRow: MathJSON = greater(at("i", "rowIds"), 1);
const eachCell: MathJSON = through(length("reading"));

/** The row and the column of each entry 1 .. n, by entry. */
const entryRows: MathJSON = forEach(eachCell, rowOf("e"), "e");
const entryColumns: MathJSON = forEach(eachCell, columnOf("e"), "e");
/** Pairs e < f with f strictly southwest of e. */
const southwestPairs: MathJSON = floored(
  sumOver(
    through(subtract(length("reading"), 1)),
    floored(
      sumOver(
        ["Range", add("e", 1), length("reading"), 1],
        [
          "If",
          and(
            greater(at("f", "entryRows"), at("e", "entryRows")),
            less(at("f", "entryColumns"), at("e", "entryColumns")),
          ),
          1,
          0,
        ],
        "f",
      ),
    ),
    "e",
  ),
);

/** The i with row i as long as the first row and row i from the bottom starting after the first row's last entry; they form a prefix. */
const cylindricalOverlap: MathJSON = floored(
  sumOver(positions, [
    "If",
    and(
      equals(at("i", "lengths"), at(1, "lengths")),
      less(at(at(1, "lengths"), "reading"), at(subtract(add(length(), 1), "i"), "firsts")),
    ),
    1,
    0,
  ]),
);

/** The shifts of the first row that can fail: width - last row length up to width - 1. */
const cylindricShifts: MathJSON = ["Range", subtract("width", "lastLength"), subtract("width", 1), 1];
/** The last row's entries under a first row entry at shift i that are not smaller than it. */
const blockedAtShift: MathJSON = floored(
  sumOver(
    ["Range", 1, ["Min", "lastLength", subtract("width", "i")], 1],
    [
      "If",
      atLeastValue(at(add(subtract(length("reading"), "lastLength"), "j"), "reading"), at(add("i", "j"), "reading")),
      1,
      0,
    ],
    "j",
  ),
);

const EMPTY = "The empty tableau, which has no such entry, gives 0.";

// The second batch: pair counts of the shape and the entries, ascents, a shifted comajor index and the cylindric statistics.
const FINDSTAT_TABLEAU_STATISTICS_3: readonly Definition[] = [
  stat(
    "AttackingPairCount",
    "Pairs of cells of the shape with one strictly west of the other in a row, or the first in the row below and strictly east of the second.",
    nonEmpty(withColumns(floored(sumOver(eachCell, ["Multiply", cellsWest, ["If", belowFirstRow, 2, 1]])))),
    "A cell with k cells west of it in its row makes k pairs there and k more with the row above, if it has a row above. It depends on the shape alone (FindStat's St000016). The empty tableau gives 0.",
  ),
  stat(
    "AttackingInversionCount",
    "Attacking pairs of cells whose entries are out of order: the cell in the lower row, strictly east of the other, holds the larger entry.",
    nonEmpty(withColumns(floored(sumOver(eachCell, ["If", belowFirstRow, cellsWest, 0])))),
    "Pairs in a row are in order. Across rows, the lower cell's entry exceeds the entry above it, which exceeds the entry of the cell it attacks, so every such pair is an inversion (FindStat's St000017). The empty tableau gives 0.",
  ),
  stat(
    "ShynarInversionCount",
    "Pairs of entries e < f with f strictly southwest of e.",
    cellsAtLeast(
      2,
      withColumns(bindList("entryRows", entryRows, bindList("entryColumns", entryColumns, southwestPairs))),
    ),
    "Shynar's inversion number (FindStat's St000057). A tableau of fewer than two entries gives 0.",
  ),
  stat(
    "AscentCountIncludingLargestEntry",
    "Entries whose successor is in the same or a higher row, and the largest entry.",
    nonEmpty(add(1, cellsAtLeast(2, withRows(overSuccessors(atMostValue(rowOf(successor), rowOf("e"))))))),
    "The size less the descents of the tableau; FindStat's St000507 counts the largest entry, which has no successor, as an ascent. The empty tableau gives 0.",
  ),
  stat(
    "ShiftedNaturalComajorIndex",
    "The sum of n - e over the natural descents e, plus the sum of (r - 1) times the length of row r.",
    cellsAtLeast(
      2,
      withRows(
        add(
          overSuccessors(successorAbove, subtract(length("reading"), "e")),
          floored(sumOver(positions, ["Multiply", subtract("i", 1), at("i", "lengths")])),
        ),
      ),
    ),
    "The natural comajor index shifted by the weighted size of the shape (FindStat's St001697). A tableau of fewer than two entries has no natural descent and a weighted size of 0.",
  ),
  stat(
    "CylindricalTableauOverlap",
    "The number of rows, from the top, as long as the first row and starting, from the bottom, above the last entry of the first row.",
    nonEmpty(withReading(bindList("firsts", firsts, cylindricalOverlap))),
    "The overlap of the cylindrical tableau built from two copies (FindStat's St001803). The empty tableau gives 0.",
  ),
  stat(
    "MinimalCylindricalInnerHeight",
    "The number of rows less the overlap of the cylindrical tableau.",
    nonEmpty(withReading(bindList("firsts", firsts, subtract(length(), cylindricalOverlap)))),
    "The height of the rectangular inner shape of the cylindrical tableau built from two copies (FindStat's St001804). The empty tableau gives 0.",
  ),
  stat(
    "SmallestCylindricShift",
    "The least shift s at which each entry of the last row is smaller than the first row's entry s columns on.",
    nonEmpty(
      withReading(
        bindList(
          "width",
          at(1, "lengths"),
          bindList(
            "lastLength",
            at(length(), "lengths"),
            add(
              subtract("width", "lastLength"),
              floored(sumOver(cylindricShifts, ["If", greater(blockedAtShift, 0), 1, 0])),
            ),
            "integer",
          ),
          "integer",
        ),
      ),
    ),
    "Shifts below width - last row length cannot work, and a shift that works keeps working one column on, so the least one is that bound plus the shifts above it that fail (FindStat's St001993). The empty tableau gives 0.",
  ),
];

export const TABLEAU_STATISTICS: readonly Definition[] = [
  stat(
    "RowOfLargestEntry",
    "The row containing the largest entry.",
    nonEmpty(bindList("lasts", lasts, rowOfLargest)),
    EMPTY,
  ),
  stat(
    "LastEntryInFirstRow",
    "The last entry in the first row.",
    nonEmpty(withReading(at(at(1, "lengths"), "reading"))),
    EMPTY,
  ),
  stat(
    "LastEntryOnMainDiagonal",
    "The last entry on the main diagonal.",
    nonEmpty(withReading(bindList("diagonal", diagonalLength, at(diagonalPosition, "reading"), "integer"))),
    EMPTY,
  ),
  stat(
    "FirstEntryInLastRow",
    "The first entry in the last row.",
    nonEmpty(withReading(at(add(subtract(length("reading"), at(length(), "lengths")), 1), "reading"))),
    EMPTY,
  ),
  stat(
    "AdjacentSuccessorCount",
    "Entries whose successor is the neighbor to their right or directly below them.",
    cellsAtLeast(
      2,
      withColumns(overSuccessors(or(equals(rowOf(successor), rowOf("e")), equals(columnOf(successor), columnOf("e"))))),
    ),
    "Consecutive entries of a row or a column are always neighbors, so this counts the entries e with e + 1 in the same row or the same column.",
  ),
  stat(
    "PathLengthToLargestEntry",
    "The length of the path from the top left cell to the largest entry, one step per cell down or to the right.",
    nonEmpty(bindList("lasts", lasts, bindList("lengths", lengths, largestEntryPath))),
    `FindStat sums the 0-based row and column of the cell. ${EMPTY}`,
  ),
  stat(
    "FirstColumnInitialSequenceLength",
    "The largest k such that the first column starts 1, 2, ..., k.",
    nonEmpty(bindList("firsts", firsts, floored(sumOver(positions, ["If", equals(at("i", "firsts"), "i"), 1, 0])))),
    "FindStat's title is the index of the last row whose first entry is the row number (St000745).",
  ),
  stat(
    "ModularMajorIndex",
    "The major index modulo the number of entries.",
    cellsAtLeast(2, withRows(["Mod", overSuccessors(successorBelow, "e"), length("reading")])),
    "The major index is the sum of the descents, the entries whose successor is in a strictly lower row. A tableau of fewer than two entries gives 0.",
  ),
  stat(
    "NaturalDescentCount",
    "Entries whose successor is in a strictly higher row.",
    cellsAtLeast(2, withRows(overSuccessors(successorAbove))),
    "The opposite of a descent of the tableau (FindStat's St000157), where the successor is in a lower row. An entry whose successor is in its own row is neither.",
  ),
  stat(
    "NaturalMajorIndex",
    "The sum of the natural descents, the entries whose successor is in a strictly higher row.",
    cellsAtLeast(2, withRows(overSuccessors(successorAbove, "e"))),
  ),
  stat(
    "NaturalComajorIndex",
    "The sum of n - e over the natural descents e, the entries whose successor is in a strictly higher row.",
    cellsAtLeast(2, withRows(overSuccessors(successorAbove, entriesAfter))),
  ),
  stat(
    "Charge",
    "The charge of the reading word: the sum of n - e over the entries e whose successor is not in a lower row.",
    cellsAtLeast(2, withRows(overSuccessors(successorNotBelow, entriesAfter))),
    "The reading word lists the rows from the bottom up, so e + 1 is to the right of e exactly when its row is not lower. The charge of a standard word adds, for each e with e + 1 to its right, the n - e entries from e + 1 on.",
  ),
  stat(
    "Cocharge",
    "The cocharge of the reading word: the sum of n - e over the entries e whose successor is in a lower row.",
    cellsAtLeast(2, withRows(overSuccessors(successorBelow, entriesAfter))),
    "The charge and the cocharge add to n(n - 1) / 2.",
  ),
  stat(
    "WeightedSize",
    "The sum of the leg lengths of the cells, the sum over the cells of their row counted from 0.",
    nonEmpty(
      bindList("lengths", lengths, floored(sumOver(positions, ["Multiply", subtract("i", 1), at("i", "lengths")]))),
    ),
    `FindStat's leg major index (St000336), a statistic of the shape; on a partition it is the same head. The empty tableau gives 0.`,
  ),
  ...FINDSTAT_TABLEAU_STATISTICS_3,
];
