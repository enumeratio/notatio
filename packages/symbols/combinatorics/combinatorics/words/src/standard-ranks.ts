import { at, forEach, type MathJSON, positions } from "../../src/map-helpers.ts";

/** Mp00336, and the rank of every entry of a parking function: the entries below entry i, plus those equal to it up to
 *  and including i, so equal entries rank left to right. */
export const standardRanks: MathJSON = [
  "If",
  ["Equal", ["Length", "_raw"], 0],
  ["List"],
  forEach(positions, [
    "Add",
    ["Fold", ["Function", ["If", ["Less", at("j"), at("i")], ["Add", "sr_c", 1], "sr_c"], "sr_c", "j"], 0, positions],
    [
      "Fold",
      ["Function", ["If", ["Equal", at("j"), at("i")], ["Add", "sr_d", 1], "sr_d"], "sr_d", "j"],
      0,
      ["Range", 1, "i", 1],
    ],
  ]),
];
