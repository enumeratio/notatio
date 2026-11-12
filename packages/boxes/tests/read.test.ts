import { ComputeEngine } from "@cortex-js/compute-engine";
import type { MathJsonExpression } from "@cortex-js/compute-engine/epsil";
import { expect, test } from "vite-plus/test";
import {
  fraction,
  graphics,
  interpretation,
  makeBoxes,
  indexed,
  makeExpression,
  MakeExpressionError,
  named,
  row,
  superscript,
} from "../src/index.ts";
import { form } from "../src/box.ts";
import { parseMathML, toMathML } from "../src/render/index.ts";
import { CORPUS } from "./corpus.ts";

const ce = new ComputeEngine();
const canonical = (json: unknown): string => JSON.stringify(ce.box(json as never).json);
const same = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);

/** `json` written as boxes and read back: exactly, as the same canonical expression, not at all, or as another. */
function roundTrip(json: MathJsonExpression): "exact" | "equivalent" | "declined" | "mismatched" {
  let back: MathJsonExpression;
  try {
    back = makeExpression(makeBoxes(json));
  } catch (error) {
    if (error instanceof MakeExpressionError) return "declined";
    throw error;
  }
  if (same(back, json)) return "exact";
  return canonical(back) === canonical(json) ? "equivalent" : "mismatched";
}

// What the reader cannot recover from the boxes, because the notation gives two heads one
// spelling (`[0, 1]` is an interval and a list; `a ∧ b` a wedge and a conjunction) or the
// boxes do not say (a matrix's grid with no fence). `sum canonical` is the writer unwrapping the
// `Function(Block(…))` summand that compute-engine rejects as an argument. A change here is a fix
// or a regression.
const DECLINED = ["matrix no delimiters", "delimiter brackets", "error", "dictionary"];
const MISMATCHED = [
  "product with a reciprocal",
  // `(a + b)_n` is also how a Pochhammer symbol is written.
  "subscript of sum",
  "superscript",
  "sum canonical",
  "derivative default order",
  "interval closed",
  "interval open",
  "wedge",
  "wedge three",
  "vee",
  "wedge of sum",
];

test("round trip: makeBoxes then makeExpression reads the corpus back", () => {
  const rows: Record<string, string[]> = { exact: [], equivalent: [], declined: [], mismatched: [] };
  for (const [name, json] of Object.entries(CORPUS)) rows[roundTrip(json)]!.push(name);
  const total = Object.keys(CORPUS).length;
  console.info(
    `makeExpression over ${total} expressions: ${rows.exact!.length} exact, ${rows.equivalent!.length} equivalent once canonical, ` +
      `${rows.declined!.length} declined, ${rows.mismatched!.length} mismatched`,
  );
  expect(rows.declined).toEqual(DECLINED);
  expect(rows.mismatched).toEqual(MISMATCHED);
});

test("an interpretation box reads as the expression it carries", () => {
  const carried: MathJsonExpression = ["Fibonacci", "n"];
  expect(makeExpression(interpretation(row(["F", "⁢", "n"]), carried))).toEqual(carried);
  // Through MathML's annotation, and inside a larger row.
  const box = row([interpretation(row(["F", "⁢", "n"]), carried), "+", "1"]);
  expect(makeExpression(parseMathML(toMathML(box)))).toEqual(["Add", carried, 1]);
});

test("foreign MathML reads by structure", () => {
  const read = (xml: string) => makeExpression(parseMathML(xml));
  expect(read("<math><mfrac><mn>1</mn><mn>2</mn></mfrac></math>")).toEqual(["Divide", 1, 2]);
  expect(read("<math><mn>2</mn><mi>x</mi><mo>+</mo><mi>y</mi></math>")).toEqual(["Add", ["Multiply", 2, "x"], "y"]);
  expect(read("<math><mi>sin</mi><mo>&#x2061;</mo><mrow><mo>(</mo><mi>x</mi><mo>)</mo></mrow></math>")).toEqual([
    "Sin",
    "x",
  ]);
  expect(read("<math><mi>sin</mi><mi>x</mi></math>")).toEqual(["Sin", "x"]);
  expect(read("<math><msup><mi>sin</mi><mn>2</mn></msup><mi>x</mi></math>")).toEqual(["Power", ["Sin", "x"], 2]);
  expect(read("<math><mi>f</mi><mo>(</mo><mi>x</mi><mo>,</mo><mi>y</mi><mo>)</mo></math>")).toEqual(["f", "x", "y"]);
  expect(read("<math><mi>a</mi><mo>&lt;</mo><mi>b</mi><mo>&#x2264;</mo><mi>c</mi></math>")).toEqual([
    "And",
    ["Less", "a", "b"],
    ["LessEqual", "b", "c"],
  ]);
  expect(read("<math><mo>|</mo><mi>x</mi><mo>|</mo><mo>+</mo><mn>1</mn></math>")).toEqual(["Add", ["Abs", "x"], 1]);
  expect(read("<math><mo>&#x222B;</mo><msup><mi>x</mi><mn>2</mn></msup><mi>d</mi><mi>x</mi></math>")).toEqual([
    "Integrate",
    ["Power", "x", 2],
    "x",
  ]);
  expect(read("<math><msqrt><mi>x</mi></msqrt><mo>+</mo><mroot><mi>x</mi><mn>3</mn></mroot></math>")).toEqual([
    "Add",
    ["Sqrt", "x"],
    ["Root", "x", 3],
  ]);
});

