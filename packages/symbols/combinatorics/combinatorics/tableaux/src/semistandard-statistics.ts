// Semistandard-tableau statistics, over `_x` = the rows of the tableau (English notation): rows weakly
// and columns strictly increasing, entries positive. As for standard tableaux, `reading` is the
// entries row by row and `lengths`, `rowIds` and `columnIds` place each cell; the cell `u` of
// `reading` has its left neighbor at `u - 1`, its right neighbor at `u + 1` and its neighbor above at
// `u - lengths(row - 1)`, below at `u + lengths(row)`.

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
  greater,
  hasPair,
  length,
  less,
  max,
  min,
  or,
  positions,
  subtract,
  sumOver,
} from "../../src/statistics/vocabulary.ts";
import {
  cellsAtLeast,
  eachCell,
  firstEntryInLastRow,
  firsts,
  lastEntryInFirstRow,
  lastEntryOnMainDiagonal,
  lasts,
  lengths,
  through,
  withColumns,
  withReading,
  withRows,
} from "./tableau-reading.ts";

const on = "SemistandardTableau";
const stat = (head: string, summary: string, expr: MathJSON, note?: string): Definition => ({
  head,
  on,
  summary,
  expr,
  ...(note ? { note } : {}),
});

const EMPTY = "The empty tableau gives 0.";

const entryAt = (u: MathJSON): MathJSON => at(u, "reading");
const rowOfCell: MathJSON = at("u", "rowIds");
const columnOfCell: MathJSON = at("u", "columnIds");
/** The cells `u` of the reading, counted where `test` holds. */
const cellsWhere = (test: MathJSON): MathJSON => floored(sumOver(eachCell, ["If", test, 1, 0], "u"));

/** The entry left of cell `u`, 0 in the first column. */
const entryLeft: MathJSON = ["If", greater(columnOfCell, 1), entryAt(subtract("u", 1)), 0];
/** The entry right of cell `u`, 0 past the row's end. */
const entryRight: MathJSON = ["If", less(columnOfCell, at(rowOfCell, "lengths")), entryAt(add("u", 1)), 0];
/** The entry above cell `u`, 0 in the first row. */
const entryAbove: MathJSON = [
  "If",
  greater(rowOfCell, 1),
  entryAt(subtract("u", at(subtract(rowOfCell, 1), "lengths"))),
  0,
];
/** The entry below cell `u`, 0 where the next row is shorter or there is none. */
const entryBelow: MathJSON = [
  "If",
  less(rowOfCell, length()),
  ["If", atMostValue(columnOfCell, at(add(rowOfCell, 1), "lengths")), entryAt(add("u", at(rowOfCell, "lengths"))), 0],
  0,
];

/**
 * Cell `u` starts a segment: the first cell of a run of equal entries in its row, other than the entries equal to the
 * row's own number, which are not segments.
 */
const startsSegment = (u: MathJSON): MathJSON => [
  "If",
  equals(entryAt(u), at(u, "rowIds")),
  0,
  ["If", equals(at(u, "columnIds"), 1), 1, ["If", ["NotEqual", entryAt(u), entryAt(subtract(u, 1))], 1, 0]],
];
const withSegmentStarts = (body: MathJSON): MathJSON =>
  withColumns(
    bindList("lasts", lasts, bindList("starts", ["Map", ["Function", startsSegment("u"), "u"], eachCell], body)),
  );

/**
 * What the segment starting at cell `u` adds to the flush count. In the last row the segment at column 1 counts. Above
 * another row, it counts when that row has a segment starting in the same column, or when it starts one column past that
 * row's end and that row's last entry is at most the segment's entry.
 */
const flushOf = (u: MathJSON): MathJSON => [
  "If",
  equals(at(u, "rowIds"), length()),
  ["If", equals(at(u, "columnIds"), 1), 1, 0],
  [
    "If",
    atMostValue(at(u, "columnIds"), at(add(at(u, "rowIds"), 1), "lengths")),
    at(add(u, at(at(u, "rowIds"), "lengths")), "starts"),
    [
      "If",
      equals(at(u, "columnIds"), add(at(add(at(u, "rowIds"), 1), "lengths"), 1)),
      ["If", atMostValue(at(add(at(u, "rowIds"), 1), "lasts"), entryAt(u)), 1, 0],
      0,
    ],
  ],
];

/** The rows from the top, each as long as the first row and starting, from the bottom, at or above its last entry. */
const cylindricalOverlap: MathJSON = floored(
  sumOver(positions, [
    "If",
    and(
      equals(at("i", "lengths"), at(1, "lengths")),
      atMostValue(at(at(1, "lengths"), "reading"), at(subtract(add(length(), 1), "i"), "firsts")),
    ),
    1,
    0,
  ]),
);

