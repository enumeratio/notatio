// A compiled infinity is an answer only for a definition that writes it on purpose and cannot make one out of finite
// numbers (src/statistics/infinity.ts). The probes are small made-up definitions over a list of integers.

import { compileTyped, definitionHash } from "@notatio/engine/compiled";
import { bareEngine } from "@notatio/engine/testing";
import { expect, test } from "vite-plus/test";
import { ALL_STATISTICS } from "../src/statistics/all.ts";
import { COMPILED, compiledStatistic } from "../src/statistics/compiled.ts";
import { noVerdicts, type Verdicts } from "../src/statistics/generate-compiled.ts";
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

test("a literal with a Divide, an Exp or another pole has no flag, and neither has an unknown head", () => {
  expect(infiniteAnswers(ce, WITH_DIVIDE)).toMatchObject({ signs: [], failed: 3 });
  for (const head of ["Exp", "Ln", "Tan", "Gamma", "Factorial"])
    expect(infiniteAnswers(ce, probe("P", "PositiveInfinity", [head, ["Length", "_x"]])), head).toMatchObject({
      signs: [],
      failed: 3,
    });
  expect(infiniteAnswers(ce, probe("P", "PositiveInfinity", ["Unclassified", 2]))).toMatchObject({
    signs: [],
    failed: 3,
  });
});

const INF = "PositiveInfinity";
const flagged = (expr: unknown, definition: Partial<Definition> = {}) =>
  infiniteAnswers(ce, { ...probe("P", INF, expr), ...definition });
const first = ["At", "_x", 1];
const indicator = (test: unknown) => ["If", test, 1, 0];
/** A fold over the entries of `_x` whose step is `step` of the accumulator `a` and the entry `b`. */
const folded = (step: unknown) => ["Fold", ["Function", step, "a", "b"], 1, ["Map", ["Function", "i", "i"], "_x"]];

test("rule 4: a product or power that can grow without limit turns the flag off", () => {
  // The accumulator scaled by a literal or by a name: 2^k, and a factorial.
  expect(flagged(folded(["Multiply", 2, "a"]))).toMatchObject({ signs: [], failed: 4 });
  expect(flagged(folded(["Multiply", "a", "b"]))).toMatchObject({ signs: [], failed: 4 });
  expect(flagged(folded(["Power", "a", 2]))).toMatchObject({ signs: [], failed: 4 });
  // A recursive result: n * self(n - 1).
  const recursive = (combine: unknown) => [
    ["Function", ["If", ["Equal", "t", 0], INF, combine], "self", "t"],
    ["Function", ["If", ["Equal", "t", 0], INF, combine], "self", "t"],
    first,
  ];
  expect(
    infiniteAnswers(ce, probe("P", INF, recursive(["Multiply", "t", ["self", "self", ["Subtract", "t", 1]]]))),
  ).toMatchObject({
    signs: [],
    failed: 4,
  });
  // A name bound to a recursive result is as tainted as the result.
  const bound = ["Apply", ["Function", ["Multiply", "r", "r"], ["Typed", "r", "'integer'"]], ["self", "self", first]];
  expect(flagged(bound)).toMatchObject({ signs: [], failed: 4 });
  // A power that is not a literal base to a size-bounded exponent, and two factors that are neither literal nor indicator.
  expect(flagged(["Power", first, ["Length", "_x"]])).toMatchObject({ signs: [], failed: 4 });
  expect(flagged(["Power", 2, ["Multiply", first, first]])).toMatchObject({ signs: [], failed: 4 });
  expect(flagged(["Multiply", first, ["Length", "_x"]])).toMatchObject({ signs: [], failed: 4 });
  // The 2^53 rule is another obligation: a Floor and a Product are not classified as safe either.
  expect(flagged(["Product", ["Range", 1, first]])).toMatchObject({ signs: [], failed: 4 });
});

