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
  count,
  equals,
  floored,
  forEach,
  greater,
  length,
  less,
  max,
  min,
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

// ── alternating sign matrices ───────────────────────────────────────────────────────────
//
// `_x` is the rows of the matrix, entries -1, 0, 1. The entries are read as one list, row by row,
// with `side` the number of rows: the entry in row r, column c is `cell(r, c)`.

const matrix = (head: string, summary: string, expr: MathJSON, note?: string): Definition => ({
  head,
  on: "AlternatingSignMatrix",
  summary,
  expr,
  ...(note ? { note } : {}),
});
const withCells = (body: MathJSON): MathJSON =>
  nonEmpty(bindList("cells", reading, bindList("side", length(), body, "integer")));
const cell = (row: MathJSON, column: MathJSON): MathJSON =>
  at(add(["Multiply", subtract(row, 1), "side"], column), "cells");
/** How many entries equal `value`. */
const entriesEqual = (value: number): MathJSON =>
  withCells(["Count", ["Filter", "cells", ["Function", equals("e", value), "e"]]]);
/** The sum of `index` over the positions 1 .. side whose entry (read by `entry`) is 1: the position of the one in a row or column that holds exactly one. */
const positionOfOne = (entry: (index: MathJSON) => MathJSON): MathJSON =>
  withCells(floored(sumOver(positions, ["If", equals(entry("i"), 1), "i", 0])));
/** The positions 1 .. side whose diagonal entry equals `value`, for use inside `withCells`. */
const diagonalCount = (value: number): MathJSON =>
  floored(sumOver(positions, ["If", equals(cell("i", "i"), value), 1, 0]));
const diagonalEntries = (value: number): MathJSON => withCells(diagonalCount(value));
/** The sum of `term(i, i - d)` over the cells (i, i - d) of the diagonal d. */
const diagonalTotal = (term: (row: MathJSON, column: MathJSON) => MathJSON): MathJSON =>
  sumOver(positions, [
    "If",
    and(atLeastValue(subtract("i", "d"), 1), atMostValue(subtract("i", "d"), "side")),
    term("i", subtract("i", "d")),
    0,
  ]);
/** The diagonals' numbers d = 1 - side .. side - 1, from the bottom left corner to the top right. */
const diagonalNumbers: MathJSON = ["Range", subtract(1, "side"), subtract("side", 1)];
/** The sum of the entries on the diagonal of cells (i, i - d), the largest over d. */
const diagonalSums: MathJSON = withCells(max(forEach(diagonalNumbers, floored(diagonalTotal(cell)), "d")));
/** The number of nonzero entries on the diagonal of cells (i, i - d), the largest over d. */
const diagonalNonzeroCounts: MathJSON = withCells(
  max(
    forEach(
      diagonalNumbers,
      floored(diagonalTotal((row, column) => ["If", ["NotEqual", cell(row, column), 0], 1, 0])),
      "d",
    ),
  ),
);
/** The diagonal sums, each raised by side so that none is negative, counted without repeats. */
const distinctDiagonalSums: MathJSON = withCells([
  "Length",
  ["Unique", forEach(diagonalNumbers, floored(add(diagonalTotal(cell), "side")), "d")],
]);
/** The cells numbered 1 .. side * side, row by row, as `cells` is read. */
const cellNumbers: MathJSON = ["Range", 1, ["Multiply", "side", "side"]];
/** The column of cell `u`. */
const columnOfCell = (u: MathJSON): MathJSON => add(["Mod", subtract(u, 1), "side"], 1);
/** The row of cell `u`. */
const rowOfCell = (u: MathJSON): MathJSON => add(["Divide", subtract(u, columnOfCell(u)), "side"], 1);
/** The sum of the entries above and to the right of cell `u`, a corner sum of the matrix, so never negative. */
const entriesAboveRight = (u: MathJSON): MathJSON =>
  floored(
    sumOver(
      cellNumbers,
      ["If", and(less(rowOfCell("v"), rowOfCell(u)), greater(columnOfCell("v"), columnOfCell(u))), at("v", "cells"), 0],
      "v",
    ),
  );
