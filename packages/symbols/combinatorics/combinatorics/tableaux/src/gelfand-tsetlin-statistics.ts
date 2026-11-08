// Gelfand-Tsetlin-pattern statistics, over `_x` = the rows of the pattern, top row first: row i has
// n + 1 - i entries, weakly decreasing, and each entry lies between the two entries above it. As for
// tableaux, `reading` is the entries row by row; the entry of cell `u` has the entries of the row
// above at `u - lengths(row - 1)` (up and left) and one past it (up and right), and the row below at
// `u + lengths(row) - 1` (down and left) and `u + lengths(row)` (down and right).

import { fold } from "../../collections/src/families/tables.ts";
import type { Definition, MathJSON } from "../../src/statistics/types.ts";
import {
  add,
  and,
  at,
  atLeastValue,
  bindList,
  equals,
  floored,
  greater,
  length,
  less,
  nonEmpty,
  subtract,
  sumOver,
} from "../../src/statistics/vocabulary.ts";
import { cellsAtLeast, eachCell, withColumns, withReading } from "./tableau-reading.ts";

const on = "GelfandTsetlinPattern";
const stat = (head: string, summary: string, expr: MathJSON, note?: string): Definition => ({
  head,
  on,
  summary,
  expr,
  ...(note ? { note } : {}),
});

const EMPTY = "The empty pattern gives 0.";

const entryAt = (u: MathJSON): MathJSON => at(u, "reading");
const rowOfCell: MathJSON = at("u", "rowIds");
const columnOfCell: MathJSON = at("u", "columnIds");

/** The position of the entry up and left of cell `u`; the entry up and right is the next. */
const upLeft: MathJSON = subtract("u", at(subtract(rowOfCell, 1), "lengths"));
const upRight: MathJSON = add(upLeft, 1);
/** The cells below the first row, counted where `test` holds; `test` reads the entry above on either side. */
const belowFirstRow = (test: MathJSON): MathJSON =>
  floored(sumOver(eachCell, ["If", greater(rowOfCell, 1), ["If", test, 1, 0], 0], "u"));

/** The entry equals the one up and left (boxed) or the one up and right (circled). */
const boxed: MathJSON = equals(entryAt("u"), entryAt(upLeft));
const circled: MathJSON = equals(entryAt("u"), entryAt(upRight));

/** The position of the neighbor of cell `u` in the same tile, one of the four directions, or `u` where there is none. */
const partner = (exists: MathJSON, neighbor: MathJSON): MathJSON => [
  "If",
  exists,
  ["If", equals(entryAt(neighbor), entryAt("u")), neighbor, "u"],
  "u",
];
const partners = (exists: MathJSON, neighbor: MathJSON): MathJSON => [
  "Map",
  ["Function", partner(exists, neighbor), "u"],
  eachCell,
];
const rowLength: MathJSON = at(rowOfCell, "lengths");

/**
 * Each cell labeled with the first position of its tile: every label becomes the least label among the cell and its equal
 * neighbors, as many times as there are cells, which is more than the longest path through a tile.
 */
const tileLabels: MathJSON = bindList(
  "upLeft",
  partners(greater(rowOfCell, 1), upLeft),
  bindList(
    "upRight",
    partners(greater(rowOfCell, 1), upRight),
    bindList(
      "downLeft",
      partners(atLeastValue(columnOfCell, 2), subtract(add("u", rowLength), 1)),
      bindList(
        "downRight",
        partners(less(columnOfCell, rowLength), add("u", rowLength)),
        fold(
          [
            "Map",
            [
              "Function",
              [
                "Min",
                at("u", "labels"),
                at(at("u", "upLeft"), "labels"),
                at(at("u", "upRight"), "labels"),
                at(at("u", "downLeft"), "labels"),
                at(at("u", "downRight"), "labels"),
              ],
              "u",
            ],
            eachCell,
          ],
          "labels",
          "step",
          ["Map", ["Function", "u", "u"], eachCell],
          eachCell,
        ) as MathJSON,
        "list<integer>",
      ),
      "list<integer>",
    ),
    "list<integer>",
  ),
  "list<integer>",
);
/** `body` with `labels` the tile labels of the pattern. */
const withTiles = (body: MathJSON): MathJSON => cellsAtLeast(1, withColumns(bindList("labels", tileLabels, body)));
/** The tile of the last row's single entry, and the cells of the first row, are not free. */
const lastTile: MathJSON = at(length("reading"), "labels");
const firstRowLength: MathJSON = at(1, "lengths");

