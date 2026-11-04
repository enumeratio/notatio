import { bareEngine } from "@enumeratio/engine/testing";
import { expect, test } from "vite-plus/test";
import { declareCombinatorics } from "../../src/index.ts";
import { applyDefinition } from "../../src/statistics/declare.ts";
import { bySignature } from "../../src/statistics/types.ts";
import { TABLEAU_STATISTICS } from "../src/statistics.ts";
import { TABLEAU_READINGS } from "./tableau-findstat-readings.ts";

// The whole library, as a page evaluates it.
const ce = bareEngine();
declareCombinatorics(ce);
const index = bySignature(TABLEAU_STATISTICS);

/** Every standard tableau with `n` entries, as rows: each entry goes on the end of a row that stays a partition. */
function tableaux(n: number): number[][][] {
  let all: number[][][] = [[]];
  for (let entry = 1; entry <= n; entry++)
    all = all.flatMap((t) =>
      [...t.keys(), t.length]
        .filter((r) => r === t.length || r === 0 || t[r]!.length < t[r - 1]!.length)
        .map((r) => (r === t.length ? [...t, [entry]] : t.map((row, i) => (i === r ? [...row, entry] : row)))),
    );
  return all;
}
const upTo = (n: number): number[][][] => Array.from({ length: n + 1 }, (_, k) => k).flatMap(tableaux);
const rowsOf = (t: readonly (readonly number[])[]): unknown => ["List", ...t.map((row) => ["List", ...row])];

const evaluate = (head: string, t: readonly (readonly number[])[]): number =>
  applyDefinition(ce, index.get(`${head}@StandardTableau`)!, ce.box(rowsOf(t) as never)).re;

test("every tableau definition has an independent reading", () => {
  for (const { head } of TABLEAU_STATISTICS) expect(TABLEAU_READINGS[head], head).toBeDefined();
  expect(Object.keys(TABLEAU_READINGS).length).toBe(TABLEAU_STATISTICS.length);
});

for (const [head, expected] of Object.entries(TABLEAU_READINGS))
  test(`${head} agrees over every standard tableau of 0..6 entries`, () => {
    for (const t of upTo(6)) expect(evaluate(head, t), JSON.stringify(t)).toBe(expected(t));
  });

test("each head called on the carrier value gives the reading", () => {
  for (const [head, expected] of Object.entries(TABLEAU_READINGS))
    for (const t of upTo(4).filter((rows) => rows.length > 0))
      expect(
        ce.box([head, ["StandardTableau", rowsOf(t)]] as never).evaluate().re,
        `${head} ${JSON.stringify(t)}`,
      ).toBe(expected(t));
});

// Larger tableaux run nightly (DEEP_TESTS=1).
test.skipIf(!process.env.DEEP_TESTS)(
  "every tableau definition agrees over the standard tableaux of 7 and 8 entries",
  () => {
    for (const t of [...tableaux(7), ...tableaux(8)])
      for (const [head, expected] of Object.entries(TABLEAU_READINGS))
        expect(evaluate(head, t), `${head} ${JSON.stringify(t)}`).toBe(expected(t));
  },
  1_800_000,
);
