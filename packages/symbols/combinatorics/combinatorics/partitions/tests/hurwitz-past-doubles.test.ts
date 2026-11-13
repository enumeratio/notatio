// Hurwitz numbers pass 2^53 at small sizes. The compiled code answers only while it is exact and
// declines past that, so the interpreter's exact integer is the answer on every route.

import { bareEngine } from "@notatio/engine/testing";
import { expect, test } from "vite-plus/test";
import { declareCombinatorics } from "../../src/index.ts";
import { ALL_STATISTICS } from "../../src/statistics/all.ts";
import { compiledStatistic } from "../../src/statistics/compiled.ts";

const DEEP = process.env.DEEP_TESTS === "1";
const engine = bareEngine();
declareCombinatorics(engine);

const partitions = (n: number, max = n): number[][] =>
  n === 0
    ? [[]]
    : Array.from({ length: Math.min(n, max) }, (_, k) => Math.min(n, max) - k).flatMap((first) =>
        partitions(n - first, first).map((rest) => [first, ...rest]),
      );
const factorial = (n: bigint): bigint => (n <= 1n ? 1n : n * factorial(n - 1n));

/** (n + c - 2)! n^(c-3) prod p^p / (p-1)!, in integers. */
const hurwitz = (l: number[]): bigint => {
  const [n, c] = [BigInt(l.reduce((a, b) => a + b, 0)), BigInt(l.length)];
  let [numerator, denominator] = [factorial(n + c - 2n), 1n];
  for (const p of l)
    [numerator, denominator] = [numerator * BigInt(p) ** BigInt(p), denominator * factorial(BigInt(p) - 1n)];
  if (c >= 3n) numerator *= n ** (c - 3n);
  else denominator *= n ** (3n - c);
  return numerator / denominator;
};
/** The product of the Catalan numbers C(p - 1). */
const monotone = (l: number[]): bigint =>
  l.reduce((product, p) => product * (factorial(BigInt(2 * p - 2)) / (factorial(BigInt(p - 1)) ** 2n * BigInt(p))), 1n);

const MODELS: Record<string, (l: number[]) => bigint> = { HurwitzNumber: hurwitz, MonotoneHurwitzNumber: monotone };

for (const [head, model] of Object.entries(MODELS)) {
  test(`${head}: the compiled code is exact or declines`, () => {
    const definition = ALL_STATISTICS.find((d) => d.head === head && d.on === "IntegerPartition")!;
    const run = compiledStatistic(engine, definition)!;
    expect(run).toBeDefined();
    let answered = 0;
    for (let n = 1; n <= (DEEP ? 40 : 11); n++)
      for (const l of partitions(n)) {
        const answer = run(["List", ...l]);
        if (answer === undefined) continue;
        answered++;
        expect(BigInt(answer as number), JSON.stringify(l)).toBe(model(l));
      }
    expect(answered).toBeGreaterThan(0);
  });

  test(`${head}: every route is exact past 2^53`, () => {
    for (const l of [
      [20, 20],
      [25, 25],
      [14, 14, 14],
    ]) {
      const expected = model(l);
      expect(expected > BigInt(Number.MAX_SAFE_INTEGER)).toBe(true);
      const call = ["IntegerPartition", ["List", ...l]];
      for (const route of [
        engine.box([head, call] as never).evaluate(),
        engine.box([head, call] as never).N(),
        engine.box(["CombinatorialStat", call, `'${head}'`] as never).evaluate(),
      ]) {
        const json = route.json as number | { num: string };
        const text = typeof json === "number" ? String(json) : json.num;
        const [digits, exponent] = text.split("e+");
        expect(BigInt(digits!) * 10n ** BigInt(exponent ?? 0), JSON.stringify(l)).toBe(expected);
      }
    }
  });
}
