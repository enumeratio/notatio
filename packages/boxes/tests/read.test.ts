import { ComputeEngine } from "@cortex-js/compute-engine";
import type { MathJsonExpression } from "@cortex-js/compute-engine/epsil";
import { expect, test } from "vite-plus/test";
import {
  fence,
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
  type Writer,
} from "../src/index.ts";
import { form } from "../src/box.ts";
import { parseMathML, toAscii, toLatex, toMathML, toText } from "../src/render/index.ts";
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
  "superscript",
  "sum canonical",
  "derivative default order",
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

test("heads that share one notation keep their head in a TagBox", () => {
  for (const json of [
    ["JacobiSymbol", "a", "n"],
    ["KroneckerSymbol", "a", "n"],
    ["LegendreSymbol", "a", "p"],
    ["Zeta", "s", "a"],
    ["HurwitzZeta", "s", "a"],
    ["Pochhammer", ["Add", "x", 1], "n"],
    ["PowerMod", "a", "b", "n"],
  ] as MathJsonExpression[]) {
    const boxes = makeBoxes(json);
    expect(boxes, JSON.stringify(json)).toMatchObject(["TagBox", expect.anything(), (json as unknown as string[])[0]]);
    expect(makeExpression(boxes), JSON.stringify(json)).toEqual(json);
  }
  // The same boxes with no tag are what any other expression of that structure writes.
  expect(makeExpression(makeBoxes(["Divide", "a", "n"]))).toEqual(["Divide", "a", "n"]);
});

test("a tag is not seen in what is written, and MathML keeps it", () => {
  const strip = (b: unknown): unknown => (Array.isArray(b) ? (b[0] === "TagBox" ? strip(b[1]) : b.map(strip)) : b);
  const boxes = makeBoxes(["Multiply", 2, ["Zeta", "s", "a"]]);
  expect(JSON.stringify(boxes)).toContain("TagBox");
  expect(toLatex(boxes)).toBe(toLatex(strip(boxes) as never));
  expect(toText(boxes)).toBe(toText(strip(boxes) as never));
  expect(makeExpression(parseMathML(toMathML(boxes)))).toEqual(["Multiply", 2, ["Zeta", "s", "a"]]);
});

test("a notation that names its head stays untagged", () => {
  for (const json of [
    ["Fibonacci", "n"],
    ["NthPrime", "n"],
    ["BernoulliB", "n"],
    ["MoebiusMu", "n"],
    ["Zeta", "s"],
  ] as MathJsonExpression[])
    expect(JSON.stringify(makeBoxes(json)), JSON.stringify(json)).not.toContain("TagBox");
});

test("a Bell number is a call, a Bernoulli number is B_n", () => {
  expect(makeExpression(makeBoxes(["BellNumber", "n"]))).toEqual(["BellNumber", "n"]);
  expect(makeExpression(makeBoxes(["BernoulliB", "n"]))).toEqual(["BernoulliB", "n"]);
});