export const FINDSTAT_GELFAND_TSETLIN_STATISTICS: readonly Definition[] = [
  stat(
    "CircledEntryCount",
    "The entries equal to the entry up and to the right of them.",
    cellsAtLeast(1, withColumns(belowFirstRow(circled))),
    `FindStat's St000072. The first row has no entries above it. ${EMPTY}`,
  ),
  stat(
    "BoxedEntryCount",
    "The entries equal to the entry up and to the left of them.",
    cellsAtLeast(1, withColumns(belowFirstRow(boxed))),
    `FindStat's St000073. The first row has no entries above it. ${EMPTY}`,
  ),
  stat(
    "SpecialEntryCount",
    "The entries strictly between the entries up and to the left and up and to the right of them: neither boxed nor circled.",
    cellsAtLeast(
      1,
      withColumns(belowFirstRow(and(greater(entryAt(upLeft), entryAt("u")), greater(entryAt("u"), entryAt(upRight))))),
    ),
    `FindStat's St000074. An entry lies between its two upper neighbors, so it is boxed, circled, both or special. ${EMPTY}`,
  ),
  stat(
    "BoxedAndCircledEntryCount",
    "The entries equal to both entries above them.",
    cellsAtLeast(1, withColumns(belowFirstRow(and(boxed, circled)))),
    `FindStat's St000077. ${EMPTY}`,
  ),
  stat(
    "EntrySum",
    "The sum of the entries.",
    cellsAtLeast(1, withReading(floored(["Sum", "reading"]))),
    `FindStat's St000114; the same head as on semistandard tableaux. ${EMPTY}`,
  ),
  stat(
    "LastRowEntry",
    "The single entry of the last row.",
    cellsAtLeast(1, withReading(["Last", "reading"])),
    `FindStat's St000115. ${EMPTY}`,
  ),
  stat(
    "TileCount",
    "The tiles: the classes of entries joined by equal entries in adjacent places, up, down, left or right in the triangle.",
    withTiles(floored(sumOver(eachCell, ["If", equals(at("u", "labels"), "u"), 1, 0], "u"))),
    `FindStat's St000176. A tile is a connected set of equal entries, labeled by its first place in the reading. Adjacent places are the two below an entry and the two above it, not its neighbors in a row. ${EMPTY}`,
  ),
  stat(
    "FreeTileCount",
    "The tiles that meet neither the first row nor the last.",
    withTiles(
      floored(
        sumOver(
          eachCell,
          [
            "If",
            and(equals(at("u", "labels"), "u"), and(greater("u", firstRowLength), ["NotEqual", "u", lastTile])),
            1,
            0,
          ],
          "u",
        ),
      ),
    ),
    `FindStat's St000177. A tile is labeled by its first place, which is in the first row exactly when the tile meets it; the last row is the single place at the end. ${EMPTY}`,
  ),
  stat(
    "FreeEntryCount",
    "The entries in tiles that meet neither the first row nor the last.",
    withTiles(
      floored(
        sumOver(
          eachCell,
          ["If", and(greater(at("u", "labels"), firstRowLength), ["NotEqual", at("u", "labels"), lastTile]), 1, 0],
          "u",
        ),
      ),
    ),
    `FindStat's St000178. ${EMPTY}`,
  ),
  stat(
    "FirstRowSum",
    "The sum of the entries of the first row.",
    nonEmpty(bindList("top", at(1), floored(["Sum", "top"]))),
    `FindStat's St000186; the same head as on plane partitions. ${EMPTY}`,
  ),
  stat(
    "DistinctEntryCount",
    "The number of distinct entries.",
    cellsAtLeast(1, withReading(["Length", ["Unique", "reading"]])),
    `FindStat's St001404; the same head as on semistandard tableaux. ${EMPTY}`,
  ),
  stat(
    "NonzeroEntryCount",
    "The number of nonzero entries.",
    cellsAtLeast(1, withReading(["Count", ["Filter", "reading", ["Function", ["NotEqual", "e", 0], "e"]]])),
    `FindStat's St001406; the same head as on alternating sign matrices. ${EMPTY}`,
  ),
  stat(
    "FirstRowDifference",
    "The first entry of the first row less its last: the largest entry less the smallest of the top row.",
    nonEmpty(bindList("top", at(1), subtract(at(1, "top"), ["Last", "top"]))),
    `FindStat's St001713. The first row weakly decreases, so the difference is never negative. ${EMPTY}`,
  ),
];
