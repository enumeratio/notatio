// Maps from decorated permutations (Mp00253, Mp00255, Mp00256). The contents are Sage's list: entry i is the
// image of i, and a fixed point decorated `-` is stored negated.

import { at, forEach, positions, type CombinatorialMap, type MathJSON } from "../../src/map-helpers.ts";

/** The underlying permutation's entry at position p. */
const imageAt = (p: MathJSON): MathJSON => ["Abs", at(p)];

/** The anti-exceedance positions p: π(p) < p, or p is a fixed point decorated `+` (entry p stays p). */
const antiExceedance = (inside: boolean): MathJSON => {
  const member: MathJSON = ["Or", ["Less", imageAt("p"), "p"], ["Equal", at("p"), "p"]];
  return ["Filter", positions, ["Function", inside ? member : ["Not", member], "p"]];
};

const lowerBody: MathJSON = [
  "If",
  ["Equal", ["Length", "_raw"], 0],
  ["List"],
  ["Join", forEach(antiExceedance(true), imageAt("p"), "p"), forEach(antiExceedance(false), imageAt("p"), "p")],
];

const upperBody: MathJSON = [
  "If",
  ["Equal", ["Length", "_raw"], 0],
  ["List"],
  ["Join", antiExceedance(true), antiExceedance(false)],
];

export const DECORATED_PERMUTATION_MAPS: readonly CombinatorialMap[] = [
  {
    name: "Permutation",
    convert: true,
    from: "decorated_permutation",
    to: "permutation",
    body: forEach(positions, imageAt("i")),
    summary: "The underlying permutation of a decorated permutation: the decorations are forgotten.",
    note: "FindStat's Mp00253, a surjection.",
    findstat: ["Mp00253"],
  },
  {
    name: "LowerGrassmannPermutation",
    from: "decorated_permutation",
    to: "permutation",
    body: lowerBody,
    summary:
      "The lower bound u of the Grassmann interval [u, v] of a decorated permutation w: u = wv, the entries of w read first at the anti-exceedance positions and then at the rest.",
    note: "FindStat's Mp00255. The anti-exceedance positions are those p with w(p) < p, and the fixed points decorated +. Not injective.",
  },
  {
    name: "UpperGrassmannPermutation",
    from: "decorated_permutation",
    to: "permutation",
    body: upperBody,
    summary:
      "The upper bound v of the Grassmann interval [u, v] of a decorated permutation: the anti-exceedance positions in order, then the other positions in order.",
    note: "FindStat's Mp00256. v is Grassmannian: it has at most one descent.",
  },
];