/** Sum over the pairs of entries a(i, j) a(k, l) with i > k and j < l: each entry times the entries above and to its right. */
const inversionTotal: MathJSON = floored(
  sumOver(cellNumbers, ["Multiply", at("u", "cells"), entriesAboveRight("u")], "u"),
);

const FINDSTAT_ALTERNATING_SIGN_MATRIX_STATISTICS: readonly Definition[] = [
  matrix("NegativeOneCount", "The number of entries equal to -1.", entriesEqual(-1)),
  matrix("PositiveOneCount", "The number of entries equal to 1.", entriesEqual(1)),
  matrix("OnesOnMainDiagonal", "The number of 1s on the main diagonal.", diagonalEntries(1)),
  matrix("ZerosOnMainDiagonal", "The number of 0s on the main diagonal.", diagonalEntries(0)),
  matrix(
    "FirstRowOnePosition",
    "The column of the unique 1 in the first row.",
    positionOfOne((i) => cell(1, i)),
  ),
  matrix(
    "FirstColumnOnePosition",
    "The row of the unique 1 in the first column.",
    positionOfOne((i) => cell(i, 1)),
  ),
  matrix(
    "LastRowOnePosition",
    "The column of the unique 1 in the last row.",
    positionOfOne((i) => cell("side", i)),
  ),
  matrix(
    "LastColumnOnePosition",
    "The row of the unique 1 in the last column.",
    positionOfOne((i) => cell(i, "side")),
  ),
  matrix(
    "MaximalDiagonalSum",
    "The largest sum of the entries along a diagonal.",
    diagonalSums,
    "The diagonals are the cells (i, j) with i - j fixed. A sum is floored at 0, which no sum of a corner cell falls below, so the largest is unchanged.",
  ),
  matrix(
    "MaximalDiagonalNonzeroCount",
    "The largest number of nonzero entries along a diagonal.",
    diagonalNonzeroCounts,
    "FindStat's St000892. The diagonals are those of MaximalDiagonalSum.",
  ),
  matrix(
    "DistinctDiagonalSumCount",
    "The number of distinct sums of the entries along a diagonal.",
    distinctDiagonalSums,
    "FindStat's St000893. A middle diagonal can sum below 0, so each sum is raised by the side before it is floored; raising every sum alike leaves the number of distinct ones.",
  ),
  matrix(
    "NonzeroEntryCount",
    "The number of nonzero entries.",
    withCells(["Count", ["Filter", "cells", ["Function", ["NotEqual", "e", 0], "e"]]]),
    "FindStat's St000890.",
  ),
  matrix(
    "MainDiagonalSum",
    "The sum of the entries on the main diagonal, its trace.",
    withCells(subtract(diagonalCount(1), diagonalCount(-1))),
    "FindStat's St000894. The entries are -1, 0 and 1, so the trace is the number of 1s on the diagonal less the number of -1s.",
  ),
  matrix(
    "MinimalRowZeroCount",
    "The fewest zeros in a row.",
    withCells(min(forEach(positions, count(positions, equals(cell("i", "j"), 0), "j"), "i"))),
    "FindStat's St001925.",
  ),
  matrix(
    "TopLeftZeroSquareSize",
    "The side of the largest square of zeros at the top left corner.",
    withCells(
      subtract(
        min(
          forEach(
            cellNumbers,
            ["If", ["NotEqual", at("u", "cells"), 0], max(["List", rowOfCell("u"), columnOfCell("u")]), "side"],
            "u",
          ),
        ),
        1,
      ),
    ),
    "FindStat's St001981. The square of side z is all zeros exactly when z is below the largest of the row and column of every nonzero entry, so the side is the least such largest, less 1; an alternating sign matrix has a nonzero entry.",
  ),
  matrix(
    "AlternatingSignMatrixPosetRank",
    "Half the sum of (i - j)^2 a(i, j): the rank in the alternating sign matrix poset.",
    withCells([
      "Divide",
      floored(
        sumOver(
          cellNumbers,
          ["Multiply", ["Power", subtract(rowOfCell("u"), columnOfCell("u")), 2], at("u", "cells")],
          "u",
        ),
      ),
      2,
    ]),
    "FindStat's St000076, which gives this formula for the rank (the sum of the monotone triangle's entries less n + 2 choose 3). The sum is never negative.",
  ),
  matrix(
    "MatrixInversionNumber",
    "The sum of a(i, j) a(k, l) over the pairs of entries with i > k and j < l.",
    withCells(inversionTotal),
    "FindStat's St000067. On a permutation matrix it is the number of inversions.",
  ),
  matrix(
    "PositiveMatrixInversionNumber",
    "The inversion number less the number of entries equal to -1.",
    withCells(subtract(inversionTotal, ["Count", ["Filter", "cells", ["Function", equals("e", -1), "e"]]])),
    "FindStat's St000332.",
  ),
];

