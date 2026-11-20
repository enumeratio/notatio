// A compiled infinity is an answer only for a definition that writes it on purpose and cannot make one out of finite
// numbers (src/statistics/infinity.ts). The probes are small made-up definitions over a list of integers.

import { compileTyped, definitionHash } from "@notatio/engine/compiled";
import { bareEngine } from "@notatio/engine/testing";
import { expect, test } from "vite-plus/test";
import { ALL_STATISTICS } from "../src/statistics/all.ts";
import { COMPILED, compiledStatistic } from "../src/statistics/compiled.ts";
import { noVerdicts } from "../src/statistics/generate-compiled.ts";
import {
  compiledDefinitionsWithInfinity,
  infiniteAnswers,
  type FlaggedDefinition,
  renderCompiledTable,
} from "../src/statistics/infinity.ts";
import { type Definition, signatureOf } from "../src/statistics/types.ts";

const ce = bareEngine();
const list = (...items: number[]): unknown => ["List", ...items];

/** `expr` over a permutation's entries, `_x`: the empty list gives `otherwise`. */
const probe = (head: string, otherwise: unknown, expr: unknown, result?: string): Definition => ({
  head,
  on: "Permutation",
  expr: ["If", ["Equal", ["Length", "_x"], 0], otherwise, expr] as never,
  summary: "A probe.",
  ...(result === undefined ? {} : { result }),
});

const SUBJECTS = [list(), list(1), list(2, 1, 3)];
const subjectsOf = (): readonly unknown[] => SUBJECTS;
const build = (...definitions: Definition[]): FlaggedDefinition[] =>
  compiledDefinitionsWithInfinity(definitions, "list<integer>", subjectsOf, noVerdicts, () => true).compiled;

const smallest = ["Min", ["At", "_x", 1], ["Length", "_x"]];
const POSITIVE = probe("ProbeInfinityPlain", "PositiveInfinity", smallest);
const NEGATIVE = probe("ProbeInfinityNegative", "NegativeInfinity", smallest);
const WITH_DIVIDE = probe("ProbeInfinityDivide", "PositiveInfinity", [
  "Divide",
  ["Length", "_x"],
  ["Add", ["At", "_x", 1], -1],
]);
const NO_LITERAL = probe("ProbeInfinityNone", 0, smallest);
const INTEGER = probe("ProbeInfinityInteger", "PositiveInfinity", smallest, "integer");
const NEVER_INFINITE = probe("ProbeInfinityNever", "PositiveInfinity", smallest);

test("a definition that writes the literal and only adds, compares and takes extremes carries it", () => {
  expect(infiniteAnswers(ce, POSITIVE)).toEqual({ signs: ["PositiveInfinity"] });
  expect(infiniteAnswers(ce, NEGATIVE)).toEqual({ signs: ["NegativeInfinity"] });
});

test("a literal with a Divide, an Exp or a Power has no flag, and neither has a wide product or an unknown head", () => {
  expect(infiniteAnswers(ce, WITH_DIVIDE)).toMatchObject({ signs: [], failed: 3 });
  for (const head of ["Exp", "Power", "Ln", "Tan", "Gamma", "Factorial"])
    expect(infiniteAnswers(ce, probe("P", "PositiveInfinity", [head, ["Length", "_x"]])), head).toMatchObject({
      signs: [],
      failed: 3,
    });
  expect(infiniteAnswers(ce, probe("P", "PositiveInfinity", ["Multiply", 2, ["Length", "_x"]]))).toMatchObject({
    signs: [],
    failed: 4,
  });
  expect(infiniteAnswers(ce, probe("P", "PositiveInfinity", ["Unclassified", 2]))).toMatchObject({
    signs: [],
    failed: 3,
  });
});

test("a result type that does not admit the infinity, or no literal at all, leaves the flag off", () => {
  expect(infiniteAnswers(ce, INTEGER)).toMatchObject({ signs: [], failed: 1 });
  expect(infiniteAnswers(ce, NO_LITERAL)).toMatchObject({ signs: [], failed: 2 });
});

