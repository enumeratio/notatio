// An example cell's `input-form` is the retypeable text of its LaTeX, read back the way an editor
// reads it. It must keep every call the example makes: `\Gamma(2.5)` is `Gamma(2.5)`, not
// `Gamma * 2.5`, and a pair is a tuple, not a `Delimiter`. Every head's examples go through the
// same route as the editor (`ce.box(…).latex`, `AS_TYPED`, `toInputForm`).

import { toInputForm } from "@enumeratio/engine";
import { loadReferenceData, PACKAGES } from "@enumeratio/reference/node";
import { expect, test } from "vite-plus/test";
import { declaredEngine } from "../../reference/scripts/engines.ts";
import { AS_TYPED } from "../src/latex.ts";

const { heads } = loadReferenceData(PACKAGES);
const ce = declaredEngine();

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
      const got = printed(ce.parse(ce.box(expr as never, { form: "raw" }).latex, AS_TYPED).json);
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
  expect(printed(ce.parse(ce.box(expr as never, { form: "raw" }).latex, AS_TYPED).json)).toBe(text);
});
