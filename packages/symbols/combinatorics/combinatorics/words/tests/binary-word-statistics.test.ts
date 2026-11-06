import { bareEngine } from "@enumeratio/engine/testing";
import { expect, test } from "vite-plus/test";
import { declareCombinatorics } from "../../src/index.ts";
import { applyDefinition } from "../../src/statistics/declare.ts";
import { bySignature } from "../../src/statistics/types.ts";
import { WORD_STATISTICS } from "../src/statistics.ts";
import { descentsOfWord, SHARED_WORD_READINGS, WORD_READINGS } from "./binary-word-findstat-readings.ts";

// The whole library, as a page evaluates it.
const ce = bareEngine();
declareCombinatorics(ce);
const index = bySignature(WORD_STATISTICS);

/** Every binary word of length n. */
const words = (n: number): number[][] =>
  n === 0 ? [[]] : words(n - 1).flatMap((rest) => [0, 1].map((letter) => [...rest, letter]));
const upTo = (n: number): number[][] => Array.from({ length: n + 1 }, (_, k) => k).flatMap(words);

const DEEP = process.env.DEEP_TESTS === "1";
/** FindStat heads that cost tens of milliseconds a word: the standard run reads them on words up to length 4, DEEP_TESTS up to 8. */
const COSTLY = new Set([
  "DistinctFactorCount",
  "BorderLength",
  "DistinctSubsequenceCount",
  "MinimalPeriod",
  "RepetitionExponent",
  "Balance",
  "ShortestPalindromicDecompositionLength",
  "PalindromicDecompositionCount",
  "LongestCatalanFactorSemilength",
  "CatalanFactorCount",
  "InternalInversions",
  "UniqueFactorLength",
  "LyndonFactorizationLength",
  "LongestPalindromicPrefix",
  "LongestPalindromicFactor",
  "LongestPalindromicSubsequence",
  "DistinctCubeCount",
  "DistinctSquareCount",
  "CyclicShiftIndex",
  "BorderCount",
  "DescentWordPreimageCount",
  "LatticePathsAboveWordCount",
  "SameEndpointPathsAboveWordCount",
  "Flex",
  "EvenPalindromicPrefixHalfLength",
  "OddPalindromicPrefixHalfLength",
  "LongestPalindromicFactorStartingWithOne",
  "BaselineCrossings",
  "PrimitiveFactorCount",
  "ReverseComplementFactorHalfLength",
  "ReverseComplementFactorHalfLengthStartingWithOne",
]);
const sizeFor = (head: string): number => (COSTLY.has(head) && !DEEP ? 4 : 8);

const evaluate = (head: string, word: readonly number[]): number =>
  applyDefinition(ce, index.get(`${head}@BinaryWord`)!, ce.box(["List", ...word] as never)).re;

test("every binary-word definition has an independent reading", () => {
  const heads = WORD_STATISTICS.filter((d) => d.on === "BinaryWord").map((d) => d.head);
  for (const head of heads) expect(WORD_READINGS[head], head).toBeDefined();
  expect(Object.keys(WORD_READINGS).length).toBe(heads.length);
});

for (const [head, expected] of Object.entries(WORD_READINGS))
  test(`${head} agrees over every word of length 0..${sizeFor(head)}`, () => {
    for (const w of upTo(sizeFor(head))) expect(evaluate(head, w), w.join("")).toBe(expected(w));
  });

test("each head called on the carrier value gives the reading", () => {
  for (const [head, expected] of Object.entries(WORD_READINGS))
    for (const w of upTo(Math.min(4, sizeFor(head))))
      expect(ce.box([head, ["BinaryWord", ["List", ...w]]] as never).evaluate().re, `${head} ${w.join("")}`).toBe(
        expected(w),
      );
});

// A shared head is FindStat's on nonempty words only; it reads a binary word through `CombinatorialStat`.
test("each shared head gives the reading on a binary word, over every nonempty word of length 1..5 (1..8 under DEEP_TESTS)", () => {
  for (const [head, expected] of Object.entries(SHARED_WORD_READINGS))
    for (const w of upTo(DEEP ? 8 : 5).filter((word) => word.length > 0))
      expect(
        ce.box(["CombinatorialStat", ["BinaryWord", ["List", ...w]], `'${head}'`] as never).evaluate().re,
        `${head} ${w.join("")}`,
      ).toBe(expected(w));
});

// `Descents` is a permutation head that also reads a binary word through `CombinatorialStat` (FindStat's St000291).
test("Descents on a binary word counts the factors 10, over every word of length 0..8", () => {
  for (const w of upTo(8))
    expect(
      ce.box(["CombinatorialStat", ["BinaryWord", ["List", ...w]], "'Descents'"] as never).evaluate().re,
      w.join(""),
    ).toBe(descentsOfWord(w));
});
