// Standard tableaux to integer compositions (Mp00207).

import { fold as typedFold } from "../../collections/src/families/tables.ts";
import { lets, type CombinatorialMap, type MathJSON } from "../../src/map-helpers.ts";

const fold = (...args: Parameters<typeof typedFold>): MathJSON => typedFold(...args) as MathJSON;

const item = (list: MathJSON, index: MathJSON): MathJSON => ["At", list, index];

/** Mp00207, after FindStat's code: with y the column (from 0) of the last entry, entry i starts a new strip when its
 *  column is at most y, and then y is reset to 0 (not to the column of i, and not to -1). The accumulator is
 *  [y, strip sizes ...], the last size being the open strip. */
const body: MathJSON = lets(
  [
    ["hs_n", ["Length", ["Flatten", "_raw"]], "integer"],
    [
      "hs_columns",
      [
        "Map",
        [
          "Function",
          [
            "Sum",
            [
              "Map",
              [
                "Function",
                [
                  "Sum",
                  [
                    "Map",
                    ["Function", ["If", ["Equal", item("hs_row", "hs_c"), "hs_i"], ["Subtract", "hs_c", 1], 0], "hs_c"],
                    ["Range", 1, ["Length", "hs_row"], 1],
                  ],
                ],
                "hs_row",
              ],
              "_raw",
            ],
          ],
          "hs_i",
        ],
        ["Range", 1, "hs_n", 1],
      ],
      "list<integer>",
    ],
  ],
  [
    "If",
    ["Equal", "hs_n", 0],
    ["List"],
    [
      "Drop",
      fold(
        [
          "If",
          ["LessEqual", item("hs_columns", "hs_i"), item("hs_state", 1)],
          ["Join", ["List", 0], ["Drop", "hs_state", 1], ["List", 1]],
          [
            "Join",
            ["List", item("hs_columns", "hs_i")],
            ["Drop", ["Most", "hs_state"], 1],
            ["List", ["Add", ["Last", "hs_state"], 1]],
          ],
        ],
        "hs_state",
        "hs_i",
        ["List", -1, 0],
        ["Range", 1, "hs_n", 1],
        "list<integer>",
      ),
      1,
    ],
  ],
);

export const HORIZONTAL_STRIP_MAPS: readonly CombinatorialMap[] = [
  {
    name: "HorizontalStripSizes",
    from: "standard_tableau",
    to: "composition",
    body,
    summary: "The sizes of the consecutive runs of entries cut where an entry is not strictly right of the one before.",
    note: "FindStat's Mp00207. Follows FindStat's code and data rather than the title's \"minimal composition\".",
  },
];
