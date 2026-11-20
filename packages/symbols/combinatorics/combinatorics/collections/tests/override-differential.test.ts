import { expect, test } from "vite-plus/test";
import {
  type CallBuilders,
  type Deliberate,
  type Json,
  lazyMisfires,
  nativeMisfires,
  type Options,
  operands,
} from "./override-differential.ts";

// The override differential (see override-differential.ts) for the compute-engine heads the other
// override files wrap or widen: list-stats, list-levels, list-ops-wolfram, list-functional,
// operator-forms, expression-ops, rounding-heads and arith-heads. list-heads.ts has its own test.

const double: Json = ["Function", ["Multiply", "x", 2], "x"];
const odd: Json = ["Function", ["Equal", ["Mod", "x", 2], 1], "x"];
const lessEqual: Json = ["Function", ["LessEqual", "a", "b"], "a", "b"];
const sameParity: Json = ["Function", ["Equal", ["Mod", ["Subtract", "a", "b"], 2], 0], "a", "b"];

/** Heads over scalars or expressions: tried on one operand, not on every collection. */
const once =
  (...calls: unknown[][]) =>
  (c: Json): unknown[][] =>
    c === operands.list ? calls : [];

// list-stats.ts: Mean, Median, Commonest(c, n), Mode, Unique(c, test)
const stats: CallBuilders = {
  Mean: (c) => [["Mean", c]],
  Median: (c) => [["Median", c]],
  Commonest: (c) => [
    ["Commonest", c, 2],
    ["Commonest", c, ["UpTo", 2]],
  ],
  Mode: (c) => [["Mode", c]],
  Unique: (c) => [
    ["Unique", c],
    ["Unique", c, sameParity],
  ],
};

// list-levels.ts: Partition's block and overhang forms, Flatten's depth and dimension forms
const levels: CallBuilders = {
  Partition: (c) => [
    ["Partition", c, ["List", 2], 1],
    ["Partition", c, 2, 1],
    ["Partition", c, 2, 1, ["List", 1, 1]],
    ["Partition", c, 2, 1, 1],
  ],
  Flatten: (c) => [
    ["Flatten", c],
    ["Flatten", c, 1],
    ["Flatten", c, "PositiveInfinity"],
    ["Flatten", c, ["List", ["List", 2], ["List", 1]]],
  ],
};

// list-ops-wolfram.ts, list-functional.ts and misc-frontier.ts: Sort(c, p), Any/All(c, p), and the
// heads list-heads.ts already covers
const wolfram: CallBuilders = {
  Sort: (c) => [["Sort", c, lessEqual]],
  Any: (c) => [["Any", c, odd]],
  All: (c) => [["All", c, odd]],
  FixedPoint: once(["FixedPoint", ["Function", ["Floor", ["Divide", "x", 2]], "x"], 100]),
};

// operator-forms.ts: Map, Fold and Filter, widened to take their operator form
const forms: CallBuilders = {
  Map: (c) => [["Map", double, c]],
  Filter: (c) => [["Filter", c, odd]],
  Fold: (c) => [["Fold", ["Function", ["Add", "a", "b"], "a", "b"], c]],
};

// expression-ops.ts, rounding-heads.ts and arith-heads.ts: scalar and expression heads
const scalars: CallBuilders = {
  Same: (c) => [["Same", c, c]],
  Symbol: once(["Symbol", "'abc'"], ["Symbol", 3]),
  ReplaceAll: once(
    ["ReplaceAll", ["List", "x", ["Power", "x", 2]], ["Rule", ["Power", "x", 2], "y"]],
    ["ReplaceAll", ["Add", "x", 1], ["Rule", "x", 2]],
  ),
  Chop: once(["Chop", 0.00000000001], ["Chop", 0.5, 0.01], ["Chop", 0.001, 0.01]),
  Clamp: once(["Clamp", 5, 0, 3], ["Clamp", 5, 0, 3, -1, 10], ["Clamp", -2, 0, 3, -1, 10]),
  Min: once(["Min", 3, 1, 2], ["Min"]),
  Rationalize: once(["Rationalize", 0.5], ["Rationalize", 0.1, 0], ["Rationalize", 0.333, 0.01]),
  Sign: once(["Sign", -3], ["Sign", ["Subtract", ["Sqrt", 2], ["Divide", 14142, 10000]]]),
  Product: once(["Product", ["Power", "i", 2], ["Tuple", "i", 1, 4]], ["Product", "i", ["Tuple", "i", 1, 4]]),
};

/** Calls the override answers differently on purpose, each with its reason. */
const DELIBERATE: readonly Deliberate[] = [
  {
    why: "a predicate that holds neither way puts elements in reverse input order, as Wolfram's Sort does; the native leaves a nested list unsorted",
    skip: (call) => call[0] === "Sort" && call.length === 3,
  },
  {
    why: "a compound left side replaces any part of the expression, as /. does; the native replaces a symbol or the whole",
    skip: (call) => call[0] === "ReplaceAll",
  },
];

const files: Record<string, { builders: CallBuilders; skipOperand?: Options["skipOperand"] }> = {
  "list-stats": { builders: stats },
  "list-levels": { builders: levels },
  "list-ops-wolfram and list-functional": { builders: wolfram },
  "operator-forms": {
    builders: forms,
    // Native follows the element type: Fold of an empty lazy collection of numbers is NaN, and Missing for `[]`.
    skipOperand: (head, name) => head === "Fold" && name.startsWith("empty"),
  },
  "expression-ops, rounding-heads and arith-heads": { builders: scalars },
};

for (const [file, { builders, skipOperand }] of Object.entries(files)) {
  test(`${file}: an overridden head agrees with the native head wherever the native head answers`, () => {
    expect(nativeMisfires(builders, { deliberate: DELIBERATE, skipOperand })).toBe("");
  });

  test(`${file}: an overridden head answers a lazy collection as it answers the list of its elements`, () => {
    expect(lazyMisfires(builders, { deliberate: DELIBERATE, skipOperand })).toBe("");
  });
}
