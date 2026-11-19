import { bareEngine } from "@notatio/engine/testing";
import { expect, test } from "vite-plus/test";
import { declareCombinatorics } from "../../src/index.ts";

// `Permutations(n)` is the call form that rewrites to `SymmetricGroup(n)` (call-forms.ts): one
// collection under two spellings. They agree in size and in order.

const ce = bareEngine();
declareCombinatorics(ce);

const MAX_N = process.env.DEEP_TESTS === "1" ? 8 : 6;

const evaluate = (expr: unknown) => ce.box(expr as never).evaluate().json;

function factorial(n: number): number {
  let f = 1;
  for (let i = 2; i <= n; i++) f *= i;
  return f;
}

for (let n = 0; n <= MAX_N; n++) {
  test(`Permutations(${n}) and SymmetricGroup(${n}) agree in size and order`, () => {
    const size = evaluate(["Count", ["SymmetricGroup", n]]);
    expect(size).toEqual(factorial(n));
    expect(evaluate(["Count", ["Permutations", n]])).toEqual(size);
    expect(evaluate(["Permutations", n])).toEqual(evaluate(["SymmetricGroup", n]));
    for (const k of new Set([1, 2, Math.ceil(factorial(n) / 2), factorial(n)])) {
      if (k > factorial(n)) continue;
      expect(evaluate(["At", ["Permutations", n], k])).toEqual(evaluate(["At", ["SymmetricGroup", n], k]));
    }
  });
}
