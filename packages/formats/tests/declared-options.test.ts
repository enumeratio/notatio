// Which rules are options: a head's record says (`options:`), and a LaTeX arrow is read by it.

import { readEntries } from "@notatio/entry/node";
import { expect, test } from "vite-plus/test";
import { rulesInCalls } from "../src/expression.ts";
import { declaredOptions, GRAPHICS_OPTIONS } from "../src/graphics-options.ts";

const entries = readEntries(new URL("../reference", import.meta.url));

test("the built table is the records' options, and a layer without a record keeps its own", () => {
  for (const entry of entries) {
    if (entry.options?.length) expect(GRAPHICS_OPTIONS[entry.name], entry.name).toEqual(entry.options);
  }
  expect(declaredOptions("Plot").has("PlotStyle")).toBe(true);
  expect(declaredOptions("LatticeTiles").has("ColorRules")).toBe(true);
  expect(declaredOptions("Sin").size).toBe(0);
});

test("every option a record's examples or optionValues use is one it declares", () => {
  const undeclared: string[] = [];
  for (const entry of entries) {
    const declared = new Set(entry.options ?? []);
    const used = new Set(Object.keys(entry.optionValues ?? {}));
    for (const example of entry.examples ?? []) {
      const expr = (example as { expr?: unknown }).expr;
      if (!Array.isArray(expr) || expr[0] !== entry.name) continue;
      for (const arg of expr.slice(1))
        if (Array.isArray(arg) && (arg[0] === "Rule" || arg[0] === "KeyValuePair") && typeof arg[1] === "string")
          used.add(arg[1]);
    }
    for (const name of used) if (!declared.has(name)) undeclared.push(`${entry.name}: ${name}`);
  }
  expect(undeclared).toEqual([]);
});

const read = (json: unknown): unknown => {
  const copy = structuredClone(json);
  rulesInCalls(copy as never);
  return copy;
};

test("an arrow is an option where its head declares the name, and stays an arrow elsewhere", () => {
  expect(read(["Plot", ["Sin", "x"], ["To", "Axes", "False"]])).toEqual([
    "Plot",
    ["Sin", "x"],
    ["Rule", "Axes", "False"],
  ]);
  // `x` is no option of `Plot`, and `Limit` declares none.
  expect(read(["Plot", ["To", "x", 0]])).toEqual(["Plot", ["To", "x", 0]]);
  expect(read(["Limit", ["Sin", "x"], ["To", "x", 0]])).toEqual(["Limit", ["Sin", "x"], ["To", "x", 0]]);
  // An option of another head is not one here.
  expect(read(["Graphics", ["List"], ["To", "PlotStyle", "Red"]])).toEqual([
    "Graphics",
    ["List"],
    ["To", "PlotStyle", "Red"],
  ]);
});

test("an option's value may be a rule or a list of rules, but an arrow inside a call there stays", () => {
  expect(
    read([
      "LatticeTiles",
      "GaussianIntegers",
      ["To", "ColorRules", ["List", ["To", "IsPrime", "Teal"], ["List", ["To", "IsUnit", "White"]]]],
    ]),
  ).toEqual([
    "LatticeTiles",
    "GaussianIntegers",
    ["Rule", "ColorRules", ["List", ["Rule", "IsPrime", "Teal"], ["List", ["Rule", "IsUnit", "White"]]]],
  ]);
  expect(read(["Plot", "f", ["To", "PlotLabel", ["Limit", "f", ["To", "x", 0]]]])).toEqual([
    "Plot",
    "f",
    ["Rule", "PlotLabel", ["Limit", "f", ["To", "x", 0]]],
  ]);
});

test("a caller's own table stands in for the graphics heads'", () => {
  const optionsOf = (head: string): ReadonlySet<string> => new Set(head === "Mine" ? ["Depth"] : []);
  const json = ["Mine", ["To", "Depth", 3], ["Plot", ["To", "Axes", "False"]]];
  rulesInCalls(json as never, optionsOf);
  expect(json).toEqual(["Mine", ["Rule", "Depth", 3], ["Plot", ["To", "Axes", "False"]]]);
});

test("Epsil's own arrow is still a rule in any call", () => {
  expect(read(["Foo", ["KeyValuePair", "a", 1]])).toEqual(["Foo", ["Rule", "a", 1]]);
});
