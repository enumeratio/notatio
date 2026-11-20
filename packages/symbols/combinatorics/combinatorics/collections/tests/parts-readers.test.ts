import { createEngine } from "@notatio/engine/testing";
import { expect, test } from "vite-plus/test";
import { declareCollections } from "../src/library.ts";
import { type CallBuilders, parameterReads } from "./override-differential.ts";

// Every handler that reads a non-collection's operands as its parts goes through `partsOf`: an
// inert call is read, and a sum of untyped symbols (a lambda's parameters) waits for the binding.

const fn = (body: unknown, ...params: string[]) => ["Function", body, ...params];
const twice = fn(["Multiply", "x", 2], "x");
const big = fn(["Greater", "x", 2], "x");
const plus = fn(["Add", "p", "q"], "p", "q");

const readers: CallBuilders = {
  Length: (c) => [["Length", c]],
  At: (c) => [["At", c, 1]],
  First: (c) => [["First", c]],
  Last: (c) => [["Last", c]],
  Position: (c) => [["Position", c, 3]],
  FirstPosition: (c) => [["FirstPosition", c, 3]],
  Count: (c) => [["Count", c, 3, 1]],
  Append: (c) => [["Append", c, 1]],
  Flatten: (c) => [["Flatten", c]],
  FoldList: (c) => [
    ["FoldList", plus, 0, c],
    ["FoldList", plus, c],
  ],
  Accumulate: (c) => [["Accumulate", c]],
  Cases: (c) => [["Cases", c, 3]],
  Commonest: (c) => [["Commonest", c]],
  Gather: (c) => [["Gather", c]],
  GatherBy: (c) => [["GatherBy", c, twice]],
  Split: (c) => [["Split", c]],
  SplitBy: (c) => [["SplitBy", c, twice]],
  SortBy: (c) => [["SortBy", c, twice]],
  Any: (c) => [["Any", c, big]],
  All: (c) => [["All", c, big]],
  Partition: (c) => [
    ["Partition", c, 1],
    ["Partition", c, ["UpTo", 2]],
  ],
  Extract: (c) => [["Extract", c, 1]],
  ReplacePart: (c) => [["ReplacePart", c, ["Rule", 1, 9]]],
  Level: (c) => [["Level", c, 1]],
  DeleteCases: (c) => [["DeleteCases", c, 3]],
  Subsets: (c) => [["Subsets", c]],
};

test("a handler that reads parts does not read a lambda's untyped sum as its parts", () => {
  expect(parameterReads(readers, Object.keys(readers))).toBe("");
});

const ce = createEngine(declareCollections);
const run = (expr: unknown) => JSON.stringify(ce.box(expr as never).evaluate().json);
const inert = ["f", "a", "b", "c", "d"];

test("an inert call's operands are its parts", () => {
  expect(run(["Length", inert])).toBe("4");
  expect(run(["Position", ["f", 1, 3, 3], 3])).toBe('["List",["List",2],["List",3]]');
  expect(run(["Count", ["f", 1, 3, 3], 3, 1])).toBe("2");
  expect(run(["Append", ["f", "a", "b"], "c"])).toBe('["f","a","b","c"]');
  expect(run(["Extract", inert, 2])).toBe('"b"');
  expect(run(["Level", ["f", "a", "b"], 1])).toBe('["List","a","b"]');
  expect(run(["ReplacePart", ["f", "a", "b"], ["Rule", 1, 9]])).toBe('["f",9,"b"]');
  expect(run(["Flatten", ["f", "a", ["f", "b", "c"]]])).toBe('["f","a","b","c"]');
});

test("an atom has no parts", () => {
  expect(run(["Length", 5])).toBe("0");
  expect(run(["Length", "'abc'"])).toBe("0");
  expect(run(["Length", "x"])).toBe("0");
});

test("the operands of a sum of untyped symbols are not its parts", () => {
  const sum = ["Add", "a", "b", "c", "d"];
  for (const call of [
    ["Length", sum],
    ["Count", sum, "a", 1],
    ["Append", sum, 1],
    ["Position", sum, "a"],
    ["FoldList", plus, 0, sum],
    ["Extract", sum, 1],
  ]) {
    expect(run(call), JSON.stringify(call)).toContain(JSON.stringify(sum));
  }
});