// ── plane partitions ─────────────────────────────────────────────────────────────────────
//
// `_x` is the rows: each a weakly decreasing list of positive entries, no row longer than the one
// above it. `reading` is the entries row by row; the cell `u` of it is in row `rowIds(u)` and column
// `columnIds(u)`, its right neighbor is the cell `u + 1` and its neighbor below the cell `u + lengths(row)`.

const planePartition = (head: string, summary: string, expr: MathJSON, note?: string): Definition => ({
  head,
  on: "PlanePartition",
  summary,
  expr,
  ...(note ? { note } : {}),
});
/** `body` for a plane partition with at least one box, 0 otherwise. */
const withParts = (body: MathJSON): MathJSON => cellsAtLeast(1, withReading(body));
const withGrid = (body: MathJSON): MathJSON => cellsAtLeast(1, withColumns(body));
const entryAt = (u: MathJSON): MathJSON => at(u, "reading");
/** The cells `u` of the reading, counted where `test` holds. */
const cellsWhere = (test: MathJSON): MathJSON => floored(sumOver(eachCell, ["If", test, 1, 0], "u"));
/** How many entries equal `value`. */
const entryMultiplicity = (value: MathJSON): MathJSON =>
  floored(sumOver("reading", ["If", equals("e", value), 1, 0], "e"));
/** The values 1 .. largest entry, so every part size. */
const partSizes: MathJSON = through(max("reading"));
const partRow = at("u", "rowIds");
const partColumn = at("u", "columnIds");
/** The entry right of cell `u`, 0 past the row's end. */
const entryRight: MathJSON = ["If", less(partColumn, at(partRow, "lengths")), entryAt(add("u", 1)), 0];
/** The entry below cell `u`, 0 where the next row is shorter or there is none. */
const entryBelow: MathJSON = [
  "If",
  less(partRow, length()),
  ["If", atMostValue(partColumn, at(add(partRow, 1), "lengths")), entryAt(add("u", at(partRow, "lengths"))), 0],
  0,
];
const smallestEntry: MathJSON = ["Min", "reading"];

