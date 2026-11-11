// Dyck paths to skew partitions (Mp00233).

import { lets, type CombinatorialMap, type MathJSON } from "../../src/map-helpers.ts";
import { dyckGuard } from "./maps.ts";

const steps: MathJSON = ["Length", "_raw"];
const semilength: MathJSON = ["Divide", steps, 2];
const word = (k: MathJSON): MathJSON => ["At", "_raw", k];

/** The cells west of row `row` (counted from the top) of the path's parallelogram polyomino. The path is the
 *  Delest-Viennot word: step 1 up, then for p = 2 .. n a pair (lower path east, upper path north), then down. With
 *  `list` the positions of the upper path's (or the lower path's) north steps, the row i from the bottom has
 *  list(i) - i cells before its start (or its end). */
const rowEnd = (rows: MathJSON, list: string, row: MathJSON): MathJSON => [
  "Subtract",
  ["At", list, ["Subtract", ["Add", rows, 1], row]],
  ["Subtract", ["Add", rows, 1], row],
];

const skewBody: MathJSON = [
  "If",
  ["Equal", steps, 0],
  ["List", ["List"], ["List"]],
  lets(
    [
      // The upper path's north steps: step 1, and p when the path's step 2p - 1 is up.
      [
        "pp_up",
        [
          "Filter",
          ["Range", 1, semilength, 1],
          ["Function", ["Equal", word(["Subtract", ["Multiply", 2, "p"], 1]), 1], "p"],
        ],
        "list<integer>",
      ],
      // The lower path's north steps: step n + 1, and p when the path's step 2p - 2 is down.
      [
        "pp_low",
        [
          "Filter",
          ["Range", 2, ["Add", semilength, 1], 1],
          ["Function", ["Equal", word(["Subtract", ["Multiply", 2, "p"], 2]), 0], "p"],
        ],
        "list<integer>",
      ],
      ["pp_rows", ["Length", "pp_up"]],
    ],
    [
      "List",
      ["Map", ["Function", rowEnd("pp_rows", "pp_low", "j"), "j"], ["Range", 1, "pp_rows", 1]],
      [
        "Filter",
        ["Map", ["Function", rowEnd("pp_rows", "pp_up", "j"), "j"], ["Range", 1, "pp_rows", 1]],
        ["Function", ["Greater", "c", 0], "c"],
      ],
    ],
  ),
];

export const POLYOMINO_MAPS: readonly CombinatorialMap[] = [
  {
    name: "SkewPartition",
    convert: true,
    from: "dyck_path",
    to: "skew_partition",
    body: skewBody,
    guard: dyckGuard,
    summary:
      "The skew shape of the path's parallelogram polyomino (Delest-Viennot), its rows from the top, each ending under the cell above it.",
    note: "FindStat's Mp00233. A path of semilength n gives a polyomino of semiperimeter n + 1; an injection onto the skew shapes of parallelogram polyominoes.",
    findstat: ["Mp00233"],
  },
];
