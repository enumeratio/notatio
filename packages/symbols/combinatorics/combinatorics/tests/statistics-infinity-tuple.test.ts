// A tuple accumulator is tainted component by component (src/statistics/infinity.ts): a count that never meets the
// infinity seed is clean beside a distance seeded with it. The probes are small made-up definitions over a list of integers.

import { definitionHash, compileTyped } from "@notatio/engine/compiled";
import { bareEngine } from "@notatio/engine/testing";
import { evaluateEpsilRepeatedly } from "@notatio/structures";
import { expect, test } from "vite-plus/test";
import { ALL_STATISTICS } from "../src/statistics/all.ts";
import { COMPILED, compiledStatistic } from "../src/statistics/compiled.ts";
import { noVerdicts } from "../src/statistics/generate-compiled.ts";
import { compiledDefinitionsWithInfinity, infiniteAnswers } from "../src/statistics/infinity.ts";
import { type Definition, signatureOf } from "../src/statistics/types.ts";

const ce = bareEngine();
const INF = "PositiveInfinity";
const list = (...items: number[]): unknown => ["List", ...items];

/** `expr` over the entries of `_x`, with no empty-list guard: the empty list leaves the distance at its seed. */
const bare = (head: string, expr: unknown): Definition => ({
  head,
  on: "Permutation",
  expr: expr as never,
  summary: "A probe.",
});
const flagged = (expr: unknown) => infiniteAnswers(ce, bare("P", expr));

const INFINITY_SEED = ["List", 0, INF];
const entries = ["Map", ["Function", "i", "i"], "_x"];
/** The component `index` of a fold over the entries of `_x` whose step is `step` (a literal list, or any expression). */
const fold = (step: unknown, seed: unknown = INFINITY_SEED, index = 2) => [
  "At",
  ["Fold", ["Function", Array.isArray(step) && step[0] !== "If" ? ["List", ...step] : step, "a", "b"], seed, entries],
  index,
];
const count = ["At", "a", 1];
const distance = ["At", "a", 2];
/** A count that grows by an indicator on the distance, beside a distance that is a `Min`. */
const COUNT_AND_DISTANCE = [
  ["Add", count, ["If", ["Less", distance, 3], 1, 0]],
  ["Min", distance, "b"],
];

/** A step whose count reads the count twice: two operands from the accumulator, fine only while the count is clean. */
const WITH_TWO_COUNT_READS = [
  ["Add", count, ["Max", count, 1]],
  ["Min", distance, "b"],
];

test("a count that never meets the infinity seed is clean, and a condition on the distance does not taint its branches", () => {
  // The count adds an operand that reads the distance only in its condition: the branches' values are 1 and 0.
  expect(flagged(fold(COUNT_AND_DISTANCE))).toEqual({ signs: [INF] });
  expect(
    flagged(
      fold([
        ["Add", count, ["At", "b", 1]],
        ["Min", distance, "b"],
      ]),
    ),
  ).toEqual({ signs: [INF] });
});

test("taint follows each component's own expression: a read of the distance, in a branch or an operand, taints the count", () => {
  // The count's step reads the distance: it is tainted, and adds itself to a tainted operand.
  expect(
    flagged(
      fold([
        ["Add", count, distance],
        ["Min", distance, "b"],
      ]),
    ),
  ).toMatchObject({ signs: [], failed: 4 });
  // A branch's value is tainted by what the branch reads.
  expect(
    flagged(
      fold([
        ["Add", count, ["If", ["Less", "b", 3], distance, 0]],
        ["Min", distance, "b"],
      ]),
    ),
  ).toMatchObject({ signs: [], failed: 4 });
  // A count seeded with the infinity is tainted from the start: it keeps the flag only where it is clean.
  expect(flagged(fold(WITH_TWO_COUNT_READS))).toEqual({ signs: [INF] });
  expect(flagged(fold(WITH_TWO_COUNT_READS, ["List", INF, INF]))).toMatchObject({ signs: [], failed: 4 });
});

