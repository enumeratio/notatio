import { bareEngine } from "@notatio/engine/testing";
import { expect, test } from "vite-plus/test";
import { declareCollections } from "../src/library.ts";

const ce = bareEngine();
declareCollections(ce);
const run = (expr: unknown) => ce.box(expr as never).evaluate({ materialization: true }).json;

const abcd = ["List", "a", "b", "c", "d"];

test("Map(f)(xs) maps f over xs, as Map[f][xs] does", () => {
  expect(run(["Apply", ["Map", "f"], abcd])).toEqual(run(["Map", "f", abcd]));
  expect(run([["Map", "f"], abcd])).toEqual(["List", ["f", "a"], ["f", "b"], ["f", "c"], ["f", "d"]]);
});

test("Fold(f)(xs) folds from the first element", () => {
  expect(run(["Apply", ["Fold", "f"], abcd])).toEqual(["f", ["f", ["f", "a", "b"], "c"], "d"]);
});

test("Filter(pred)(xs) takes the list first, as Select[crit][xs] does", () => {
  expect(run(["Apply", ["Filter", "IsEven"], ["List", 1, 2, 4, 7, 6, 2]])).toEqual(["List", 2, 4, 6, 2]);
});

test("calling a Function literal renames a parameter the argument would be captured by", () => {
  const curried = ["Function", ["Function", ["Power", "y", "x"], "x"], "y"];
  expect(run(["Apply", ["Apply", curried, "x"], "y"])).toEqual(["Power", "x", "y"]);
  expect(run(["Apply", ["Function", ["Add", "_1", 1]], 2])).toBe(3);
});

test("a bound slot in head position is called", () => {
  expect(run(["FoldList", ["Function", ["Block", ["_2", "_1"]], "_1", "_2"], "x", ["List", "a", "b"]])).toEqual([
    "List",
    "x",
    ["a", "x"],
    ["b", ["a", "x"]],
  ]);
  expect(
    run([
      "MapThread",
      ["Function", ["Block", ["_1", "_2"]], "_1", "_2"],
      ["List", ["List", "f", "g"], ["List", "x", "y"]],
    ]),
  ).toEqual(["List", ["f", "x"], ["g", "y"]]);
});

test("Do evaluates the bounds of its iterator", () => {
  const search = [
    "Do",
    ["If", ["IsPrime", "k"], ["Throw", "k"]],
    ["List", "k", ["Power", 10, 3], ["Add", ["Power", 10, 3], 10]],
  ];
  expect(run(["Catch", search])).toBe(1009);
});

test("Thread sees through Unevaluated", () => {
  const derivative = ["D", ["List", "x", ["Multiply", "x", "y"]], ["List", "x", "y"]];
  expect(run(["Thread", ["Unevaluated", derivative]])).toEqual(run(["Thread", derivative]));
});

test("Symbol of a non-string stays held", () => {
  expect(run(["Symbol", "x"])).toEqual(["Symbol", "x"]);
  expect(run(["Symbol", { str: "x" }])).toBe("x");
});

const native = bareEngine();
const hasError = (json: unknown): boolean => JSON.stringify(json).includes('"Error"');

test("a Map lambda's parameter is typed from its collection, as natively", () => {
  const call = ["Map", ["Function", ["If", ["Element", "i", ["List"]], 1, 0], "i"], ["List", 1, 2, 3]];
  const declared = run(call);
  expect(hasError(declared)).toBe(false);
  expect(declared).toEqual(native.box(call as never).evaluate({ materialization: true }).json);
});

test("Map, Fold and Filter keep compute-engine's signatures and add only the operator form", () => {
  const signatureOf = (engine: typeof ce, head: string) =>
    String((engine.lookupDefinition(head) as { operator: { signature: unknown } }).operator.signature);
  for (const head of ["Map", "Fold", "Filter"]) {
    expect(signatureOf(ce, head)).toContain(signatureOf(native, head));
  }
  // Typed calls the native signatures answer get the same result type.
  const calls = [
    ["Map", ["Function", ["Add", "x", 1], "x"], ["List", 1, 2, 3]],
    ["Fold", ["Function", ["Add", "a", "b"], "a", "b"], 0, ["List", 1, 2, 3]],
    ["Filter", ["List", 1, 2, 3], ["Function", ["Greater", "x", 1], "x"]],
  ];
  for (const call of calls) {
    expect(String(ce.box(call as never).type)).toBe(String(native.box(call as never).type));
  }
});
