// A carrier's constructor keeps its operands: reading a part of `C(args)` before it is evaluated is the
// part of the evaluated `C(args)`. `partsOf` (@notatio/engine) reads the parts of a constructor call
// without evaluating it, so a carrier whose constructor normalizes on evaluation (sorts, reduces,
// relabels) is listed in `NOT_READABLE` and declined there. The subjects are every constructor call
// the reference examples hold.

import { CARRIERS } from "@notatio/combinatorics";
import { declareStructuralHeads } from "@notatio/engine";
import { recordsRoot, referenceData } from "@notatio/reference/node";
import { expect, test } from "vite-plus/test";
import { fullEngine } from "../src/engine.ts";

const { heads } = referenceData(recordsRoot(import.meta.dirname));
const names = new Set(CARRIERS.map((carrier) => carrier.name));

const ce = fullEngine();

type Call = readonly [string, ...unknown[]];
const isCall = (x: unknown): x is Call => Array.isArray(x) && typeof x[0] === "string";

/** Every call of a carrier's constructor inside `expr`, outermost first. */
function constructorCalls(expr: unknown, found: Call[] = []): Call[] {
  if (!isCall(expr)) return found;
  if (names.has(expr[0])) found.push(expr);
  for (const operand of expr.slice(1)) constructorCalls(operand, found);
  return found;
}

const subjects = new Map<string, Map<string, Call>>();
for (const { entry } of heads)
  for (const example of entry.examples)
    for (const call of constructorCalls(example.expr))
      if (call.length > 1) {
        const byText = subjects.get(call[0]) ?? new Map<string, Call>();
        byText.set(JSON.stringify(call), call);
        subjects.set(call[0], byText);
      }

const PER_CARRIER = 6;
const PARTS = 3;

/** The law's engine reads every constructor by parts, so the comparison tests the constructor and not the registry. */
const lawEngine = fullEngine();
declareStructuralHeads(
  lawEngine,
  CARRIERS.map((carrier) => carrier.name),
);

/** Whether reading a part first and evaluating after agrees with evaluating first, per carrier with subjects. */
function law(): Record<string, string | true> {
  const results: Record<string, string | true> = {};
  for (const [name, byText] of subjects) {
    results[name] = true;
    for (const call of [...byText.values()].slice(0, PER_CARRIER)) {
      const evaluated = lawEngine.box(call as never).evaluate();
      for (let i = 1; i <= PARTS; i++) {
        const before = JSON.stringify(lawEngine.box(["At", call, i] as never).evaluate().json);
        const after = JSON.stringify(lawEngine.box(["At", evaluated.json, i] as never).evaluate().json);
        if (before !== after && results[name] === true)
          results[name] = `At(${JSON.stringify(call)}, ${i}): ${before} against ${after}`;
      }
    }
  }
  return results;
}

/** Carriers whose constructor call is read by parts: only those the law vouches for (`readable: true` in their data). */
const READABLE = CARRIERS.filter((carrier) => carrier.readable === true).map((carrier) => carrier.name);

test("a carrier is readable exactly when the law covers it with an example and it passes", () => {
  const results = law();
  const passing = Object.keys(results).filter((name) => results[name] === true);
  expect(READABLE.toSorted()).toEqual(passing.toSorted());
});

const value = (expr: unknown) => JSON.stringify(ce.box(expr as never).evaluate().json);
const fn = (body: unknown, ...params: string[]) => ["Function", body, ...params];

// A map returning a carrier is a pending call until its argument is bound: reading its operand as a part
// would answer with the argument. Native has no part to give a carrier value, so the call is its type Error.
test("At of a constructor call unwraps it, and of a map returning a carrier never gives the argument", () => {
  const dyck = ["DyckPath", ["List", 0, 1]];
  expect(value(["At", dyck, 1])).toBe(JSON.stringify(["List", 0, 1]));

  const poset = ["Poset", ["List", ["List"], ["List"], ["List", 1], ["List", 2], ["List", 3, 4]]];
  for (const [head, argument] of [
    ["CanonicalPoset", poset],
    ["TamariBinaryTree", dyck],
  ] as const) {
    const inLambda = value(["Apply", fn(["At", [head, "p"], 1], "p"), argument]);
    expect(inLambda, head).toMatch(/^\["Error"/);
    expect(inLambda, head).not.toBe(value(argument));
    expect(value(["At", [head, argument], 1]), head).toMatch(/^\["Error"/);
  }
});

test("a constructor marked not readable is not read before it is evaluated", () => {
  const dyck = ["DyckPath", ["List", 1, 1, 0, 0, 1, 0]];
  const read = value(["At", ["BinaryTree", dyck], 1]);
  expect(read).toMatch(/^\["Error"/);
  expect(read).not.toBe(value(dyck));
});
