// Skew-partition statistics, over `_x` = [outer, inner]: the part lists of λ and μ for the shape λ/μ,
// both weakly decreasing. Row r of the shape holds the columns μᵣ .. λᵣ - 1 (counted from 0), and the
// inner list is padded with zeros to the length of the outer, so that `lam` and `mu` read alike.

import type { Definition, MathJSON } from "../../src/statistics/types.ts";
import {
  add,
  atLeastValue,
  atMostValue,
  at,
  bind,
  bindList,
  equals,
  floored,
  fold,
  forEach,
  greater,
  length,
  less,
  sumOver,
  subtract,
  upTo,
  where,
} from "../../src/statistics/vocabulary.ts";

const on = "SkewPartition";
const stat = (head: string, summary: string, expr: MathJSON, note?: string): Definition => ({
  head,
  on,
  summary,
  expr,
  ...(note ? { note } : {}),
});

const EMPTY = "The empty shape gives 0.";
const EMPTY_ONE = "The empty shape gives 1.";

/** The rows 1 .. length of the outer partition. */
const rows: MathJSON = upTo(length("lam"));
const lam = (r: MathJSON): MathJSON => at(r, "lam");
const mu = (r: MathJSON): MathJSON => at(r, "mu");
const one = (test: MathJSON): MathJSON => ["If", test, 1, 0];
const overRows = (body: MathJSON): MathJSON => floored(sumOver(rows, body));
/** `body` with `lam` the outer partition and `mu` the inner one padded to its length; the empty shape gives `otherwise`. */
const withShape = (body: MathJSON, otherwise: MathJSON = 0): MathJSON => [
  "If",
  equals(length(at(1)), 0),
  otherwise,
  bindList(
    "lam",
    at(1),
    bindList(
      "raw",
      at(2),
      bindList("mu", forEach(rows, ["If", atMostValue("i", length("raw")), at("i", "raw"), 0]), body),
    ),
  ),
];

/** Row r holds the cell of an inner corner: a cell that can be added to μ, in the first row or under a longer row. */
const innerCornerAt = (r: MathJSON): MathJSON => ["If", equals(r, 1), 1, one(greater(mu(subtract(r, 1)), mu(r)))];
/** Row r ends in an outer corner: a cell of λ that can be removed, in the last row or over a shorter row. */
const outerCornerAt = (r: MathJSON): MathJSON => [
  "If",
  equals(r, length("lam")),
  1,
  one(greater(lam(r), lam(add(r, 1)))),
];
/** The inner and the outer corner of row r are one cell: the row holds a single cell. */
const sharedCornerAt = (r: MathJSON): MathJSON => [
  "If",
  equals(lam(r), add(mu(r), 1)),
  ["Multiply", innerCornerAt(r), outerCornerAt(r)],
  0,
];

/** The columns 0 .. width - 1 of the outer partition. */
const columns: MathJSON = ["Range", 0, subtract(["Max", "lam"], 1)];
/** Column c is in the set of columns numbered `mask`: the bit of 2^c, which `mask` mod 2^(c+1) reaches. */
const hasColumn = (mask: MathJSON, column: MathJSON): MathJSON =>
  atLeastValue(["Mod", mask, ["Power", 2, add(column, 1)]], ["Power", 2, column]);
/** The masks 0 .. 2^width - 1: each set of columns holding a rook. */
const masks: MathJSON = ["Range", 0, subtract(["Power", 2, ["Max", "lam"]], 1)];
/**
 * The rook placements on the board, counted by the set of columns they use: entry m + 1 is the number of placements whose
 * columns are the bits of m. Each row either takes no rook or one in a free column of its cells.
 */
const placementsByColumns: MathJSON = fold(
  rows,
  forEach(masks, one(equals("m", 0)), "m"),
  forEach(
    masks,
    add(
      at(add("m", 1), "a"),
      floored(
        sumOver(
          where(columns, ["And", atMostValue(mu("b"), "c"), less("c", lam("b"))], "c"),
          ["If", hasColumn("m", "c"), at(add(subtract("m", ["Power", 2, "c"]), 1), "a"), 0],
          "c",
        ),
      ),
    ),
    "m",
  ),
);
const columnsUsed = (mask: MathJSON): MathJSON => floored(sumOver(columns, one(hasColumn(mask, "c")), "c"));