const FINDSTAT_PLANE_PARTITION_STATISTICS: readonly Definition[] = [
  planePartition(
    "LargestPart",
    "The largest entry: the corner of the array.",
    withParts(max("reading")),
    "FindStat's St001447, the height of the base box; the same head as on partitions.",
  ),
  planePartition(
    "Trace",
    "The sum of the diagonal entries.",
    withGrid(floored(sumOver(eachCell, ["If", equals(partRow, partColumn), entryAt("u"), 0], "u"))),
    "FindStat's St001919.",
  ),
  planePartition(
    "BoxCount",
    "The number of boxes: the sum of the entries.",
    withParts(floored(["Sum", "reading"])),
    "FindStat's St001422.",
  ),
  planePartition(
    "RemovableBoxCount",
    "The number of entries larger than both the entry to their right and the entry below.",
    withGrid(cellsWhere(and(greater(entryAt("u"), entryRight), greater(entryAt("u"), entryBelow)))),
    "FindStat's St001445. Taking one box off such an entry leaves a plane partition, and off any other does not.",
  ),
  planePartition("RowCount", "The number of rows.", withParts(length()), "FindStat's St001446."),
  planePartition(
    "ColumnCount",
    "The number of columns: the length of the first row.",
    withParts(at(1, "lengths")),
    "FindStat's St001460.",
  ),
  planePartition(
    "OddParts",
    "Entries that are odd.",
    withParts(["Count", ["Filter", "reading", ["Function", equals(["Mod", "e", 2], 1), "e"]]]),
    "FindStat's St001448; the same head as on partitions.",
  ),
  planePartition(
    "EvenParts",
    "Entries that are even.",
    withParts(["Count", ["Filter", "reading", ["Function", equals(["Mod", "e", 2], 0), "e"]]]),
    "FindStat's St001452; the same head as on partitions.",
  ),
  planePartition(
    "SmallestMissingPart",
    "The smallest positive integer that is not an entry.",
    [
      "If",
      less(length(reading), 1),
      1,
      withReading([
        "Min",
        forEach(
          through(add(length("reading"), 1)),
          ["If", equals(entryMultiplicity("k"), 0), "k", add(length("reading"), 1)],
          "k",
        ),
      ]),
    ],
    "FindStat's St001449; the same head as on partitions. With n entries, one of 1 .. n + 1 is missing.",
  ),
  planePartition(
    "DurfeeCube",
    "The side of the largest cube in the array: the most diagonal entries d with the d-th at least d.",
    withGrid(cellsWhere(and(equals(partRow, partColumn), atLeastValue(entryAt("u"), partRow)))),
    "FindStat's St001451, the plane partition analogue of the Durfee square. Entries down the diagonal never increase, so once one falls short of its place every later one does.",
  ),
  planePartition(
    "DistinctParts",
    "How many distinct entries occur.",
    withParts(floored(sumOver(partSizes, ["If", greater(entryMultiplicity("k"), 0), 1, 0], "k"))),
    "FindStat's St001453, its distinct heights; the same head as on partitions.",
  ),
  planePartition(
    "PartRange",
    "The largest entry minus the smallest.",
    withParts(subtract(max("reading"), smallestEntry)),
    "FindStat's St001454; the same head as on partitions.",
  ),
  planePartition(
    "LargestRepeatedPart",
    "The largest entry that occurs at least twice; 0 if the entries are distinct.",
    withParts(max(forEach(partSizes, ["If", atLeastValue(entryMultiplicity("k"), 2), "k", 0], "k"))),
    "FindStat's St001455; the same head as on partitions.",
  ),
  planePartition(
    "FirstRowSum",
    "The sum of the first row.",
    withParts(floored(sumOver(through(at(1, "lengths")), entryAt("j"), "j"))),
    "FindStat's St001456.",
  ),
  planePartition(
    "MultiplicityOfSmallestPart",
    "How many entries equal the smallest.",
    withParts(
      bindList("least", smallestEntry, floored(sumOver("reading", ["If", equals("e", "least"), 1, 0], "e")), "integer"),
    ),
    "FindStat's St001457; the same head as on partitions.",
  ),
  planePartition(
    "AmbientCubeSize",
    "The side of the smallest cube that holds the array: the most of its rows, its columns and its largest entry.",
    withParts(["Max", length(), at(1, "lengths"), entryAt(1)]),
    "FindStat's St001920.",
  ),
  planePartition(
    "PartCount",
    "The number of parts: the entries.",
    withParts(length("reading")),
    "FindStat's St001922; the same head as on partitions.",
  ),
  planePartition(
    "ConjugateTrace",
    "The entries at least as large as their row number.",
    withGrid(cellsWhere(atLeastValue(entryAt("u"), partRow))),
    "FindStat's St001923.",
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
  ...FINDSTAT_ALTERNATING_SIGN_MATRIX_STATISTICS,
  ...FINDSTAT_PLANE_PARTITION_STATISTICS,
];
