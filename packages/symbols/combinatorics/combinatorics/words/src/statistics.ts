// Binary-word statistics, over `_x` = the letters of the word, each 0 or 1.
//
// Most are a fold with a small state: the run of ones in progress, a running height.

import type { Definition, MathJSON } from "../../src/statistics/types.ts";
import {
  add,
  adjacent,
  and,
  at,
  atMostValue,
  carried,
  count,
  equals,
  floored,
  fold,
  greater,
  hasPair,
  here,
  length,
  next,
  nonEmpty,
  positions,
  risesAfter,
  subtract,
  sumOver,
  visiting,
  x,
} from "../../src/statistics/vocabulary.ts";

const on = "BinaryWord";
const stat = (head: string, summary: string, expr: MathJSON, note?: string): Definition => ({
  head,
  on,
  summary,
  expr,
  ...(note ? { note } : {}),
});

const k = length();
const list = (...items: MathJSON[]): MathJSON => ["List", ...items];
const times = (a: MathJSON, b: MathJSON): MathJSON => ["Multiply", a, b];
/** The last field of a fold's state, which holds the answer. */
const result = (state: MathJSON): MathJSON => at(2, state);
/** `a` and `b` differ. */
const differ = (a: MathJSON, b: MathJSON): MathJSON => greater(["Abs", subtract(a, b)], 0);

const ones: MathJSON = floored(["Sum", x]);

/** The run of ones in progress after this letter: one longer on a 1, gone on a 0. */
const runAfter: MathJSON = times(add(carried(1), 1), visiting);

/** Leading ones: the state is whether every letter so far is a 1, and how many there were. */
const leadingOnes: MathJSON = result(
  fold(x, list(1, 0), list(times(carried(1), visiting), add(carried(2), times(carried(1), visiting)))),
);

/** Runs of ones of odd length: a trailing 0 closes the last run; the state is the run in progress and the odd runs closed. */
const oddOneRuns: MathJSON = result(
  fold(
    ["Join", x, list(0)],
    list(0, 0),
    list(runAfter, add(carried(2), times(subtract(1, visiting), ["Mod", carried(1), 2]))),
  ),
);

const longestOneRun: MathJSON = result(fold(x, list(0, 0), list(runAfter, ["Max", carried(2), runAfter])));

/** The zeros less the ones among the letters so far, with the 0 as a step up. */
const heightAfter: MathJSON = add(carried(1), subtract(1, times(2, visiting)));
const depth: MathJSON = result(fold(x, list(0, 0), list(heightAfter, ["Max", carried(2), heightAfter])));

/** The ones less the zeros among the letters so far; a prefix is balanced when it is back at 0. */
const balanceAfter: MathJSON = add(carried(1), subtract(times(2, visiting), 1));
const balancedPrefixes: MathJSON = result(
  fold(x, list(0, 0), list(balanceAfter, add(carried(2), ["If", equals(balanceAfter, 0), 1, 0]))),
);

/** The letter opposite position `i`. */
const mirrored: MathJSON = at(subtract(add(k, 1), "i"));

export const WORD_STATISTICS: readonly Definition[] = [
  stat("HammingWeight", "The number of ones.", ones),
  stat("LeadingOnesCount", "The number of ones before the first 0.", leadingOnes),
  stat(
    "OnePositionSum",
    "The sum of the positions of the ones.",
    nonEmpty(floored(sumOver(positions, times(here, "i")))),
  ),
  stat(
    "OneRunCount",
    "The number of maximal runs of ones.",
    nonEmpty(add(at(1), hasPair(count(adjacent, risesAfter)))),
    "A run starts at the first letter if it is a 1, and after each 0 followed by a 1.",
  ),
  stat("OddOneRunCount", "The number of maximal runs of ones of odd length.", oddOneRuns),
  stat("LongestRunOfOnes", "The length of the longest run of ones.", longestOneRun),
  stat(
    "ChangeCount",
    "The positions i where the letters i and i + 1 differ.",
    hasPair(count(adjacent, differ(here, next))),
  ),
  stat(
    "PathDepth",
    "The most zeros less ones among the prefixes.",
    depth,
    "Reads the word as a path with a 0 a step up and a 1 a step down; the empty prefix counts, so the depth is at least 0.",
  ),
  stat("OnesMinusZeros", "The number of ones less the number of zeros.", subtract(times(2, ones), k)),
  stat(
    "BalancedPrefixCount",
    "The nonempty prefixes with as many 0s as 1s.",
    balancedPrefixes,
    "The returns of the word, read as a lattice path, to the main diagonal.",
  ),
  stat(
    "SymmetryDegree",
    "The positions i up to half the length where the letters i and n + 1 - i agree.",
    nonEmpty(count(positions, and(atMostValue(times(2, "i"), k), equals(here, mirrored)))),
  ),
];