/** The standard fillings are counted over the order ideals of the shape, numbered by the cells filled in each row as digits. */
const radix: MathJSON = forEach(rows, add(subtract(lam("i"), mu("i")), 1));
const stride: MathJSON = forEach(rows, [
  "If",
  equals("i", 1),
  1,
  ["Product", forEach(upTo(subtract("i", 1)), at("q", "radix"), "q")],
]);
/** The cells filled in row r at ideal `ideal`: its digit, the ideal mod stride * radix less the ideal mod stride, over stride. */
const filledIn = (ideal: MathJSON, r: MathJSON): MathJSON => [
  "Divide",
  subtract(["Mod", ideal, ["Multiply", at(r, "stride"), at(r, "radix")]], ["Mod", ideal, at(r, "stride")]),
  at(r, "stride"),
];
/** The row r of the ideal `ideal`, as a part of the partition λ/μ has filled so far. */
const partAt = (ideal: MathJSON, r: MathJSON): MathJSON => add(mu(r), filledIn(ideal, r));
/** The ways to reach `ideal`: place the last entry in a row whose removal leaves a partition. */
const waysToReach: MathJSON = floored(
  sumOver(rows, [
    "If",
    less(filledIn("b", "i"), 1),
    0,
    [
      "If",
      ["Or", equals("i", length("lam")), atLeastValue(subtract(partAt("b", "i"), 1), partAt("b", add("i", 1)))],
      at(add(subtract("b", at("i", "stride")), 1), "a"),
      0,
    ],
  ]),
);

/** Cell (r, c), counted from 0 in the column, lies in the shape. */
const inShape = (r: MathJSON, c: MathJSON): MathJSON => one(["And", atMostValue(mu(r), c), less(c, lam(r))]);
/**
 * The cells of the two diagonals k and k + 1 in the order row by row, 1 where a cell is in the shape. Consecutive cells of
 * this list are neighbors, so a maximal run of cells in the shape is a path, and a path of m cells holds floor(m / 2)
 * disjoint pairs of neighbors.
 */
const diagonalPair = (k: MathJSON): MathJSON => [
  "Flatten",
  forEach(rows, ["List", inShape("r", add(subtract("r", 1), k)), inShape("r", add("r", k))], "r"),
];
/** The pairs of neighbors found by walking the list: (the length of the current run, the pairs so far). */
const pairsInRuns = (k: MathJSON): MathJSON =>
  at(
    2,
    fold(
      diagonalPair(k),
      ["List", 0, 0],
      [
        "List",
        ["If", equals("b", 1), add(["At", "a", 1], 1), 0],
        ["If", ["And", equals("b", 1), equals(["Mod", ["At", "a", 1], 2], 1)], add(["At", "a", 2], 1), ["At", "a", 2]],
      ],
    ),
  );