test("the build flags a definition whose compiled infinity the interpreter shares, and only that one", () => {
  const entries = build(POSITIVE, NEGATIVE, WITH_DIVIDE, NO_LITERAL, INTEGER);
  const flags = Object.fromEntries(entries.map((e) => [e.signature, e.infinite]));
  expect(flags["ProbeInfinityPlain@Permutation"]).toEqual(["PositiveInfinity"]);
  expect(flags["ProbeInfinityNegative@Permutation"]).toEqual(["NegativeInfinity"]);
  for (const head of ["Divide", "None", "Integer"])
    expect(flags[`ProbeInfinity${head}@Permutation`], head).toBeUndefined();
});

test("a flag without an infinite subject behind it is not given", () => {
  const withoutInfinity = compiledDefinitionsWithInfinity(
    [NEVER_INFINITE],
    "list<integer>",
    () => [list(1)],
    noVerdicts,
    () => true,
  );
  expect(withoutInfinity.compiled).toHaveLength(1);
  expect(withoutInfinity.compiled[0]!.infinite).toBeUndefined();
});

test("the table carries the flag per entry", () => {
  const text = renderCompiledTable(build(POSITIVE, WITH_DIVIDE));
  expect(text).toContain('infinite: ["PositiveInfinity"]');
  expect(text.match(/infinite:/g)).toHaveLength(1);
});

/** Put the probe's compiled code in the table, with the flag given (or none), and ask it. */
function compiledAnswers(
  definition: Definition,
  infinite?: FlaggedDefinition["infinite"],
): (subject: unknown) => unknown {
  const code = compileTyped(ce, definition.expr, { _x: "list<integer>" });
  expect(code).toBeDefined();
  COMPILED[signatureOf(definition)] = {
    hash: definitionHash(definition.expr),
    ...(infinite === undefined ? {} : { infinite }),
    run: (_sys: never, vars: Record<string, unknown>) => code!.run(vars),
  };
  return compiledStatistic(ce, definition)!;
}

test("compiled code answers its infinity only for a statistic that carries the flag", () => {
  const flagged = compiledAnswers(POSITIVE, build(POSITIVE)[0]!.infinite);
  expect(flagged(list())).toBe("PositiveInfinity");
  expect(flagged(list(2, 1, 3))).toBe(2);
  const unflagged = compiledAnswers(POSITIVE);
  expect(unflagged(list())).toBeUndefined();
  expect(unflagged(list(2, 1, 3))).toBe(2);
  // A sign it does not list declines too.
  expect(compiledAnswers(NEGATIVE, ["PositiveInfinity"])(list())).toBeUndefined();
  for (const definition of [POSITIVE, NEGATIVE]) delete COMPILED[signatureOf(definition)];
});

test("a definition with the literal and a Divide has no flag, and its compiled infinity still declines", () => {
  // The compiled code divides by zero and gives Infinity where the interpreter gives ComplexInfinity.
  const entry = build(WITH_DIVIDE)[0];
  expect(entry?.infinite).toBeUndefined();
  const run = compiledAnswers(WITH_DIVIDE, entry?.infinite);
  expect(run(list(1))).toBeUndefined();
  delete COMPILED[signatureOf(WITH_DIVIDE)];
});

test("the statistics that write an infinity, and the rule each fails", () => {
  const verdicts = ALL_STATISTICS.map((d) => [signatureOf(d), infiniteAnswers(ce, d)] as const)
    .filter(([, verdict]) => !("failed" in verdict) || verdict.failed !== 2)
    .map(([signature, verdict]) => [signature, "failed" in verdict ? verdict.failed : verdict.signs.join(", ")]);
  // Every one fails rule 3 or 4 today; a statistic that gets the flag is a change to read here.
  expect(Object.fromEntries(verdicts)).toEqual({
    "CornerAlgebraDominantDimension@DyckPath": 3,
    "CyclicNakayamaGlobalDimension@DyckPath": 4,
    "CyclicNakayamaDominantDimension@DyckPath": 4,
    "ProtectionNumber@OrderedTree": 3,
    "OneProtectedNodeCount@OrderedTree": 3,
    "TwoProtectedNodeCount@OrderedTree": 3,
    "MaximumDistance@LabeledGraph": 4,
    "MinimumEccentricity@LabeledGraph": 4,
    "Girth@LabeledGraph": 4,
  });
});
