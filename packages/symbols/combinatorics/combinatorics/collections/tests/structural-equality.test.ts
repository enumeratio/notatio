import { bareEngine } from "@notatio/engine/testing";
import { expect, test } from "vite-plus/test";
import { declareCollections } from "../src/library.ts";

// Union, Gather, GatherBy, Split, SplitBy and Commonest tell two elements apart the way
// Wolfram's SameQ and compute-engine's Unique and Tally do: by structure. `isEqual` is numeric
// (it joins 1 and 1.0000000001) and leaves `Sin(x)` against `Cos(x)` undecided.
const ce = bareEngine();
declareCollections(ce);
const run = (expr: unknown) => ce.box(expr as never).evaluate().json;

const close = ["List", 1, 1.0000000001, 1];

test("GatherBy keeps keys that differ in the last digits apart", () => {
  expect(run(["GatherBy", close, ["Function", ["Block", "_1"], "_1"]])).toEqual([
    "List",
    ["List", 1, 1],
    ["List", 1.0000000001],
  ]);
});

test("Split and SplitBy keep neighbours that differ in the last digits apart", () => {
  expect(run(["Split", ["List", 1, 1.0000000001]])).toEqual(["List", ["List", 1], ["List", 1.0000000001]]);
  expect(run(["SplitBy", ["List", 1, 1.0000000001], ["Function", ["Block", "_1"], "_1"]])).toEqual([
    "List",
    ["List", 1],
    ["List", 1.0000000001],
  ]);
});

test("Commonest(c, n) keeps values that differ in the last digits apart", () => {
  expect(run(["Commonest", ["List", 1, 1.0000000001, 1.0000000001], 1])).toEqual(["List", 1.0000000001]);
});

// The parse route is covered by the reference examples (`union-undecided-pair-stays-two`
// and the Gather and Commonest rows), which the reference tests read from Epsil.
test("an undecided pair stays two", () => {
  expect(run(["Union", ["List", ["Sin", "x"], ["Cos", "x"], ["Sin", "x"]]])).toEqual([
    "List",
    ["Sin", "x"],
    ["Cos", "x"],
  ]);
});
