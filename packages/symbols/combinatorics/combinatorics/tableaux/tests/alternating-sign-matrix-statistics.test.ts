import { bareEngine } from "@enumeratio/engine/testing";
import { expect, test } from "vite-plus/test";
import { declareCombinatorics } from "../../src/index.ts";
import { applyDefinition } from "../../src/statistics/declare.ts";
import { bySignature } from "../../src/statistics/types.ts";
import { TABLEAU_STATISTICS } from "../src/statistics.ts";
import { ALTERNATING_SIGN_MATRIX_READINGS } from "./alternating-sign-matrix-findstat-readings.ts";

// The whole library, as a page evaluates it.
const ce = bareEngine();
declareCombinatorics(ce);
const index = bySignature(TABLEAU_STATISTICS);

/** The n x n alternating sign matrices: every row sums to 1, and the partial sums of each row and column are 0 or 1. */
function matrices(n: number): number[][][] {
  const extend = (columns: readonly number[], rows: number[][]): number[][][] => {
    if (rows.length === n) return columns.every((c) => c === 1) ? [rows] : [];
    const found: number[][][] = [];
    const fill = (column: number, row: number[], total: number): void => {
      if (column === n) {
        if (total === 1)
          found.push(
            ...extend(
              columns.map((c, k) => c + row[k]!),
              [...rows, row],
            ),
          );
        return;
      }
      for (const entry of [-1, 0, 1]) {
        const down = columns[column]! + entry;
        const along = total + entry;
        if (down >= 0 && down <= 1 && along >= 0 && along <= 1) fill(column + 1, [...row, entry], along);
      }
    };
    fill(0, [], 0);
    return found;
  };
  return extend(
    Array.from({ length: n }, () => 0),
    [],
  );
}
const upTo = (n: number): number[][][] => Array.from({ length: n }, (_, k) => k + 1).flatMap(matrices);
const rowsOf = (m: readonly (readonly number[])[]): unknown => ["List", ...m.map((row) => ["List", ...row])];

const evaluate = (head: string, m: readonly (readonly number[])[]): number =>
  applyDefinition(ce, index.get(`${head}@AlternatingSignMatrix`)!, ce.box(rowsOf(m) as never)).re;

test("the matrices are counted by the product formula", () => {
  expect([1, 2, 3, 4, 5].map((n) => matrices(n).length)).toEqual([1, 2, 7, 42, 429]);
});

test("every alternating-sign-matrix definition has an independent reading", () => {
  const heads = TABLEAU_STATISTICS.filter((d) => d.on === "AlternatingSignMatrix").map((d) => d.head);
  for (const head of heads) expect(ALTERNATING_SIGN_MATRIX_READINGS[head], head).toBeDefined();
  expect(heads.toSorted()).toEqual(Object.keys(ALTERNATING_SIGN_MATRIX_READINGS).toSorted());
});

for (const [head, expected] of Object.entries(ALTERNATING_SIGN_MATRIX_READINGS))
  test(`${head} agrees over every alternating sign matrix of size 1..4`, () => {
    for (const m of upTo(4)) expect(evaluate(head, m), JSON.stringify(m)).toBe(expected(m));
  });

test("each head called on the carrier value gives the reading", () => {
  for (const [head, expected] of Object.entries(ALTERNATING_SIGN_MATRIX_READINGS))
    for (const m of upTo(3))
      expect(
        ce.box([head, ["AlternatingSignMatrix", rowsOf(m)]] as never).evaluate().re,
        `${head} ${JSON.stringify(m)}`,
      ).toBe(expected(m));
});

// Size 5 runs nightly (DEEP_TESTS=1).
test.skipIf(!process.env.DEEP_TESTS)(
  "every alternating-sign-matrix definition agrees over the matrices of size 5",
  () => {
    for (const m of matrices(5))
      for (const [head, expected] of Object.entries(ALTERNATING_SIGN_MATRIX_READINGS))
        expect(evaluate(head, m), `${head} ${JSON.stringify(m)}`).toBe(expected(m));
  },
  1_800_000,
);
