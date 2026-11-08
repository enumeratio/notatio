// How the tableau-shaped statistics read their subject `_x`, the rows of a tableau, a plane
// partition or a Gelfand-Tsetlin pattern: the entries row by row as `reading`, the length of each
// row as `lengths`, and the row and the column of the cell at each position of `reading`.

import type { MathJSON } from "../../src/statistics/types.ts";
import {
  add,
  at,
  atLeastValue,
  bindList,
  floored,
  forEach,
  length,
  less,
  nonEmpty,
  positions,
  subtract,
  sumOver,
  x,
} from "../../src/statistics/vocabulary.ts";

export const through = (n: MathJSON): MathJSON => ["Range", 1, n, 1];

export const reading: MathJSON = ["Flatten", x];
export const lengths: MathJSON = forEach(x, length("r"), "r");
export const firsts: MathJSON = forEach(x, at(1, "r"), "r");
export const lasts: MathJSON = forEach(x, ["Last", "r"], "r");
/** `body` with the entries row by row as `reading` and the row lengths as `lengths`. */
export const withReading = (body: MathJSON): MathJSON =>
  bindList("reading", reading, bindList("lengths", lengths, body));
/** `body` for a tableau of at least `m` entries, 0 otherwise. */
export const cellsAtLeast = (m: number, body: MathJSON): MathJSON => ["If", less(length(reading), m), 0, body];

/** The row and the column of the cell at each position of `reading`. */
export const rowIds: MathJSON = ["Flatten", forEach(positions, forEach(through(at("i", "lengths")), "i", "j"), "i")];
export const columnIds: MathJSON = ["Flatten", forEach(positions, through(at("i", "lengths")), "i")];
export const withRows = (body: MathJSON): MathJSON => withReading(bindList("rowIds", rowIds, body));
export const withColumns = (body: MathJSON): MathJSON => withRows(bindList("columnIds", columnIds, body));
/** The positions of `reading`, one for each cell. */
export const eachCell: MathJSON = through(length("reading"));

/** The rows 1 .. d reach their own column; the cell (d, d) is the cells of the rows above it, then d along. */
const diagonalLength = floored(sumOver(positions, ["If", atLeastValue(at("i", "lengths"), "i"), 1, 0]));
const diagonalPosition = add(
  floored(sumOver(positions, ["If", less("i", "diagonal"), at("i", "lengths"), 0])),
  "diagonal",
);

/** The last entry of the first row, of the main diagonal and the first of the last row; 0 for no entries. */
export const lastEntryInFirstRow: MathJSON = nonEmpty(withReading(at(at(1, "lengths"), "reading")));
export const lastEntryOnMainDiagonal: MathJSON = nonEmpty(
  withReading(bindList("diagonal", diagonalLength, at(diagonalPosition, "reading"), "integer")),
);
export const firstEntryInLastRow: MathJSON = nonEmpty(
  withReading(at(add(subtract(length("reading"), at(length(), "lengths")), 1), "reading")),
);
