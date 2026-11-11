// Maps on Gelfand-Tsetlin patterns, and from tableaux to them (Mp00036, Mp00076, Mp00082, Mp00210 to Mp00213).

import { at, bind, forEach, type CombinatorialMap, type MathJSON } from "../../src/map-helpers.ts";
import {
  cycleBody,
  inverseCycleBody,
  inversePromotionBody,
  promotionBody,
  tableauOfPattern,
} from "./gelfand-tsetlin-passes.ts";

const upTo = (n: MathJSON): MathJSON => ["Range", 1, n, 1];
const keep = (over: MathJSON, test: MathJSON, variable: string): MathJSON => [
  "Filter",
  over,
  ["Function", test, variable],
];

/** The pattern of width `m` of the tableau `_raw` (a bound name's worth of rows): level k lists, for each row j at most k,
 *  how many of its entries are at most k. */
const patternOfTableau = (m: MathJSON): MathJSON =>
  forEach(
    upTo(m),
    forEach(
      upTo(["Subtract", ["Add", m, 1], "gp_t"]),
      [
        "If",
        ["LessEqual", "gp_j", ["Length", "_raw"]],
        ["Count", keep(at("gp_j"), ["LessEqual", "gp_x", ["Subtract", ["Add", m, 1], "gp_t"]], "gp_x")],
        0,
      ],
      "gp_j",
    ),
    "gp_t",
  );

// The width is bound once: a repeated `Max` would run for every cell.
const patternOfRows: MathJSON = [
  "If",
  ["Equal", ["Length", "_raw"], 0],
  ["List"],
  bind("gp_m", ["Max", ["Flatten", "_raw"]], patternOfTableau("gp_m"), "integer"),
];

export const GELFAND_TSETLIN_MAPS: readonly CombinatorialMap[] = [
  {
    name: "SemistandardTableau",
    convert: true,
    from: "gelfand_tsetlin_pattern",
    to: "semistandard_tableau",
    body: tableauOfPattern,
    summary:
      "The semistandard tableau of a Gelfand-Tsetlin pattern: the rows are the shapes of the entries at most 1, 2, and so on.",
    note: "FindStat's Mp00036; the inverse of GelfandTsetlinPattern on semistandard tableaux.",
  },
  {
    name: "GelfandTsetlinPattern",
    convert: true,
    from: "semistandard_tableau",
    to: "gelfand_tsetlin_pattern",
    body: patternOfRows,
    summary:
      "The Gelfand-Tsetlin pattern of a semistandard tableau, of width its largest entry: the shapes of the entries at most k.",
    note: "FindStat's Mp00076; the inverse of SemistandardTableau.",
  },
  {
    name: "GelfandTsetlinPattern",
    convert: true,
    from: "standard_tableau",
    to: "gelfand_tsetlin_pattern",
    body: patternOfRows,
    summary:
      "The Gelfand-Tsetlin pattern of a standard tableau, of width its size: the shapes of the entries at most k.",
    note: "FindStat's Mp00082.",
  },
  {
    name: "GelfandTsetlinPromotion",
    from: "gelfand_tsetlin_pattern",
    to: "gelfand_tsetlin_pattern",
    body: promotionBody,
    summary:
      "Promotion of the pattern's tableau: the largest entries are removed, the rest slide outward, and every entry grows by one.",
    note: "FindStat's Mp00210, the inverse of InverseGelfandTsetlinPromotion. Computed as the Bender-Knuth involutions t_{m-1}, ..., t_1 in turn; the width stays m.",
  },
  {
    name: "InverseGelfandTsetlinPromotion",
    from: "gelfand_tsetlin_pattern",
    to: "gelfand_tsetlin_pattern",
    body: inversePromotionBody,
    summary:
      "Inverse promotion of the pattern's tableau: the entries 1 are removed, the rest slide inward, and every entry shrinks by one.",
    note: "FindStat's Mp00211, the inverse of GelfandTsetlinPromotion. Computed as the Bender-Knuth involutions t_1, ..., t_{m-1} in turn.",
  },
  {
    name: "GelfandTsetlinCycle",
    from: "gelfand_tsetlin_pattern",
    to: "gelfand_tsetlin_pattern",
    body: cycleBody,
    summary: "The crystal reflections s_{m-1}, ..., s_1 applied in turn to the pattern's tableau.",
    note: "FindStat's Mp00213, the inverse of InverseGelfandTsetlinCycle. A reflection s_i swaps the numbers of unmatched i's and (i + 1)'s in the row reading word (each i + 1 matched with a later i). Agrees with GelfandTsetlinPromotion on small patterns but not in general.",
  },
  {
    name: "InverseGelfandTsetlinCycle",
    from: "gelfand_tsetlin_pattern",
    to: "gelfand_tsetlin_pattern",
    body: inverseCycleBody,
    summary: "The crystal reflections s_1, ..., s_{m-1} applied in turn to the pattern's tableau.",
    note: "FindStat's Mp00212, the inverse of GelfandTsetlinCycle.",
  },
];