test("a tag on a notation passed in is kept and read back", () => {
  const notation = {
    Quotient: ([a, b]: readonly MathJsonExpression[], write: Writer) =>
      fence("(", [fraction(write.box(a!), write.box(b!))], ")"),
  };
  const boxes = makeBoxes(["Quotient", "a", "n"], notation);
  expect(boxes).toMatchObject(["TagBox", expect.anything(), "Quotient"]);
  expect(makeExpression(boxes, { notation })).toEqual(["Quotient", "a", "n"]);
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

test("a function's parameters named i or e read as letters, not constants", () => {
  expect(makeExpression(makeBoxes(["Function", ["Add", "i", "j"], "i", "j"]))).toEqual([
    "Function",
    ["Add", "i", "j"],
    "i",
    "j",
  ]);
  // A lone `i` outside a parameter list is still the imaginary unit.
  expect(makeExpression(makeBoxes(["Add", "i", 1]))).toEqual(["Add", "ImaginaryUnit", 1]);
});

const INTERVALS: Record<string, MathJsonExpression> = {
  closed: ["Interval", 0, 1],
  open: ["Interval", ["Open", 0], ["Open", 1]],
  "open below": ["Interval", ["Open", 0], 1],
  "open above": ["Interval", 0, ["Open", 1]],
};

test("an interval is written as ISO 80000-2 and read back as an interval", () => {
  const written = Object.fromEntries(Object.entries(INTERVALS).map(([k, json]) => [k, toText(makeBoxes(json))]));
  // Only the closed one collides with a list, so only it is tagged.
  expect(written).toEqual({ closed: "Interval(0, 1)", open: "]0, 1[", "open below": "(0, 1]", "open above": "[0, 1)" });
  expect(JSON.stringify(makeBoxes(INTERVALS.closed!))).toContain('"TagBox"');
  expect(JSON.stringify(makeBoxes(INTERVALS.open!))).not.toContain("TagBox");
  for (const [name, json] of Object.entries(INTERVALS)) expect(roundTrip(json), name).toBe("exact");
});

test("an interval reads from the bracket pairs written as text, ISO's mixed ones too", () => {
  const read = (...items: string[]) => makeExpression(row(items.map((t) => (t.length > 1 ? row(t.split(" ")) : t))));
  expect(read("]", "a , b", "[")).toEqual(["Interval", ["Open", "a"], ["Open", "b"]]);
  expect(read("]", "a , b", "]")).toEqual(["Interval", ["Open", "a"], "b"]);
  expect(read("[", "a , b", "[")).toEqual(["Interval", "a", ["Open", "b"]]);
  // Untagged, a closed pair is a list and a round pair a tuple.
  expect(read("[", "a , b", "]")).toEqual(["List", "a", "b"]);
  expect(read("(", "a , b", ")")).toEqual(["Tuple", "a", "b"]);
  expect(read("x", "∈", "]", "a , b", "[")).toEqual(["Element", "x", ["Interval", ["Open", "a"], ["Open", "b"]]]);
  // A `[` that closes an interval is no factor of what precedes it, however the pairs are mixed.
  const open = ["Interval", ["Open", "a"], ["Open", "b"]];
  const halfOpen = ["Interval", "c", ["Open", "d"]];
  expect(read("x", "∈", "]", "a , b", "[", "∪", "[", "c , d", "[")).toEqual([
    "Element",
    "x",
    ["Union", open, halfOpen],
  ]);
  expect(read("[", "c , d", "[", "∪", "]", "a , b", "[")).toEqual(["Union", halfOpen, open]);
  const sets: MathJsonExpression = ["Element", "x", ["Union", open, halfOpen]] as never;
  expect(roundTrip(sets)).toBe("exact");
});

test("a closed interval is spelled where a set is expected as compute-engine reads it", () => {
  const interval: MathJsonExpression = ["Interval", 0, 1];
  const cases: [MathJsonExpression, string, string][] = [
    [interval, "\\mathrm{Interval}(0, 1)", "Interval(0, 1)"],
    [["Element", "x", interval], "x∈[0,1]", "x ∈ [0, 1]"],
    [["NotElement", "x", interval], "x∉[0,1]", "x ∉ [0, 1]"],
    [["Subset", interval, "A"], "[0,1]⊂A", "[0, 1] ⊂ A"],
    [["Equal", "y", interval], "y=\\mathrm{Interval}(0, 1)", "y = Interval(0, 1)"],
    [
      ["Element", "x", ["Interval", ["Open", 0], ["Open", 1]]],
      "x∈\\mathopen\\rbrack0,1\\mathclose\\lbrack",
      "x ∈ ]0, 1[",
    ],
  ];
  for (const [json, latex, text] of cases) {
    expect(toLatex(makeBoxes(json)), JSON.stringify(json)).toBe(latex);
    expect(toText(makeBoxes(json)), JSON.stringify(json)).toBe(text);
    expect(roundTrip(json), JSON.stringify(json)).toBe("exact");
  }
});

test("compute-engine reads the interval LaTeX written back", () => {
  for (const json of Object.values(INTERVALS))
    expect(ce.parse(toLatex(makeBoxes(json)), { form: "raw" }).json, JSON.stringify(json)).toEqual(json);
  const element: MathJsonExpression = ["Element", "x", ["Interval", 0, 1]];
  expect(ce.parse(toLatex(makeBoxes(element)), { form: "raw" }).json).toEqual(element);
});

test("an integer range is ⟦a, b⟧ when it counts up, and reads back", () => {
  for (const json of [
    ["Range", 1, 10],
    ["Range", "a", "b", 1],
    ["Range", 5, 5],
  ] as [string, ...MathJsonExpression[]][]) {
    const boxes = makeBoxes(json);
    expect(toText(boxes), JSON.stringify(json)).toMatch(/^⟦.*⟧$/);
    // A stated step of 1 is the default step.
    expect(makeExpression(boxes), JSON.stringify(json)).toEqual(json.slice(0, 3));
  }
  // `Range(1, 0)` counts down, an unknown order and a step other than 1 are not `a ≤ … ≤ b`.
  for (const json of [
    ["Range", 1, 0],
    ["Range", "a", "b"],
    ["Range", 1, 10, 2],
    ["Range", 5, 1, 1],
    ["Range", 0.5, 3, 1],
  ] as MathJsonExpression[])
    expect(toText(makeBoxes(json)), JSON.stringify(json)).toMatch(/^Range\(/);
  expect(toLatex(makeBoxes(["Range", 1, 10]))).toBe("1..10");
  expect(toLatex(makeBoxes(["Add", 2, ["Range", 1, 3]]))).toBe("2+(1..3)");
  expect(ce.parse("1..10", { form: "raw" }).json).toEqual(["Range", 1, 10]);
  expect(toAscii(makeBoxes(["Range", 1, 10]))).toBe("Range(1, 10)");
});
