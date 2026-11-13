import { ComputeEngine } from "@cortex-js/compute-engine";
import { makeExpression, MakeExpressionError, row } from "@notatio/boxes";
import { commandTeX, parseMathML, toLatex } from "@notatio/boxes/render";
import { expect, test } from "vite-plus/test";
import { exportFormats, exportTo, getFormat, importFormats, importFrom } from "../src/index.ts";
import { boxesToExpression, toMathML } from "../src/mathml.ts";
import { CORPUS } from "./corpus.ts";

// The notation itself is `@notatio/boxes`' (its corpus and goldens); this is the format.
test("MathML: root element and display option", () => {
  expect(toMathML("x")).toBe('<math xmlns="http://www.w3.org/1998/Math/MathML"><mi>x</mi></math>');
  expect(toMathML("x", { display: "block" })).toBe(
    '<math xmlns="http://www.w3.org/1998/Math/MathML" display="block"><mi>x</mi></math>',
  );
});

test("MathML: registered as a format", () => {
  const ce = new ComputeEngine();
  const format = getFormat("mathml");
  expect(format?.name).toBe("MathML");
  expect(exportFormats()).toContain("MathML");
  expect(importFormats()).toContain("MathML");
  expect(getFormat("MathMLForm")).toBe(format);
  expect(exportTo(ce.box(["Add", "x", 1]), "MathML")).toBe(
    '<math xmlns="http://www.w3.org/1998/Math/MathML"><mrow><mi>x</mi><mo>+</mo><mn>1</mn></mrow></math>',
  );
  expect(exportTo(ce.parse("\\frac{x+1}{2}", { form: "raw" }), "MathML", { fragment: true })).toBe(
    "<mfrac><mrow><mi>x</mi><mo>+</mo><mn>1</mn></mrow><mn>2</mn></mfrac>",
  );
});

// MathML now reaches an expression through `makeExpression`; where the LaTeX seam it replaced
// (boxes, to LaTeX, to compute-engine) read a corpus expression, it reads the same one.
const seam = (mathml: string, ce: ComputeEngine) => ce.parse(commandTeX(toLatex(parseMathML(mathml)))).json;

for (const latex of CORPUS) {
  test(`MathML reads as the LaTeX seam did: ${latex}`, () => {
    const ce = new ComputeEngine();
    const mathml = exportTo(ce.parse(latex), "MathML") as string;
    expect(importFrom(mathml, "MathML", { ce })).toEqual(seam(mathml, ce));
  });
}

test("boxesToExpression falls back to the LaTeX seam for boxes the reader declines", () => {
  const ce = new ComputeEngine();
  const declined = row(["x", "+", ["ErrorBox", "y"]]) as never;
  expect(() => makeExpression(declined)).toThrow(MakeExpressionError);
  expect(boxesToExpression(declined, ce)).toEqual(ce.parse(commandTeX(toLatex(declined))).json);
});
