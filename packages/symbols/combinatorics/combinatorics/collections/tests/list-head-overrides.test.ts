import { expect, test } from "vite-plus/test";
import {
  type Agree,
  answer,
  type Call,
  type CallBuilders,
  declared,
  type Deliberate,
  lazyMisfires,
  nativeMisfires,
  range,
} from "./override-differential.ts";

// An override of a compute-engine head agrees with the native head wherever the native head
// answers: an answer does not depend on which packages are declared. A difference on purpose
// is listed in DELIBERATE or AGREE with its reason; nothing else may differ.

const PARTITION_SIZE = 2;

/** Each overridden head's calls on an operand, with its other arguments. */
const calls: CallBuilders = {
  First: (c) => [
    ["First", c],
    ["First", c, 0],
  ],
  Last: (c) => [
    ["Last", c],
    ["Last", c, 0],
  ],
  Ordering: (c) => [
    ["Ordering", c],
    ["Ordering", c, 2],
    ["Ordering", c, -2],
    ["Ordering", c, ["List", 1, 2]],
    ["Ordering", c, "All", "Greater"],
  ],
  Mean: (c) => [["Mean", c]],
  Median: (c) => [["Median", c]],
  Sort: (c) => [["Sort", c]],
  Union: (c) => [
    ["Union", c],
    ["Union", c, ["List", 1, 2]],
  ],
  Length: (c) => [["Length", c]],
  At: (c) => [
    ["At", c, 0],
    ["At", c, 2],
    ["At", c, ["Span", 2, 3]],
    ["At", c, ["Span", 1, -1, 2]],
    ["At", c, "All", 1],
    ["At", c, ["List", 1, 2], ["List", 1]],
  ],
  Partition: (c) => [["Partition", c, PARTITION_SIZE]],
  Join: (c) => [
    ["Join", c, c],
    ["Join", c, ["List", 1]],
    ["Join", c, c, 2],
  ],
  Commonest: (c) => [["Commonest", c]],
  Position: (c) => [["Position", c, 3]],
  Rank: (c) => [["Rank", c]],
  Append: (c) => [["Append", c, 4]],
  SetMinus: (c) => [["SetMinus", c, ["List", 3]]],
};

/** Calls the override answers differently on purpose, each with its reason. */
const DELIBERATE: readonly Deliberate[] = [
  { why: "Part[c, 0] is the head; the native is NaN", skip: (call) => call[0] === "At" && call[2] === 0 },
  {
    why: "At(c, rows, columns) is Wolfram's submatrix; the native reads the index lists as a path",
    skip: (call) => call[0] === "At" && Array.isArray(call[2]),
  },
  {
    why: "a trailing integer is Wolfram's Join level; the native has no level and joins the integer as one more element",
    skip: (call) => call[0] === "Join" && call.length === 4 && (call[1] as Call)[0] === "List",
  },
  {
    why: "Rank carries Wolfram's ArrayDepth for now (a string is 0, a ragged list a vector); the override audit on the wiki's Compute-Engine-Overrides recommends moving that to a head named ArrayDepth and returning Rank to compute-engine's tensor rank, still open",
    skip: (call) => call[0] === "Rank" && (typeof call[1] === "string" || (call[1] as Call)[0] === "List"),
  },
  {
    why: "a string is atomic to Length (0), not its character count",
    skip: (call) => call[0] === "Length" && typeof call[1] === "string",
  },
];

const elementsOf = (json: string): string[] =>
  json === '"EmptySet"' ? [] : (JSON.parse(json) as unknown[]).slice(1).map((e) => JSON.stringify(e));

/** Heads whose answers agree up to a deliberate difference, with the reason. */
const AGREE: Agree = {
  // Wolfram's Union sorts and keeps its argument's head; the native keeps first-seen order in a Set.
  Union: (reference, ours) =>
    JSON.stringify(elementsOf(reference).toSorted()) === JSON.stringify(elementsOf(ours).toSorted()),
  // Wolfram's Partition drops the ragged tail; the native keeps it.
  Partition: (reference, ours) => {
    const chunks = (JSON.parse(reference) as unknown[]).slice(1);
    const last = chunks[chunks.length - 1];
    const size = typeof last === "string" ? last.length - 2 : ((last as unknown[] | undefined)?.length ?? 1) - 1;
    return (
      ours ===
      JSON.stringify(["List", ...(chunks.length > 0 && size === PARTITION_SIZE ? chunks : chunks.slice(0, -1))])
    );
  },
};

test("an overridden head agrees with the native head wherever the native head answers", () => {
  expect(nativeMisfires(calls, { deliberate: DELIBERATE, agree: AGREE })).toBe("");
});

// The override reads a lazy collection's elements, not its call's arguments, so it answers a lazy
// collection as it answers the List of those elements (or declines).
test("an overridden head answers a lazy collection as it answers the list of its elements", () => {
  const { Rank: _rank, Length: _length, ...builders } = calls;
  expect(
    lazyMisfires(builders, {
      deliberate: DELIBERATE,
      // Ours follows native: At, or First/Last without a default, of an empty collection is NaN for a
      // numeric element type (an empty lazy `Take` of a numeric list) and Missing otherwise (`[]` has none).
      skipOperand: (head, name, call) =>
        name.startsWith("empty") && (head === "At" || ((head === "First" || head === "Last") && call.length === 2)),
    }),
  ).toBe("");
});

test("Join's trailing integer is a level: past the operands' depth the call stays unevaluated", () => {
  // `answer` is undefined for a call that stays unevaluated (not the native append).
  for (const level of [7, 2, 0]) {
    expect(answer(declared, ["Join", ["List", 1, 2], ["List", 3], level])).toBeUndefined();
  }
  expect(answer(declared, ["Join", ["List", ["List", 1], ["List", 2]], ["List", ["List", 3]], 2])).toBe(
    '["List",["List",1,3],["List",2]]',
  );
});

test("Ordering reads a lazy collection's elements", () => {
  expect(answer(declared, ["Ordering", range(4, 1, -1)])).toBe('["List",4,3,2,1]');
  expect(answer(declared, ["Ordering", ["Take", ["List", 9, 8, 7], 2]])).toBe('["List",2,1]');
});
