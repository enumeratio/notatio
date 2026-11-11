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
/** The examples whose read-back prints differently, over every head the run picked. */
let changed = 0;
const picked = heads.filter(({ head }, i) => deep || NAMED.has(head) || i % 25 === 0);

test.each(picked.map(({ head, entry }) => [head, entry.examples] as const))(
  "%s: an example cell's input-form keeps its calls and tuples",
  (_, examples) => {
    const lost: string[] = [];
    for (const { id, expr } of examples) {
      const want = printed(expr);
      const got = asTyped(expr);
      if (want === undefined || got === undefined) continue;
      if (want !== got) changed++;
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

// The classes that lose arguments, a grouping or digits. Each is held over every example that
// mentions the head, comparing what the example prints with what the editor's LaTeX reads back as.

/** The argument count of every call `head(…)` in InputForm `text`, in order. */
function arities(text: string, head: string): number[] {
  const counts: number[] = [];
  for (const found of text.matchAll(new RegExp(`\\b${head}\\(`, "g"))) {
    let depth = 0;
    let commas = 0;
    let last = "";
    let quoted = false;
    for (let i = found.index + found[0].length; i < text.length; i++) {
      const c = text[i]!;
      if (quoted) {
        if (c === "\\") i++;
        else if (c === '"') quoted = false;
        continue;
      }
      if (c === '"') quoted = true;
      else if ("([{".includes(c)) depth++;
      else if (")]}".includes(c) && depth-- === 0) break;
      else if (c === "," && depth === 0) commas++;
      if (!/\s/.test(c)) last = c;
    }
    // `f()` has none; a trailing comma (a multi-line call) counts no argument.
    const empty = text.slice(found.index + found[0].length).startsWith(")");
    counts.push(empty ? 0 : last === "," ? commas : commas + 1);
  }
  return counts;
}

/** The numbers with a decimal point in InputForm `text`, digit separators dropped. */
const decimals = (text: string): string[] =>
  Array.from(text.matchAll(/\d[\d_]*\.[\d_]*\d/g), (m) => m[0].replaceAll("_", ""));

/** Every example `mentions` picks whose read-back `lost` says differs from its print. */
function lossesOf(mentions: RegExp, lost: (want: string, got: string) => boolean): string[] {
  const losses: string[] = [];
  for (const { entry } of heads) {
    for (const { id, expr } of entry.examples) {
      if (!mentions.test(JSON.stringify(expr))) continue;
      const want = printed(expr);
      const got = asTyped(expr);
      if (want !== undefined && got !== undefined && lost(want, got)) losses.push(id);
    }
  }
  return losses;
}

const keepsArity = (head: string) => (want: string, got: string) =>
  JSON.stringify(arities(want, head)) !== JSON.stringify(arities(got, head));

test.each([
  "PolyLog", // its order, argument and extra argument
  "Transpose", // its permutation
  "Derivative", // its orders, a symbolic or partial one too
  "Integrate", // every limit, as one integral and not a nest of them
  "Union", // every operand, as one union and not a nest of them
  "Intersection",
])("%s keeps every argument", (head) => {
  expect(lossesOf(new RegExp(`"${head}"`), keepsArity(head))).toEqual([]);
});

test("a decimal keeps all its digits", () => {
  const cut = (want: string, got: string) => {
    const kept = new Set(decimals(got));
    return decimals(want).some((x) => !kept.has(x));
  };
  expect(lossesOf(/\d\.\d{12}/, cut)).toEqual([]);
});

test("a dictionary stays a dictionary, not a set of arrows", () => {
  expect(lossesOf(/"dict"|"Dictionary"/, (want, got) => got.includes("To(") && !want.includes("To("))).toEqual([]);
});

// Cases the examples don't all reach, each read back as the InputForm it was written from.
test.each([
  ["a third PolyLog argument", ["PolyLog", 1, 2, 1]],
  ["a first derivative, with its order", ["Derivative", "f", 1]],
  ["a second derivative, as primes", ["Derivative", "f", 2]],
  ["a third derivative of a function symbol", ["Derivative", "g", 3]],
  ["a derivative of an expression, with its order", ["Derivative", ["Power", "x", 2], 1]],
  ["a partial derivative", ["Derivative", "Beta", 0, 1]],
  ["a derivative applied, of a symbolic order", ["Apply", ["Derivative", "f", "k"], "x"]],
  ["a second derivative applied", ["Apply", ["Derivative", "f", 2], "x"]],
  ["a permuted transpose", ["Transpose", "a", "perm"]],
  ["a transposed sum", ["Transpose", ["Add", "a", "b"]]],
  ["a double integral", ["Integrate", ["Sin", "x"], ["Tuple", "x", 0, 1], ["Tuple", "y", 0, 1]]],
  ["a triple integral", ["Integrate", "f", ["Tuple", "x", 0, 1], ["Tuple", "y", 0, 1], ["Tuple", "z", 0, 1]]],
  [
    "an integral of an integral",
    ["Integrate", ["Integrate", ["Sin", "x"], ["Tuple", "y", 0, 1]], ["Tuple", "x", 0, 1]],
  ],
  ["a union of three", ["Union", "a", "b", "c"]],
  ["a union of a union", ["Union", ["Union", "a", "b"], "c"]],
  ["an intersection of four", ["Intersection", "a", "b", "c", "d"]],
  ["a union of one", ["Union", "a"]],
  ["a union of none", ["Union"]],
  ["a dictionary", ["Dictionary", ["KeyValuePair", { str: "k" }, "v"]]],
  ["a dictionary of two", ["Dictionary", ["KeyValuePair", { str: "k" }, 1], ["KeyValuePair", { str: "m" }, 2]]],
  ["a long decimal", ["Sin", { num: "3.141592653589793238462643383279" }]],
  ["an applied function symbol", ["DiscreteShift", ["a", "n"], "n"]],
])("%s reads back as written", (_, expr) => {
  const text = printed(expr);
  expect(text).toBeDefined();
  expect(asTyped(expr)).toBe(text);
});

// What the sweep still loses, counted as it is. A count that moves is a regression, or a fix: lower
// it. None of these is a change of head under another spelling (`Exp`, `Square`, a `Log` base,
// `ImaginaryUnit`, `1 * x ^ -1`), which the sweep leaves alone.
const REMAINING: readonly {
  readonly name: string;
  readonly mentions: RegExp;
  readonly lost: (want: string, got: string) => boolean;
  readonly count: number;
}[] = [
  {
    name: "an indefinite integral's `(x, Nothing, Nothing)` reads as `x`",
    mentions: /"Integrate"/,
    lost: (want, got) => want.includes("Nothing") && !got.includes("Nothing"),
    count: 6,
  },
  {
    name: "a `Boole` reads as a bracketed list",
    mentions: /"Boole"/,
    lost: (_, got) => !got.includes("Boole("),
    count: 5,
  },
  {
    name: "a step of a `Sum` or `Product` iterator is dropped",
    mentions: /"(Sum|Product)"/,
    lost: (want, got) =>
      /\(\w+, [^,()]+, [^,()]+, [^,()]+\)/.test(want) && !/\(\w+, [^,()]+, [^,()]+, [^,()]+\)/.test(got),
    count: 2,
  },
  {
    name: "an `Apply` of an `Apply` reads as an error",
    mentions: /"Apply"/,
    lost: (_, got) => got.includes("Error("),
    count: 4,
  },
  {
    name: "a `ResidueClass` reads as a subscripted conjugate",
    mentions: /"ResidueClass"/,
    lost: (_, got) => got.includes("Subscript(Conjugate("),
    count: 2,
  },
];

test.each(REMAINING.map((c) => [c.name, c] as const))("remaining: %s", (_, { mentions, lost, count }) => {
  expect(lossesOf(mentions, lost)).toHaveLength(count);
});

// Every example, the sweep's total, counted by the per-head test at the top (which reads each
// example in a deep run): the spellings left alone are most of it. A count that moves is a loss
// to look at, or a fix to lower it by.
const TOTAL = 1043;
test.skipIf(!deep)("the sweep's total loss count holds", () => {
  expect(changed).toBe(TOTAL);
});
