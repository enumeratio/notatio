// An example cell's `input-form` is the retypeable text of its LaTeX, read back the way an editor
// reads it. It must keep every call the example makes: `\Gamma(2.5)` is `Gamma(2.5)`, not
// `Gamma * 2.5`, and a pair is a tuple, not a `Delimiter`. Every head's examples go through the
// same route as the editor: the page engine's LaTeX (`displayLatexSyntax`, with the packages'
// notation), `typedLatex`, `AS_TYPED`, `toInputForm`.

import { LATEX_DICTIONARY } from "@cortex-js/compute-engine";
import { combineNotation } from "@enumeratio/boxes";
import { toInputForm } from "@enumeratio/engine";
import { loadReferenceData, PACKAGES } from "@enumeratio/reference/node";
import { expect, test } from "vite-plus/test";
import { declaredEngine, packageNotations } from "../../reference/scripts/engines.ts";
import { displayLatexSyntax } from "../src/display.ts";
import { AS_TYPED, typedLatex } from "../src/latex.ts";

const { heads } = loadReferenceData(PACKAGES);
const notation = combineNotation(await packageNotations());
const ce = declaredEngine({ latexSyntax: displayLatexSyntax(LATEX_DICTIONARY as never, notation.latex as never) });

/** What the editor shows for `json`, read back the way a cell reads it, as InputForm. */
const asTyped = (json: unknown): string | undefined => printed(ce.parse(typedLatex(ce, json), AS_TYPED).json);

const printed = (json: unknown): string | undefined => {
  try {
    return toInputForm(json as never);
  } catch {
    return undefined;
  }
};
const calls = (text: string): Set<string> => new Set(Array.from(text.matchAll(/\b([A-Z]\w*)\(/g), (m) => m[1]!));

// The standard run takes the heads named for the class (a glyph or a tuple argument) and every
// 25th other head; the nightly deep run (`DEEP_TESTS=1`) takes every head.
const NAMED = new Set([
  "Gamma",
  "Zeta",
  "PolyGamma",
  "Beta",
  "LogGamma",
  "Plot",
  "Animator",
  "Circle",
  "Point",
  "Midpoint",
]);
const deep = process.env["DEEP_TESTS"] === "1";
const picked = heads.filter(({ head }, i) => deep || NAMED.has(head) || i % 25 === 0);

test.each(picked.map(({ head, entry }) => [head, entry.examples] as const))(
  "%s: an example cell's input-form keeps its calls and tuples",
  (_, examples) => {
    const lost: string[] = [];
    for (const { id, expr } of examples) {
      const want = printed(expr);
      const got = asTyped(expr);
      if (want === undefined || got === undefined) continue;
      // A call read as a product (`Gamma * 2.5`), or a tuple kept as its `Delimiter`.
      const multiplied = [...calls(want)].filter((name) => new RegExp(`\\b${name} \\* `).test(got));
      if (multiplied.length > 0 || got.includes("Delimiter(")) lost.push(`${id}: ${want} -> ${got}`);
    }
    expect(lost).toEqual([]);
  },
);

// The glyph heads: a Greek letter or other symbol prints for the head, and the `(…)` after it is
// its argument list.
test.each([
  ["Gamma", ["Gamma", 2.5], "Gamma(2.5)"],
  ["Gamma with limits", ["Gamma", 2.5, 0, 1.5], "Gamma(2.5, 0, 1.5)"],
  ["Zeta", ["Zeta", 2], "Zeta(2)"],
  ["PolyGamma", ["PolyGamma", 1, 2], "PolyGamma(1, 2)"],
  ["Beta", ["Beta", 1, 2], "Beta(1, 2)"],
  ["a tuple", ["Plot", ["Sin", "x"], ["Tuple", "x", 0, 1]], "Plot(Sin(x), (x, 0, 1))"],
])("%s", (_, expr, text) => {
  expect(asTyped(expr)).toBe(text);
});

// A class of loss, held over every example that could show it (the filter is on the example's own
// MathJSON, so the check is cheap and no example of the class is left out). `lost` says what the
// read-back did to the printed example.
const CLASSES: readonly {
  readonly name: string;
  readonly mentions: RegExp;
  readonly lost: (want: string, got: string) => boolean;
}[] = [
  {
    // Past the second nesting level compute-engine writes `\sqrt{2}` as `2^{1/2}`.
    name: "a Sqrt stays a Sqrt, however deeply it is nested",
    mentions: /"Sqrt"/,
    lost: (want, got) => (want.match(/\bSqrt\(/g)?.length ?? 0) > (got.match(/\bSqrt\(/g)?.length ?? 0),
  },
  {
    // `\mathrm{arcsec}` reads as the unit arcsecond.
    name: "Arcsec and Arccsc stay inverse trigonometric functions, not a Quantity",
    mentions: /"Arc(sec|csc)"/,
    lost: (_, got) => got.includes("Quantity("),
  },
  {
    // `5!=5` reads as `5 != 5`, a different relation.
    name: "an equation after a factorial stays an equation",
    mentions: /"Factorial2?"/,
    lost: (want, got) => /!+ (==|=) /.test(want) && /!+ != /.test(got),
  },
  {
    // `-\infty` reads as a negation of `PositiveInfinity`.
    name: "NegativeInfinity prints as NegativeInfinity",
    mentions: /"NegativeInfinity"/,
    lost: (want, got) => want.includes("NegativeInfinity") && got.includes("-PositiveInfinity"),
  },
];

test.each(CLASSES.map((c) => [c.name, c] as const))("%s", (_, { mentions, lost }) => {
  const losses: string[] = [];
  for (const { entry } of heads) {
    for (const { id, expr } of entry.examples) {
      if (!mentions.test(JSON.stringify(expr))) continue;
      const want = printed(expr);
      const got = asTyped(expr);
      if (want !== undefined && got !== undefined && lost(want, got)) losses.push(`${id}: ${want} -> ${got}`);
    }
  }
  expect(losses).toEqual([]);
});
