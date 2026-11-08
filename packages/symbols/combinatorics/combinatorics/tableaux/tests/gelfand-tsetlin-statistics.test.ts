import { bareEngine } from "@enumeratio/engine/testing";
import { expect, test } from "vite-plus/test";
import { declareCombinatorics } from "../../src/index.ts";
import { applyDefinition } from "../../src/statistics/declare.ts";
import { bySignature } from "../../src/statistics/types.ts";
import { TABLEAU_STATISTICS } from "../src/statistics.ts";
import { GELFAND_TSETLIN_READINGS, type Pattern } from "./gelfand-tsetlin-findstat-readings.ts";

// The whole library, as a page evaluates it.
const ce = bareEngine();
declareCombinatorics(ce);
const index = bySignature(TABLEAU_STATISTICS);

const parts = (list: unknown): number[] => (list as unknown[]).slice(1).map(Number);
/** Our Gelfand-Tsetlin patterns of n rows with entries 0 .. k, as rows. */
function patterns(n: number, k: number): Pattern[] {
  const family = ["GelfandTsetlin", n, k];
  const total = Number(ce.box(["Count", family] as never).evaluate().json);
  return Array.from({ length: total }, (_, i) =>
    (ce.box(["At", family, i + 1] as never).evaluate().json as unknown as unknown[]).slice(1).map(parts),
  );
}
const contents = (p: Pattern): unknown => ["List", ...p.map((row) => ["List", ...row])];

// Up to 3 rows with entries to 2, and the 4-row patterns of entries to 1.
const SUBJECTS: Pattern[] = [...[0, 1, 2, 3].flatMap((n) => patterns(n, 2)), ...patterns(4, 1)];

const evaluate = (head: string, p: Pattern): number =>
  applyDefinition(ce, index.get(`${head}@GelfandTsetlinPattern`)!, ce.box(contents(p) as never)).re;

test("the patterns are counted", () => {
  expect([1, 2, 3, 4].map((n) => patterns(n, 2).length)).toEqual([3, 10, 35, 126]);
  expect(patterns(4, 1).length).toBe(16);
});

test("every Gelfand-Tsetlin definition has an independent reading", () => {
  const heads = TABLEAU_STATISTICS.filter((d) => d.on === "GelfandTsetlinPattern").map((d) => d.head);
  for (const head of heads) expect(GELFAND_TSETLIN_READINGS[head], head).toBeDefined();
  expect(heads.toSorted()).toEqual(Object.keys(GELFAND_TSETLIN_READINGS).toSorted());
});

for (const [head, expected] of Object.entries(GELFAND_TSETLIN_READINGS))
  test(`${head} agrees over the patterns of up to 3 rows`, () => {
    for (const p of SUBJECTS) expect(evaluate(head, p), JSON.stringify(p)).toBe(expected(p));
  });

test("each head called on the carrier value gives the reading", () => {
  for (const [head, expected] of Object.entries(GELFAND_TSETLIN_READINGS))
    for (const p of patterns(3, 1))
      expect(
        ce.box([head, ["GelfandTsetlinPattern", contents(p)]] as never).evaluate().re,
        `${head} ${JSON.stringify(p)}`,
      ).toBe(expected(p));
});

test("the pattern with no rows gives 0", () => {
  for (const head of Object.keys(GELFAND_TSETLIN_READINGS)) expect(evaluate(head, []), head).toBe(0);
});

// Four rows with entries to 2, and five rows, run nightly (DEEP_TESTS=1).
test.skipIf(!process.env.DEEP_TESTS)(
  "every Gelfand-Tsetlin definition agrees over the patterns of 5 rows",
  () => {
    for (const p of [...patterns(4, 3), ...patterns(5, 1)])
      for (const [head, expected] of Object.entries(GELFAND_TSETLIN_READINGS))
        expect(evaluate(head, p), `${head} ${JSON.stringify(p)}`).toBe(expected(p));
  },
  1_800_000,
);
