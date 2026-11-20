import { ComputeEngine } from "@cortex-js/compute-engine";
import { expect, test } from "vite-plus/test";
import { compileBigint, fromBigint, isBigintDecline, toBigint } from "../src/compiled-bigint.ts";

// compute-engine's `bigint` compile mode: every integer a bigint, anything else a decline (a result of
// `undefined` here, which a caller hands to the interpreter).
const ce = new ComputeEngine();
const run = (expression: unknown, types: Record<string, string>, vars: Record<string, unknown>): unknown =>
  compileBigint(ce, expression, types)!.run(toBigint(vars) as Record<string, unknown>);
const declines = (expression: unknown, types: Record<string, string>): boolean =>
  compileBigint(ce, expression, types) === undefined;

test("integer arithmetic is exact past 2^53", () => {
  expect(run(["Multiply", "_n", "_n"], { _n: "integer" }, { _n: 94906267 })).toBe(94906267n * 94906267n);
});

// The changelog says `Floor(n/3)` compiles exactly; canonicalization reads `n/3` as `1/3 * n` first, and the
// bigint mode declines the rational (the quotient: see the handback's upstream questions).
test("a division declines, also under a floor", () => {
  expect(declines(["Divide", "_n", 2], { _n: "integer" })).toBe(true);
  expect(declines(["Floor", ["Divide", "_n", 3]], { _n: "integer" })).toBe(true);
});

test("Binomial is exact", () => {
  expect(run(["Binomial", 70, "_k"], { _k: "integer" }, { _k: 35 })).toBe(112186277816662845432n);
});

test("a fold by a function of its own declines", () => {
  const factorial = ["Fold", ["Function", ["Multiply", "a", "i"], "a", "i"], 1, ["Range", 1, "_n", 1]];
  expect(declines(factorial, { _n: "integer" })).toBe(true);
});

test("Factorial is exact past 2^53, and an argument outside its range is not a finite value", () => {
  expect(run(["Factorial", "_n"], { _n: "integer" }, { _n: 25 })).toBe(15511210043330985984000000n);
  expect(run(["Factorial", "_n"], { _n: "integer" }, { _n: 0 })).toBe(1n);
  expect(run(["Factorial", "_n"], { _n: "integer" }, { _n: -1 })).toBe(Number.POSITIVE_INFINITY);
  expect(() => run(["Factorial", "_n"], { _n: "integer" }, { _n: 10 ** 7 })).toThrow(RangeError);
});

test("a list of integers in, a list out", () => {
  const types = { _x: "list<integer>" };
  expect(run(["Take", "_x", 2], types, { _x: [2 ** 52, 2 ** 53, 5] })).toEqual([2n ** 52n, 2n ** 53n]);
});

test("what mixes in a real declines", () => {
  expect(declines(["Sqrt", "_n"], { _n: "integer" })).toBe(true);
});

test("results come back as numbers where a double holds them", () => {
  expect(fromBigint([1n, 2n ** 60n])).toEqual([1, 2n ** 60n]);
  expect(isBigintDecline(new RangeError("x"))).toBe(true);
});

test("a power of two with a stated exponent is exact; an unproved exponent declines", () => {
  expect(declines(["Power", 2, "_k"], { _k: "integer" })).toBe(true);
  expect(run(["Power", 2, ["Abs", "_k"]], { _k: "integer" }, { _k: 100 })).toBe(2n ** 100n);
});

test("an equality of integers past 2^53 holds", () => {
  const same = ["If", ["And", ["Equal", ["At", "_x", 1], "_n"], ["Less", ["At", "_x", 1], 2 ** 62]], 1, 0];
  const types = { _x: "list<integer>", _n: "integer" };
  expect(run(same, types, { _x: [2 ** 60], _n: 2 ** 60 })).toBe(1n);
  expect(run(same, types, { _x: [2 ** 60], _n: 2 ** 61 })).toBe(0n);
});

test("Take, Drop, Min, Max and Length work on bigint counts", () => {
  const types = { _x: "list<integer>", _n: "integer" };
  const vars = { _x: [10, 20, 30, 2 ** 60], _n: 2 };
  expect(run(["Take", "_x", "_n"], types, vars)).toEqual([10n, 20n]);
  expect(run(["Drop", "_x", ["Add", "_n", 1]], types, vars)).toEqual([2n ** 60n]);
  expect(run(["Max", "_n", ["At", "_x", 4]], types, vars)).toBe(2n ** 60n);
  expect(run(["Min", "_n", ["At", "_x", 4]], types, vars)).toBe(2n);
  expect(run(["Add", ["Length", "_x"], "_n"], types, vars)).toBe(6n);
});

test("a sum over a list's length is exact past 2^53", () => {
  const types = { _x: "list<integer>" };
  const sum = ["Sum", ["At", "_x", "i"], ["Limits", "i", 1, ["Length", "_x"]]];
  expect(run(sum, types, { _x: [2 ** 60, 1, 2] })).toBe(2n ** 60n + 3n);
});