test("a tuple the analysis cannot see whole taints every component", () => {
  // A whole-tuple read passed to another head.
  expect(flagged(fold([WITH_TWO_COUNT_READS[0], ["Min", distance, "b", ["Length", "a"]]]))).toMatchObject({
    signs: [],
    failed: 4,
  });
  // A computed index.
  expect(flagged(fold([WITH_TWO_COUNT_READS[0], ["Min", ["At", "a", ["Length", "_x"]], "b"]]))).toMatchObject({
    signs: [],
    failed: 4,
  });
  // A tuple written by something other than a literal list.
  const chosen = ["If", ["Less", "b", 3], ["List", ...WITH_TWO_COUNT_READS], ["List", 0, distance]];
  expect(flagged(fold(chosen))).toMatchObject({ signs: [], failed: 4 });
  // A seed that is not a literal list.
  expect(flagged(fold(WITH_TWO_COUNT_READS, ["Tuple", 0, INF]))).toMatchObject({ signs: [], failed: 4 });
});

test("law: a definition the narrowing keeps flagged is compiled equal to interpreted, the seed exercised beside the clean count", () => {
  const probes = [
    bare("ProbeTupleDistance", fold(COUNT_AND_DISTANCE)),
    bare("ProbeTupleCount", fold(COUNT_AND_DISTANCE, INFINITY_SEED, 1)),
  ];
  // The empty list leaves the distance at its seed.
  const subjects = [list(), list(1), list(2, 1, 3), list(5, 4, 3, 2, 1), list(1, 1, 1)];
  const built = compiledDefinitionsWithInfinity(
    probes,
    "list<integer>",
    () => subjects,
    noVerdicts,
    () => true,
  ).compiled;
  const flags = Object.fromEntries(built.map((e) => [e.signature, e.infinite]));
  // The distance is infinite on the empty list, compiled and interpreted alike, so the build flags it. The count is
  // finite everywhere, so nothing backs a flag for it.
  expect(flags["ProbeTupleDistance@Permutation"]).toEqual([INF]);
  expect(flags["ProbeTupleCount@Permutation"]).toBeUndefined();
  for (const probe of probes) {
    expect(infiniteAnswers(ce, probe)).toEqual({ signs: [INF] });
    const code = compileTyped(ce, probe.expr, { _x: "list<integer>" });
    expect(code).toBeDefined();
    COMPILED[signatureOf(probe)] = {
      hash: definitionHash(probe.expr),
      infinite: [INF],
      run: (_sys: never, vars: Record<string, unknown>) => code!.run(vars),
    };
    const run = compiledStatistic(ce, probe)!;
    for (const subject of subjects)
      expect(run(subject), `${probe.head} ${JSON.stringify(subject)}`).toEqual(
        evaluateEpsilRepeatedly(ce, probe.expr, { _x: subject }),
      );
    delete COMPILED[signatureOf(probe)];
  }
});

test("law: the protected-node counts answer a count on a single leaf and an empty forest, the distance's infinity left behind", () => {
  // `nearestLeafCounts` carries [count, distance], seeded [0, PositiveInfinity]; a leaf's pair is [k, 0]. A single leaf and
  // a root with one child leave the distance infinite in the fold. Compiled code, where an entry exists, answers as the interpreter.
  const subjects = [["List"], ["List", ["List"]], ["List", ["List"], ["List"]], ["List", ["List", ["List"]]]];
  const expected: Record<string, number[]> = {
    OneProtectedNodeCount: [0, 1, 1, 1],
    TwoProtectedNodeCount: [0, 0, 0, 1],
  };
  for (const head of ["OneProtectedNodeCount", "TwoProtectedNodeCount"]) {
    const definition = ALL_STATISTICS.find((d) => d.head === head)!;
    expect(infiniteAnswers(ce, definition)).toEqual({ signs: [INF] });
    subjects.forEach((subject, i) => {
      const answer = evaluateEpsilRepeatedly(ce, definition.expr, { _x: subject });
      expect(answer, `${head} ${JSON.stringify(subject)}`).toBe(expected[head]![i]);
      if (signatureOf(definition) in COMPILED)
        expect(compiledStatistic(ce, definition)?.(subject) ?? answer).toBe(answer);
    });
  }
});