export const FINDSTAT_SEMISTANDARD_TABLEAU_STATISTICS: readonly Definition[] = [
  stat(
    "EntrySum",
    "The sum of the entries.",
    cellsAtLeast(1, withReading(floored(["Sum", "reading"]))),
    `FindStat's St000103. ${EMPTY}`,
  ),
  stat(
    "RowReducedEntrySum",
    "The sum of each entry less the number of its row.",
    cellsAtLeast(1, withRows(floored(sumOver(eachCell, subtract(entryAt("u"), rowOfCell), "u")))),
    `FindStat's St000112, the depth of the tableau in the crystal of its shape. An entry is at least the number of its row, so no term is negative. ${EMPTY}`,
  ),
  stat(
    "StandardizedMajorIndex",
    "The major index of the reading word of the standardization: the sum, over the rows with a row below, of the cells from the row below on, where the last entry of that row is at least the first of this one.",
    hasPair(
      bindList(
        "firsts",
        firsts,
        bindList(
          "lasts",
          lasts,
          bindList(
            "lengths",
            lengths,
            floored(
              sumOver(
                through(subtract(length(), 1)),
                [
                  "If",
                  atLeastValue(at(add("r", 1), "lasts"), at("r", "firsts")),
                  floored(sumOver(["Range", add("r", 1), length(), 1], at("q", "lengths"), "q")),
                  0,
                ],
                "r",
              ),
            ),
          ),
        ),
      ),
    ),
    "FindStat's St000116. Equal entries are numbered left to right, and the reading word lists the rows from the bottom up, so the boundary between a row and the row above it is a descent exactly when the last entry below is at least the first entry above (a last entry equal to it lies to the right of the first). Inside a row there is no descent. A tableau of one row gives 0.",
  ),
  stat(
    "Trace",
    "The sum of the diagonal entries.",
    cellsAtLeast(
      1,
      withColumns(floored(sumOver(eachCell, ["If", equals(rowOfCell, columnOfCell), entryAt("u"), 0], "u"))),
    ),
    `FindStat's St000170; the same head as on plane partitions. ${EMPTY}`,
  ),
  stat(
    "SegmentCount",
    "The segments: maximal runs of equal entries in a row, other than the entries equal to the row's own number.",
    cellsAtLeast(1, withColumns(floored(sumOver(eachCell, startsSegment("u"), "u")))),
    `FindStat's St000173, the segment statistic. A row weakly increases, so a run of equal entries starts at the first column or where the entry rises. ${EMPTY}`,
  ),
  stat(
    "FlushSegmentCount",
    "The flush segments, counted as FindStat's reference code counts them.",
    cellsAtLeast(
      1,
      withSegmentStarts(floored(sumOver(eachCell, ["If", equals(at("u", "starts"), 1), flushOf("u"), 0], "u"))),
    ),
    `FindStat's St000174, the flush statistic, defined by its Sage code (the prose describes a narrower tableau). Each segment counts once if it is in the last row and starts at column 1; otherwise once if the row below has a segment starting in the same column, and once more if it starts just past the end of the row below and that row's last entry is at most its entry. ${EMPTY}`,
  ),
  stat(
    "LastEntryInFirstRow",
    "The last entry in the first row.",
    lastEntryInFirstRow,
    `FindStat's St000736; the same head as on standard tableaux. ${EMPTY}`,
  ),
  stat(
    "LastEntryOnMainDiagonal",
    "The last entry on the main diagonal.",
    lastEntryOnMainDiagonal,
    `FindStat's St000737; the same head as on standard tableaux. ${EMPTY}`,
  ),
  stat(
    "FirstEntryInLastRow",
    "The first entry in the last row.",
    firstEntryInLastRow,
    `FindStat's St000739; the same head as on standard tableaux. ${EMPTY}`,
  ),
  stat(
    "DistinctEntryCount",
    "The number of distinct entries.",
    cellsAtLeast(1, withReading(["Length", ["Unique", "reading"]])),
    `FindStat's St001401. ${EMPTY}`,
  ),
  stat(
    "MinimalEntryCount",
    "The entries that cannot be replaced by a smaller one: an entry of 1, or one equal to its left neighbor, or one more than its neighbor above.",
    cellsAtLeast(
      1,
      withColumns(
        cellsWhere(
          or(
            equals(entryAt("u"), 1),
            or(equals(entryLeft, entryAt("u")), equals(entryAbove, subtract(entryAt("u"), 1))),
          ),
        ),
      ),
    ),
    `FindStat's St001407. Lowering an entry by one keeps the tableau semistandard unless the entry is 1, or its left neighbor equals it, or its neighbor above is one less (the cells right and below it stay larger). ${EMPTY}`,
  ),
  stat(
    "MaximalEntryCount",
    "The entries that cannot be replaced by a larger one: an entry equal to its right neighbor, or one less than its neighbor below.",
    cellsAtLeast(
      1,
      withColumns(cellsWhere(or(equals(entryRight, entryAt("u")), equals(entryBelow, add(entryAt("u"), 1))))),
    ),
    `FindStat's St001408. Raising an entry by one keeps the tableau semistandard unless its right neighbor equals it or its neighbor below is one more; there is no bound on the entries. ${EMPTY}`,
  ),
  stat(
    "LargestEntry",
    "The largest entry.",
    cellsAtLeast(1, withReading(max("reading"))),
    `FindStat's St001409. ${EMPTY}`,
  ),
  stat(
    "SmallestEntry",
    "The smallest entry: the first of the first row.",
    cellsAtLeast(1, withReading(min("reading"))),
    `FindStat's St001410. ${EMPTY}`,
  ),
  stat(
    "CylindricalTableauOverlap",
    "The number of rows, from the top, as long as the first row and starting, from the bottom, at or above the last entry of the first row.",
    cellsAtLeast(1, withReading(bindList("firsts", firsts, cylindricalOverlap))),
    `FindStat's St001805, the overlap of the cylindrical tableau built from two copies; the same head as on standard tableaux, where the entries differ so that the comparison is strict. ${EMPTY}`,
  ),
];
