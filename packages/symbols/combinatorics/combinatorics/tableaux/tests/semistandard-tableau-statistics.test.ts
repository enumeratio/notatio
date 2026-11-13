import { bareEngine } from "@notatio/engine/testing";
import { expect, test } from "vite-plus/test";
import { declareCombinatorics } from "../../src/index.ts";
import { applyDefinition } from "../../src/statistics/declare.ts";
import { bySignature } from "../../src/statistics/types.ts";
import { TABLEAU_STATISTICS } from "../src/statistics.ts";
import { type Rows, SEMISTANDARD_TABLEAU_READINGS } from "./semistandard-tableau-findstat-readings.ts";

// The whole library, as a page evaluates it.
const ce = bareEngine();
declareCombinatorics(ce);
const index = bySignature(TABLEAU_STATISTICS);

const parts = (list: unknown): number[] => (list as unknown[]).slice(1).map(Number);
/** Our semistandard tableaux of n cells with entries 1 .. k, as rows. */
function tableaux(n: number, k: number): Rows[] {
  const family = ["SemistandardTableaux", n, k];
  const total = Number(ce.box(["Count", family] as never).evaluate().json);
  return Array.from({ length: total }, (_, i) =>
    (ce.box(["At", family, i + 1] as never).evaluate().json as unknown as unknown[]).slice(1).map(parts),
  );
}
const contents = (t: Rows): unknown => ["List", ...t.map((row) => ["List", ...row])];

// Every shape of up to 5 cells, with entries to 3 (to 4 for 3 cells, to 6 for 2).
const SUBJECTS: Rows[] = [
  ...[1, 2, 3, 4, 5].flatMap((n) => tableaux(n, 3)),
  ...tableaux(3, 4),
  ...tableaux(2, 6),
].filter((t, i, all) => all.findIndex((u) => JSON.stringify(u) === JSON.stringify(t)) === i);

const evaluate = (head: string, t: Rows): number =>
  applyDefinition(ce, index.get(`${head}@SemistandardTableau`)!, ce.box(contents(t) as never)).re;

test("the tableaux are counted", () => {
  expect([1, 2, 3, 4, 5].map((n) => tableaux(n, 3).length)).toEqual([3, 9, 19, 39, 69]);
  expect(tableaux(3, 4).length).toBe(44);
});

test("every semistandard-tableau definition has an independent reading", () => {
  const heads = TABLEAU_STATISTICS.filter((d) => d.on === "SemistandardTableau").map((d) => d.head);
  for (const head of heads) expect(SEMISTANDARD_TABLEAU_READINGS[head], head).toBeDefined();
  expect(heads.toSorted()).toEqual(Object.keys(SEMISTANDARD_TABLEAU_READINGS).toSorted());
});

for (const [head, expected] of Object.entries(SEMISTANDARD_TABLEAU_READINGS))
  test(`${head} agrees over the semistandard tableaux of up to 5 cells`, () => {
    for (const t of SUBJECTS) expect(evaluate(head, t), JSON.stringify(t)).toBe(expected(t));
  });

test("each head called on the carrier value gives the reading", () => {
  for (const [head, expected] of Object.entries(SEMISTANDARD_TABLEAU_READINGS))
    for (const t of tableaux(3, 3))
      expect(
        ce.box([head, ["SemistandardTableau", contents(t)]] as never).evaluate().re,
        `${head} ${JSON.stringify(t)}`,
      ).toBe(expected(t));
});

test("the empty tableau gives 0", () => {
  for (const head of Object.keys(SEMISTANDARD_TABLEAU_READINGS)) expect(evaluate(head, []), head).toBe(0);
});

// Cells 6 and 7 run nightly (DEEP_TESTS=1).
test.skipIf(!process.env.DEEP_TESTS)(
  "every semistandard-tableau definition agrees over the tableaux of 6 and 7 cells",
  () => {
    for (const t of [6, 7].flatMap((n) => tableaux(n, 3)))
      for (const [head, expected] of Object.entries(SEMISTANDARD_TABLEAU_READINGS))
        expect(evaluate(head, t), `${head} ${JSON.stringify(t)}`).toBe(expected(t));
  },
  1_800_000,
);