test("Subsets of a sum of untyped symbols stays unevaluated, and so does a Sum over it", () => {
  const subsets = ["Subsets", ["Add", "a", "b", "c"]];
  const materialized = ce.box(subsets as never).evaluate() as unknown as { isFiniteCollection?: boolean };
  expect(materialized.isFiniteCollection).not.toBe(true);
  expect(run(["Sum", subsets])).toContain('"Subsets"');
  expect(run(["Sum", ["Subsets", ["Multiply", "a", "b", "c", "d", "k"], ["List", 3]]])).toContain('"Subsets"');
});

// A lambda body is never rewritten before its parameters are bound: the lambda answers as the call
// evaluated on the values (the lambdas thread over list arguments, so elementwise), or waits. Level and
// ReplacePart read parts, FreeQ, MatchQ, ReplaceAll and Same answer at evaluate on evaluated operands,
// and Thread waits on a symbol.
const bound = (j: unknown, u: unknown, v: unknown): unknown =>
  j === "u" ? u : j === "v" ? v : Array.isArray(j) ? j.map((x) => bound(x, u, v)) : j;
const bodies: [string, unknown, number[], number[]][] = [
  ["Level", ["Level", ["Add", "u", "v"], 1], [1, 2], [3, 4]],
  ["ReplacePart", ["ReplacePart", ["Add", "u", "v"], ["Rule", 1, 9]], [1, 2], [3, 4]],
  ["FreeQ", ["FreeQ", ["Add", "u", "v"], 3], [1], [2]],
  ["MatchQ", ["MatchQ", ["Add", "u", "v"], 3], [1], [2]],
  ["ReplaceAll", ["ReplaceAll", ["Add", "u", "v"], ["Rule", 3, 0]], [1], [2]],
  ["Same", ["Same", "u", "v"], [1, 2], [1, 2]],
  ["Thread", ["Thread", ["f", "u", "v"]], [1, 2], [3, 4]],
];
for (const [name, body, U, V] of bodies) {
  test(`${name} in a lambda answers as the call on the bound values, in all three shapes`, () => {
    const fn = (b: unknown, ...p: string[]) => ["Function", b, ...p];
    const L = (xs: number[]) => ["List", ...xs];
    const at = (u: number, v: number) => run(bound(body, u, v));
    const apply = `["List",${U.map((u, i) => at(u, V[i]!)).join(",")}]`;
    const nested = `["List",${U.map((u) => `["List",${V.map((v) => at(u, v)).join(",")}]`).join(",")}]`;
    expect(run(["Apply", fn(body, "u", "v"), L(U), L(V)])).toBe(apply);
    expect(run(["Apply", fn(["Apply", fn(body, "v"), L(V)], "u"), L(U)])).toBe(nested);
    const mapped = run(["Map", fn(["Apply", fn(body, "u", "v"), "p", L(V)], "p"), ["List", L(U)]]);
    expect(mapped === `["List",${apply}]` || mapped.startsWith('["Map"')).toBe(true);
  });
}

test("an inert operand is read by Level and ReplacePart, and Thread waits on a symbol", () => {
  expect(run(["Level", ["f", "a", "b"], 1])).toBe('["List","a","b"]');
  expect(run(["ReplacePart", ["f", "a", "b"], ["Rule", 2, 9]])).toBe('["f","a",9]');
  expect(JSON.parse(run(["Thread", ["f", ["List", 1, 2], "v"]]))[0]).toBe("Thread");
  expect(run(["Thread", ["f", ["List", 1, 2], 3]])).toBe('["List",["f",1,3],["f",2,3]]');
});

test("the same sum is read once its symbols are declared numbers", () => {
  const typed = createEngine(declareCollections);
  for (const name of ["a", "b", "c", "d"]) typed.declare(name, "real");
  expect(JSON.stringify(typed.box(["Length", ["Add", "a", "b", "c", "d"]] as never).evaluate().json)).toBe("4");
});
