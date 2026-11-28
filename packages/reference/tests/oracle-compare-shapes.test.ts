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
    { value: row.out, numeric: row.out, ...(row.shown === undefined ? {} : { shown: row.shown }) },
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

// Wolfram answers an array as a SparseArray object; ours is the dense list of the same entries.
const SPARSE = [
  "AdjacencyMatrix/a-directed-edge-is-asymmetric",
  "AdjacencyMatrix/adjacency-matrix-of-k4",
  "IncidenceMatrix/incidence-matrix-of-a-mixed-graph",
  "SparseArray/sparsearray-custom-default",
  "SparseArray/sparsearray-infers-dims",
  "SparseArray/sparsearray-list-list-1-0-0-list-1-2-0-list-1-2",
  "WeightedAdjacencyMatrix/an-undirected-loop-counts-once",
  "WeightedAdjacencyMatrix/directed-weight-is-one-way",
  "WeightedAdjacencyMatrix/float-weights-sum-as-floats",
  "WeightedAdjacencyMatrix/no-edgeweight-falls-back-to-adjacencymatrix",
  "WeightedAdjacencyMatrix/self-loop-weight-sits-on-the-diagonal",
  "WeightedAdjacencyMatrix/two-weighted-edges",
  "Most/most-sparsearray-range-1-100",
  "Rest/rest-sparsearray-range-1-100",
];

test.each(SPARSE)("%s: the SparseArray answer agrees with the dense list", (id) => {
  expect(judged("wolfram", id)).toBe("agree");
});

// Wolfram has no set type, so its empty set is `{}`; ours is `EmptySet`.
const EMPTY = [
  "Union/with-no-arguments-the-union-is-empty",
  "Intersection/disjoint-collections-intersect-to-the-special",
  "Intersection/intersection-list-a-b-c-list-d-exponentiale-f",
  "SetMinus/a-setminus-a-varnothing",
  "SetMinus/setminus-is-not-commutative-b-setminus-a-can",
];

test.each(EMPTY)("%s: the empty list is the empty set", (id) => {
  expect(judged("wolfram", id)).toBe("agree");
});

// CenteredInterval's FullForm is its packed ball representation, whose encoding is not documented
// well enough to read as a value: these rows keep their disagreement until a kernel decodes them.
const PACKED = [
  "CenteredInterval/an-exact-factor-scales-center-and-radius",
  "CenteredInterval/centers-add-and-radii-add",
  "CenteredInterval/converts-an-interval-to-center-radius-form",
  "CenteredInterval/radii-add-under-subtraction-too",
];

test.each(PACKED)("%s: the packed representation stays a disagreement", (id) => {
  expect(judged("wolfram", id)).toBe("disagree");
});
