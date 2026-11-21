// The exact counts (`Definition.exact`): compiled over BigInts, or interpreted, and never as doubles. Each pinned input has an
// intermediate past 2^53, where doubles round: the compiled answer is the exact one (or declines), and under DEEP_TESTS the
// interpreter's routes agree with it.

import { createEngine } from "@notatio/engine/testing";
import { expect, test } from "vite-plus/test";
import { declareCombinatorics } from "../src/index.ts";
import { ALL_STATISTICS } from "../src/statistics/all.ts";
import { COMPILED, compiledStatistic } from "../src/statistics/compiled.ts";
import { integerOf } from "../src/statistics/generate-exact.ts";
import { signatureOf } from "../src/statistics/types.ts";
import { readSnapshot } from "../scripts/verdict-snapshot.ts";

const DEEP = process.env.DEEP_TESTS === "1";
const ce = createEngine(declareCombinatorics);
const list = (...items: number[]): unknown => ["List", ...items];
const zeros = (n: number): number[] => Array.from({ length: n }, () => 0);

/** [head, carrier, subject, the exact answer]: the answers of the interpreter and, for a partition, of FindStat's crawl. */
const PINS: readonly (readonly [string, string, number[], bigint])[] = [
  ["SmirnovWordCount", "IntegerPartition", [3, 3, 3, 3, 3, 3, 3, 2], 6231814263722880n],
  ["StandardTableauCount", "IntegerPartition", [9, 6, 5, 3], 2007835830n],
  ["KrewerasNumber", "IntegerPartition", [7, 6, 5, 4, 3, 1, 1, 1], 994593600n],
  ["StandardTableauCountWithOddFirstDescent", "IntegerPartition", [2, 2, 2, 1, 1, 1, 1, 1, 1], 119n],
  ["StandardTableauCountWithEvenFirstDescent", "IntegerPartition", [3, 2, 1, 1, 1, 1, 1, 1, 1], 72n],
  ["DesarrangementTableauCount", "IntegerPartition", [10, 2], 9n],
  ["NorthStepOrderingCount", "DyckPath", [1, 1, 1, 1, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0], 50n],
  ["SemistandardTableauCountWithEntriesUpToSize", "IntegerPartition", [10, 5, 3, 2], 7266591472746375n],
  ["DualImmaculateMonomialColumnSum", "IntegerComposition", [4, 4, 4, 4, 2], 99295633968n],
  ["PalindromicDecompositionCount", "BinaryWord", zeros(35), 2n ** 34n],
  ["LyndonFactorizationLength", "BinaryWord", zeros(35), 35n],
  [
    "StandardRibbonTableauCount",
    "IntegerComposition",
    [1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1],
    3712914075133121n,
  ],
  ["InverseDescentParkingFunctionCount", "IntegerComposition", [1, 1, 1, 2, 1, 2, 2, 2, 1, 2, 1, 1], 7011265795854481n],
];

const definitionOf = (head: string, carrier: string) =>
  ALL_STATISTICS.find((d) => d.head === head && d.on === carrier)!;
const exactDefinitions = ALL_STATISTICS.filter((d) => d.exact === true);

test("exact counts exist", () => {
  expect(exactDefinitions.length).toBeGreaterThan(0);
});

/** The exact counts the BigInt compiler cannot take, or whose BigInt code disagreed with the interpreter in the build's cross-check:
 *  they are interpreted, which is exact. A new one here is slower than the rest, so it should be a deliberate addition; one that
 *  starts compiling should leave the list. */
const INTERPRETED: string[] = [
  "BraceletCount@IntegerPartition", // a Math function of a bigint
  "ConjugacyClassSize@Permutation", // the BigInt code answers n! for [2, 1]: a lowering that differs, so the verdict is no
  "CoxeterElementFactorizationCount@CartanType", // a quotient that is not an integer until the last step
  "GammaNumber@CartanType", // a quotient that is not an integer until the last step
  "InvariantGraphCount@IntegerPartition", // a Math function of a bigint
  "InvariantOrientedCycleCount@IntegerPartition", // a Math function of a bigint
  "InverseDescentParkingFunctionCount@IntegerComposition", // a double mixed into a bigint
  "LusztigAFunction@Permutation", // a quotient that is not an integer until the last step
  "MaximalComplexityFactorLength@BinaryWord", // the compiler's code reads a variable it never binds
  "MinimalStarTranspositionFactorizationCount@Permutation", // a quotient that is not an integer until the last step
  "NecklaceCount@IntegerPartition", // a Math function of a bigint
  "ScaledReciprocalPositionValueSum@Permutation", // a rational sum: a Math function of a bigint
  "SingletonRefinementCount@IntegerPartition", // a Math function of a bigint
  "StandardRibbonTableauCount@IntegerComposition", // the BigInt code answers NaN on a single part
];

test("exactly these exact counts fall back to the interpreter", () => {
  const interpreted = exactDefinitions.filter((d) => compiledStatistic(ce, d) === undefined).map(signatureOf);
  expect(interpreted.toSorted()).toEqual(INTERPRETED);
});

test("no doubles' code is built for an exact count", () => {
  expect(exactDefinitions.filter((d) => COMPILED[signatureOf(d)] !== undefined).map(signatureOf)).toEqual([]);
});

test("every compiled exact count has an agreeing verdict in the snapshot", () => {
  const verdicts = new Map(readSnapshot().map((row) => [`${row.step}\0${row.signature}`, row.verdict]));
  const without = exactDefinitions
    .filter((d) => compiledStatistic(ce, d) !== undefined)
    .filter((d) => verdicts.get(`compile-exact\0${signatureOf(d)}`) !== "agrees");
  expect(without.map(signatureOf)).toEqual([]);
});

for (const [head, carrier, subject, expected] of PINS) {
  const definition = definitionOf(head, carrier);
  const call = [carrier, list(...subject)];

  test(`${head}: ${JSON.stringify(subject)} is exact where compiled`, () => {
    expect(definition.exact).toBe(true);
    const answer = compiledStatistic(ce, definition)?.(list(...subject));
    // Compiled code answers the exact count or declines to the interpreter; it never answers a rounded one.
    if (answer !== undefined) expect(BigInt(answer as number)).toBe(expected);
  });

  // The interpreter takes a second or more on some of these, so every route is held to it in the deep run.
  test.runIf(DEEP)(`${head}: ${JSON.stringify(subject)} is exact on every route`, () => {
    for (const route of [
      ce.box([head, call] as never).evaluate(),
      ce.box([head, call] as never).N(),
      ce.box(["CombinatorialStat", call, `'${head}'`] as never).evaluate(),
    ])
      expect(integerOf(route.json), JSON.stringify(route.json)).toBe(expected);
  });
}

// Past 2^53 the count is a big integer only the interpreter carries: compiled code declines rather than answers a double.
test("StandardTableauCount past 2^53 declines to the interpreter's integer", () => {
  const definition = definitionOf("StandardTableauCount", "IntegerPartition");
  const subject = list(8, 7, 6, 5, 4, 3, 2, 1);
  expect(compiledStatistic(ce, definition)?.(subject)).toBeUndefined();
  const answer = ce.box(["StandardTableauCount", ["IntegerPartition", subject]] as never).evaluate().json;
  expect(integerOf(answer)).toBe(29258366996258488320n);
});
