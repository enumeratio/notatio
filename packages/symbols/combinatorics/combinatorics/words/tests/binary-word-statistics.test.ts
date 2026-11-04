import { bareEngine } from "@enumeratio/engine/testing";
import { expect, test } from "vite-plus/test";
import { declareCombinatorics } from "../../src/index.ts";
import { applyDefinition } from "../../src/statistics/declare.ts";
import { bySignature } from "../../src/statistics/types.ts";
import { WORD_STATISTICS } from "../src/statistics.ts";
import { WORD_READINGS } from "./binary-word-findstat-readings.ts";

// The whole library, as a page evaluates it.
const ce = bareEngine();
declareCombinatorics(ce);
const index = bySignature(WORD_STATISTICS);

/** Every binary word of length n. */
const words = (n: number): number[][] =>
  n === 0 ? [[]] : words(n - 1).flatMap((rest) => [0, 1].map((letter) => [...rest, letter]));
const upTo = (n: number): number[][] => Array.from({ length: n + 1 }, (_, k) => k).flatMap(words);

const evaluate = (head: string, word: readonly number[]): number =>
  applyDefinition(ce, index.get(`${head}@BinaryWord`)!, ce.box(["List", ...word] as never)).re;

test("every binary-word definition has an independent reading", () => {
  for (const { head } of WORD_STATISTICS) expect(WORD_READINGS[head], head).toBeDefined();
  expect(Object.keys(WORD_READINGS).length).toBe(WORD_STATISTICS.length);
});

for (const [head, expected] of Object.entries(WORD_READINGS))
  test(`${head} agrees over every word of length 0..8`, () => {
    for (const w of upTo(8)) expect(evaluate(head, w), w.join("")).toBe(expected(w));
  });

test("each head called on the carrier value gives the reading", () => {
  for (const [head, expected] of Object.entries(WORD_READINGS))
    for (const w of upTo(4))
      expect(ce.box([head, ["BinaryWord", ["List", ...w]]] as never).evaluate().re, `${head} ${w.join("")}`).toBe(
        expected(w),
      );
});