test("a variable named like a constant stays a variable in its scope", () => {
  expect(roundTrip(["Sum", ["Power", "i", 2], ["Limits", "i", 1, 10]])).toBe("exact");
  expect(makeExpression(makeBoxes(["Add", "i", ["Multiply", 2, "ImaginaryUnit"]]))).toEqual([
    "Add",
    "ImaginaryUnit",
    ["Multiply", 2, "ImaginaryUnit"],
  ]);
});

test("heads names a call's written name", () => {
  const boxes = row(["μ", "⁡", row(["(", "n", ")"])]);
  expect(makeExpression(boxes)).toEqual(["MoebiusMu", "n"]);
  expect(makeExpression(boxes, { heads: { μ: "Mobius" } })).toEqual(["Mobius", "n"]);
});

test("a registered notation reads back to its head", () => {
  for (const json of [
    ["Fibonacci", "n"],
    ["Fibonacci", ["Add", "n", 1]],
    ["CatalanNumber", "n"],
    ["Pochhammer", "a", "n"],
    ["Stirling", "n", "k"],
    ["StirlingS1", "n", "k"],
    ["MoebiusMu", "n"],
    ["PolyGamma", "n", "z"],
    ["Multinomial", "a", "b", "c"],
  ] as MathJsonExpression[])
    expect(makeExpression(makeBoxes(json)), JSON.stringify(json)).toEqual(json);
});

test("heads that share one notation are read by structure", () => {
  // `B_n` is a Bell and a Bernoulli number, `ζ(s, a)` a Zeta and a Hurwitz zeta.
  expect(makeExpression(makeBoxes(["BellNumber", "n"]))).toEqual("B_n");
  expect(makeExpression(makeBoxes(["Zeta", "s", "a"]))).toEqual(["HurwitzZeta", "s", "a"]);
});

test("a notation passed in is read back too", () => {
  const notation = { Pentagonal: named("P", 1), Triangular: indexed("T") };
  for (const json of [
    ["Pentagonal", "n"],
    ["Triangular", "n"],
  ] as MathJsonExpression[]) {
    const boxes = makeBoxes(json, notation);
    expect(makeExpression(boxes, { notation })).toEqual(json);
    expect(makeExpression(boxes)).not.toEqual(json);
  }
});

test("what is not an expression is declined, not guessed", () => {
  for (const box of [
    graphics([]),
    form("\\frac{1}{2}", "TeXForm"),
    ["ErrorBox", "x"],
    row(["x", "+"]),
    row(["(", "x"]),
    fraction("n", "k", { FractionLine: false }),
    superscript("x", row(["+"])),
  ] as const)
    expect(() => makeExpression(box as never), JSON.stringify(box)).toThrow(MakeExpressionError);
});

test("every operand of an iterated operator, a derivative or a limit reaches the boxes and reads back", () => {
  const exact = (json: MathJsonExpression) => expect(roundTrip(json)).toBe("exact");
  // A second `Limits` is an inner operator, the first outermost.
  exact(["Product", ["Power", 2, ["Add", "j", "k"]], ["Limits", "k", 1, "p"], ["Limits", "j", 1, "k"]]);
  exact(["Sum", ["Multiply", "j", "k"], ["Limits", "j", 1, 3], ["Limits", "k", 1, "j"]]);
  exact(["Integrate", ["Multiply", "x", "y"], ["Limits", "x", 0, 1], ["Limits", "y", 0, "x"]]);
  exact(["Integrate", "x", ["Limits", "x", 0, 1], ["Limits", "y", 0, 1], ["Limits", "z", 0, 1]]);
  // A step is the first two terms.
  expect(makeExpression(makeBoxes(["Sum", "i", ["Limits", "i", 1, 9, 2]]))).toEqual([
    "Sum",
    "i",
    ["Limits", "i", 1, 9, ["Subtract", 3, 1]],
  ]);
  expect(roundTrip(["Sum", "i", ["Limits", "i", 1, 9, 2]])).toBe("equivalent");
  // Repeated and mixed Leibniz derivatives.
  exact(["D", ["Power", "x", 3], "x", "x"]);
  exact(["D", ["Multiply", "x", "y"], "x", "y"]);
  // One order per argument, or a symbolic one.
  exact(["Derivative", "Beta", 0, 1]);
  exact(["Derivative", "f", 5]);
  exact(["Derivative", "f", "k"]);
  exact(["Derivative", "f", 2]);
  exact(["Apply", ["Derivative", "f", "k"], "x"]);
  // The side a limit is taken from.
  exact(["Limit", ["Function", ["Block", ["Divide", 1, "_1"]], "_1"], 0, 1]);
  exact(["Limit", ["Function", ["Block", ["Divide", 1, "_1"]], "_1"], 0, -1]);
});