export const FINDSTAT_SKEW_PARTITION_STATISTICS: readonly Definition[] = [
  stat(
    "FirstRowMissingBoxCount",
    "The boxes of the first row that the shape leaves out: the first part of the inner partition.",
    withShape(mu(1)),
    `FindStat's St001435. ${EMPTY}`,
  ),
  stat(
    "MissingBoxCount",
    "The boxes of the outer partition that the shape leaves out: the size of the inner partition.",
    withShape(floored(["Sum", "mu"])),
    `FindStat's St001438. ${EMPTY}`,
  ),
  stat(
    "InnerCornerCount",
    "The cells that can be added to the inner partition, within the rows of the shape.",
    withShape(overRows(innerCornerAt("i"))),
    `FindStat's St001487, the outside corners of the inner partition; a reduced shape has no row past the last of the outer partition. ${EMPTY}`,
  ),
  stat(
    "SkewCornerCount",
    "The cells that are an inner corner or an outer corner of the shape, counted once when both.",
    withShape(overRows(subtract(add(innerCornerAt("i"), outerCornerAt("i")), sharedCornerAt("i")))),
    `FindStat's St001488, the removable cells of the skew partition: the union of its inner and outer corners. A row holding one cell can have the same cell as both. ${EMPTY}`,
  ),
  stat(
    "SkewConnectedComponentCount",
    "The connected components of the shape: rows that start a component, the first row and every row that shares no column with the row above.",
    withShape(
      overRows([
        "If",
        greater(lam("i"), mu("i")),
        ["If", equals("i", 1), 1, one(atMostValue(lam("i"), mu(subtract("i", 1))))],
        0,
      ]),
    ),
    `FindStat's St001490, the components of the cell poset. Row i meets the row above in a column exactly when λᵢ exceeds μᵢ₋₁. ${EMPTY}`,
  ),
  stat(
    "TwoByTwoSquareCount",
    "The cells of the shape whose neighbors to the right, below and below to the right are also in it.",
    withShape(
      overRows(["If", equals("i", length("lam")), 0, ["Max", subtract(subtract(lam(add("i", 1)), 1), mu("i")), 0]]),
    ),
    `FindStat's St001596. A cell (i, j) with the cell (i + 1, j + 1) also in the shape is the top left of a square, so row i counts the columns from μᵢ to λᵢ₊₁ - 2. ${EMPTY}`,
  ),
  stat(
    "FrobeniusRank",
    "The fewest border strips that the shape divides into.",
    withShape(
      subtract(
        subtract(floored(["Sum", "lam"]), floored(["Sum", "mu"])),
        floored(sumOver(["Range", subtract(0, length("lam")), ["Max", "lam"]], pairsInRuns("k"), "k")),
      ),
    ),
    `FindStat's St001597. A strip is a path of cells going up or right, so the fewest strips are the cells less the most pairs of neighbors that no cell takes twice as the one before and as the one after. Those pairs lie between consecutive diagonals, in runs, and a run of m cells gives floor(m / 2). A connected shape of one strip is a border strip. ${EMPTY}`,
  ),
  stat(
    "StandardTableauCount",
    "The standard Young tableaux of the shape: the ways to fill its cells with 1 .. n, rising along rows and down columns.",
    withShape(
      bindList(
        "radix",
        radix,
        bindList("stride", stride, [
          "If",
          equals(["Product", "radix"], 1),
          1,
          at(
            ["Product", "radix"],
            fold(upTo(subtract(["Product", "radix"], 1)), ["List", 1], ["Join", "a", ["List", waysToReach]]),
          ),
        ]),
      ),
      1,
    ),
    `FindStat's St001595. Counted over the order ideals of the shape, a filling being a walk that adds one cell at a time; the table has one entry for each, up to 2^n, so a shape of 20 cells in as many rows is slow. ${EMPTY_ONE}`,
  ),
  stat(
    "RookPlacementCount",
    "The placements of any number of non-attacking rooks on the cells of the shape.",
    withShape(bind("v", placementsByColumns, floored(["Sum", "v"]), "list<integer>"), 1),
    `FindStat's St001658. The empty placement counts. The table has 2^w entries for w columns, so a shape wider than about 20 columns is slow. ${EMPTY_ONE}`,
  ),
  stat(
    "MaximalRookPlacementCount",
    "The ways to place as many non-attacking rooks as possible on the cells of the shape.",
    withShape(
      bind(
        "v",
        placementsByColumns,
        bind(
          "top",
          ["Max", forEach(masks, ["If", greater(at(add("m", 1), "v"), 0), columnsUsed("m"), 0], "m")],
          floored(sumOver(masks, ["If", equals(columnsUsed("m"), "top"), at(add("m", 1), "v"), 0], "m")),
          "integer",
        ),
        "list<integer>",
      ),
      1,
    ),
    `FindStat's St001660, the last nonzero rook number of the shape, from the table of RookPlacementCount. ${EMPTY_ONE}`,
  ),
];
