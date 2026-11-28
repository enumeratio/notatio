import { expect, test } from "vite-plus/test";
import { referenceData } from "../src/node.ts";
import { asksForDigits, verdictOf } from "../scripts/oracle-verdict.ts";

// The comparer, held to the committed rows: each case takes the stored `out` of a system's run and the
// example's pinned `expected`, as the scan judges them, and names the verdict the comparer must reach.
// A row the record still files as a disagreement keeps that verdict here.

const data = referenceData();

/** The verdict for a stored row (an example's `Head/id` and the system that ran it). */
function judged(system: "wolfram" | "sage", id: string): string {
  const [head, key] = id.split("/") as [string, string];
  const loaded = data.heads.find((h) => h.head === head && h.implementations?.[key]?.[system] !== undefined);
  if (loaded === undefined) throw new Error(`no ${system} row for ${id}`);
  const example = loaded.entry.examples.find((e) => e.id === key);
  const row = loaded.implementations?.[key]?.[system];
  if (example === undefined || row?.out === undefined) throw new Error(`no ${system} row for ${id}`);
  return verdictOf(
    system,
    example.expected as never,
    { value: row.out, ...(row.shown === undefined ? {} : { shown: row.shown }) },
    row.tolerance,
    asksForDigits(example.expr as never),
    example.expr as never,
    example.known as never,
  );
}

// Machine-float noise in the components of `Around`: the last bits of the mean or the uncertainty.
const NOISE = [
  "Around/scaling-scales-the-uncertainty",
  "Around/through-a-function-f-2-3-5-not-yet-multinomial",
  "Cosh/uncertainty-propagation-cosh-2-sqrt-3-pm-0-1",
  "Sec/uncertainty-propagation-sec-2-pm-0-01-approx-2",
  "GammaLn/uncertainty-propagation-through-ln-gamma-with",
  "DirichletEta/uncertainty-propagation-eta-2-pm-0-01-0-82247-pm",
  "HurwitzZeta/uncertainty-in-a",
  "BetaRegularized/uncertainty-propagation",
  "Multinomial/an-around-argument-should-propagate-its",
];

test.each(NOISE)("%s: Wolfram's Around differs in the last bits only, and agrees", (id) => {
  expect(judged("wolfram", id)).toBe("agree");
});

// Real precision differences, which float noise does not explain.
const REAL = [
  // The uncertainty is 0.0985 against 0.0091.
  "LerchPhi/uncertainty-in-z",
  // Wolfram reduces a huge argument in machine precision and loses it; ours reduces it exactly.
  "Cos/a-huge-neg-7-60-argument",
  "Sin/an-even-huger-argument-11-38",
  "Csc/a-huge-3-200-argument",
  // Wolfram's interval is wider than ours by far more than rounding.
  "PolyLog/image-order-neg-3-over-neg-0p5-to-0p2",
  "BarnesG/image-over-0p5-to-1p5",
];

test.each(REAL)("%s: a precision difference beyond float noise still disagrees", (id) => {
  expect(judged("wolfram", id)).toBe("disagree");
});