test("rule 4: what cannot grow keeps the flag", () => {
  const entries = (v: unknown) => expect(flagged(v)).toEqual({ signs: [INF] });
  entries(["Multiply", 2, ["Length", "_x"]]);
  entries(["Multiply", indicator(["Less", first, 2]), indicator(["Equal", first, 1]), ["Length", "_x"]]);
  entries(["Power", 2, ["Subtract", ["Length", "_x"], 1]]);
  entries(["Mod", first, ["Length", "_x"]]);
  entries(folded(["Min", "a", ["Add", "a", "b"]]));
  entries(folded(["Multiply", indicator(["Less", "b", 2]), "a"]));
  entries(["Filter", ["Map", ["Function", "i", "i"], "_x"], ["Function", ["Greater", ["Multiply", "i", 2], 1], "i"]]);
  // A recursive result may be added, minimized and compared.
  const recursive = [
    ["Function", ["If", ["Equal", "t", 0], INF, ["Add", 1, ["Min", ["self", "self", "t"], 3]]], "self", "t"],
    ["Function", ["If", ["Equal", "t", 0], INF, ["Add", 1, ["Min", ["self", "self", "t"], 3]]], "self", "t"],
    first,
  ];
  entries(recursive);
});

test("a definition whose where and intermediates keep its numbers under 2^53 needs no walk for rule 4", () => {
  const power = ["Multiply", first, ["Length", "_x"]];
  expect(flagged(power)).toMatchObject({ failed: 4 });
  expect(flagged(power, { where: ["LessEqual", ["Length", "_x"], 12] })).toMatchObject({ failed: 4 });
  expect(flagged(power, { where: ["LessEqual", ["Length", "_x"], 12], intermediates: "at most 12 * 12" })).toEqual({
    signs: [INF],
  });
  // A pole is not an overflow: the bound does not hold it.
  expect(
    flagged(["Divide", 1, first], { where: ["LessEqual", ["Length", "_x"], 12], intermediates: "1" }),
  ).toMatchObject({
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

/** The `source` and `parts` of every cross-check the build asks `verdicts` for, by label. */
function keysOf(...definitions: Definition[]): Record<string, string> {
  const seen: Record<string, string> = {};
  const recording: Verdicts = {
    sourceOnly: false,
    remember: (parts, source, compute, label) => {
      seen[label] = JSON.stringify({ parts, source });
      return compute();
    },
    note: () => {},
  };
  compiledDefinitionsWithInfinity(definitions, "list<integer>", subjectsOf, recording, () => true);
  return seen;
}

test("a change to a flagged definition, to its where or to its intermediates restales its (infinite) row", () => {
  const label = "ProbeInfinityPlain@Permutation (infinite)";
  const before = keysOf(POSITIVE)[label];
  expect(before).toBeDefined();
  // The same head and subjects, a different definition: only its own hash tells them apart.
  const changed = probe("ProbeInfinityPlain", "PositiveInfinity", ["Min", ["At", "_x", 1], ["Length", "_x"], 7]);
  expect(infiniteAnswers(ce, changed)).toEqual({ signs: ["PositiveInfinity"] });
  expect(keysOf(changed)[label]).not.toBe(before);
  expect(keysOf(POSITIVE)[label]).toBe(before);
  // The bound and its statement are in the key too.
  const bounded = { ...POSITIVE, where: ["LessEqual", ["Length", "_x"], 9] as never };
  expect(keysOf(bounded)[label]).not.toBe(before);
  expect(keysOf({ ...bounded, intermediates: "3" })[label]).not.toBe(keysOf(bounded)[label]);
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
  // The three graph statistics and the two ordered-tree counts pass the rules (the build then flags those with an infinite
  // subject); the Dyck-path ones divide, and ProtectionNumber's flat alternative uses a head that is not classified.
  expect(Object.fromEntries(verdicts)).toEqual({
    "CornerAlgebraDominantDimension@DyckPath": 3,
    "CyclicNakayamaGlobalDimension@DyckPath": 3,
    "CyclicNakayamaDominantDimension@DyckPath": 3,
    "ProtectionNumber@OrderedTree": 3,
    "OneProtectedNodeCount@OrderedTree": "PositiveInfinity",
    "TwoProtectedNodeCount@OrderedTree": "PositiveInfinity",
    "MaximumDistance@LabeledGraph": "PositiveInfinity",
    "MinimumEccentricity@LabeledGraph": "PositiveInfinity",
    "Girth@LabeledGraph": "PositiveInfinity",
  });
});
