// Dyck paths to perfect matchings (Mp00146).

import { at, bind, forEach, type CombinatorialMap, type MathJSON } from "../../src/map-helpers.ts";

const upTo = (k: MathJSON): MathJSON => ["Range", 1, k, 1];
const steps: MathJSON = ["Length", "_raw"];

/** The height after step j. */
const heights: MathJSON = forEach(
  upTo(steps),
  ["Sum", forEach(upTo("j"), ["Subtract", ["Multiply", 2, at("t")], 1], "t")],
  "j",
);

/** The down step that closes the up step at i: the first later step that is lower than it. */
const closerOf: MathJSON = [
  "Min",
  forEach(
    upTo(steps),
    [
      "If",
      ["Greater", "j", "i"],
      ["If", ["Less", at("j", "tm_h"), at("i", "tm_h")], "j", ["Add", steps, 1]],
      ["Add", steps, 1],
    ],
    "j",
  ),
];

export const TUNNEL_MATCHING_MAPS: readonly CombinatorialMap[] = [
  {
    name: "PerfectMatching",
    convert: true,
    from: "dyck_path",
    to: "perfect_matching",
    body: [
      "If",
      ["Equal", steps, 0],
      ["List"],
      bind(
        "tm_h",
        heights,
        bind(
          "tm_flat",
          ["Flatten", forEach(upTo(steps), ["If", ["Equal", at("i"), 1], ["List", "i", closerOf], ["List"]])],
          forEach(
            upTo(["Divide", steps, 2]),
            ["List", at(["Subtract", ["Multiply", 2, "k"], 1], "tm_flat"), at(["Multiply", 2, "k"], "tm_flat")],
            "k",
          ),
          "list<integer>",
        ),
        "list<integer>",
      ),
    ],
    summary: "The noncrossing matching that joins each up step to the down step closing its tunnel.",
    note: "FindStat's Mp00146, an injection.",
  },
];
