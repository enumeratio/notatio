import { bareEngine, createEngine } from "@notatio/engine/testing";
import { expect, test } from "vite-plus/test";
import { declareCombinatorics } from "../src/index.ts";
import { interpret, sweepTargets } from "../src/sweep.ts";

// The interpreter is a definition's meaning, and declaring the libraries must not change it: the engine every
// page uses answers as a bare compute-engine does (the interpreter sweep, census's `scripts/
// interpreter-sweep.ts`, holds every definition to that nightly). These are the faults it found, as fixed cases:
// `Ordering` read a lazy collection's call arguments, and `declareOperatorForms` replaced `Map`'s signature.
// `SingletonRefinementCount` on `[4, 2, 1]` is in partitions/tests/interpreted.test.ts.

const declared = createEngine(declareCombinatorics);
const bare = bareEngine();
const run = (ce: typeof bare, expr: unknown) => ce.box(expr as never).evaluate({ materialization: true }).json;

test("Ordering of a lazy Map equals the bare engine's", () => {
  const lazy = ["Map", ["Function", ["Subtract", 10, "x"], "x"], ["List", 3, 1, 2]];
  expect(run(declared, ["Ordering", lazy])).toEqual(["List", 1, 3, 2]);
  expect(run(declared, ["Ordering", lazy])).toEqual(run(bare, ["Ordering", lazy]));
});

test("a Map lambda over a collection has no Error on the declared engine", () => {
  const call = ["Map", ["Function", ["If", ["Element", "i", ["List"]], 1, 0], "i"], ["List", 1, 2, 3]];
  const answer = run(declared, call);
  expect(JSON.stringify(answer)).not.toContain('"Error"');
  expect(answer).toEqual(run(bare, call));
});

test("BinaryWord of the finset Tuple(3, List()), interpreted, equals the bare engine's", () => {
  const target = sweepTargets().find((t) => t.key === "BinaryWord@finset")!;
  const subject = ["Tuple", 3, ["List"]];
  const answer = interpret(declared, target, subject);
  expect(JSON.stringify(answer)).not.toContain('"Error"');
  expect(answer).toEqual(interpret(bare, target, subject));
});
