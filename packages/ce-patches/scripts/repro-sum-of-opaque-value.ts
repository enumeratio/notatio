// Plain compute-engine repro (no enumeratio code): `Sum` and `Product` of one operand whose type is
// not a collection return that operand, as the summand of a sum with no bounds (`Sum(7)` is 7).
// An operand of a declared structured type (here a subset, `Subset(5, {1, 3, 4})`) is not a number,
// so the sum of it is not itself. The right answer is to decline (leave `Sum(Subset(...))`
// unevaluated), or, if the type is declared a collection, the sum of its members (8).
//
//   node packages/ce-patches/scripts/repro-sum-of-opaque-value.ts

import { ComputeEngine } from "@cortex-js/compute-engine";

const ce = new ComputeEngine();
ce.declareType("subset", "tuple<integer, list<integer>>");
ce.declare("Subset", { signature: "(integer, list<integer>) -> subset" });

const subset = ["Subset", 5, ["List", 1, 3, 4]];
const rows: [string, unknown][] = [
  ["Sum(7)", ["Sum", 7]],
  ["Sum({1, 3, 4})", ["Sum", ["List", 1, 3, 4]]],
  ["Sum(Subset(5, {1, 3, 4}))", ["Sum", subset]],
  ["Product(Subset(5, {1, 3, 4}))", ["Product", subset]],
];
for (const [label, json] of rows) {
  const expr = ce.box(json as never);
  console.log(
    `${label}\n  evaluate: ${JSON.stringify(expr.evaluate().json)}\n  N:        ${JSON.stringify(expr.N().json)}`,
  );
}
