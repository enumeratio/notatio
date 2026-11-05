// Standard-tableau statistics, over `_x` = the rows of the tableau (English notation, entries 1 .. n).
//
// A list of rows can be mapped and flattened but not indexed, so every definition reads integer
// lists: the entries row by row, the length of each row, and the first or last entry of each row.
// Where a statistic follows entry e to e + 1, `rowIds` and `columnIds` give the row and column of
// each reading position, and `IndexOf` finds the position of an entry.

import type { Definition, MathJSON } from "../../src/statistics/types.ts";
import {
  add,
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

const EMPTY = "The empty tableau, which has no such entry, gives 0.";

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
];
