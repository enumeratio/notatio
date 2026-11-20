import { bareEngine, createEngine } from "@notatio/engine/testing";
import { expect, test } from "vite-plus/test";
import { declareCollections } from "../src/library.ts";

// An override of a compute-engine head agrees with the native head wherever the native head
// answers: an answer does not depend on which packages are declared. A difference on purpose
// is listed in DELIBERATE or AGREE with its reason; nothing else may differ.

const bare = bareEngine();
const declared = createEngine(declareCollections);

type Json = unknown;
type Call = readonly unknown[];

const range = (...bounds: number[]): Json => ["Range", ...bounds];
const double: Json = ["Function", ["Multiply", "x", 2], "x"];
const list: Json = ["List", 5, 3, 9, 1, 3];

/** Operands: lists and ranges, and the lazy collections built over each. */
const operands: Record<string, Json> = {
  list,
  asc: range(1, 5),
  desc: range(5, 1, -1),
  step: range(1, 9, 2),
};
for (const [name, c] of Object.entries({ ...operands })) {
  operands[`take(${name})`] = ["Take", c, 3];
  operands[`drop(${name})`] = ["Drop", c, 1];
  operands[`map(${name})`] = ["Map", double, c];
  operands[`filter(${name})`] = ["Filter", c, ["Function", ["Greater", "x", 2], "x"]];
  operands[`reverse(${name})`] = ["Reverse", c];
}
operands.empty = ["List"];
operands.emptyTake = ["Take", list, 0];
operands.emptyFilter = ["Filter", list, ["Function", ["Greater", "x", 99], "x"]];
operands.emptyRange = range(3, 1);
operands.tied = ["Map", ["Function", ["Mod", "x", 2], "x"], range(1, 6)];
operands.tiedTake = ["Take", ["List", 2, 2, 5, 5, 5], 4];
operands.singleton = ["List", 7];
operands.nested = ["List", ["List", 3, 1], ["List", 2], ["List", 1, 2, 3]];
operands.matrix = ["List", ["List", 1, 2], ["List", 3, 4]];
operands.words = ["List", "'pear'", "'fig'", "'apple'"];
operands.string = "'hello'";

const PARTITION_SIZE = 2;

/** Each overridden head's calls on an operand, with its other arguments. */
const calls: Record<string, (c: Json) => Call[]> = {
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
const DELIBERATE: readonly { readonly why: string; readonly skip: (call: Call) => boolean }[] = [
  { why: "Part[c, 0] is the head; the native is NaN", skip: (call) => call[0] === "At" && call[2] === 0 },
  {
    why: "At(c, rows, columns) is Wolfram's submatrix; the native reads the index lists as a path",
    skip: (call) => call[0] === "At" && Array.isArray(call[2]),
  },
  {
    why: "a trailing integer is Join's level, which a List operand takes",
    skip: (call) => call[0] === "Join" && call.length === 4 && (call[1] as Call)[0] === "List",
  },
  {
    why: "Rank is Wolfram's ArrayDepth: a string is 0 and a ragged list is a vector",
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
const AGREE: Record<string, (reference: string, ours: string) => boolean> = {
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

/** The evaluated answer as JSON, or `undefined` where the engine declines or errors. */
const answer = (ce: typeof bare, expr: Call): string | undefined => {
  try {
    const result = ce.box(expr as never).evaluate();
    const json = JSON.stringify(result.json);
    return json.includes('"Error"') || result.operator === expr[0] ? undefined : json;
  } catch {
    return undefined;
  }
};

const same = (head: string, reference: string, ours: string | undefined): boolean =>
  ours !== undefined && (AGREE[head]?.(reference, ours) ?? ours === reference);

test("an overridden head agrees with the native head wherever the native head answers", () => {
  const misfires: string[] = [];
  for (const [head, build] of Object.entries(calls)) {
    for (const [name, operand] of Object.entries(operands)) {
      for (const call of build(operand)) {
        if (DELIBERATE.some((d) => d.skip(call))) continue;
        const native = answer(bare, call);
        if (native === undefined) continue;
        const ours = answer(declared, call);
        if (!same(head, native, ours)) {
          misfires.push(`${head} ${name}: ${JSON.stringify(call)}\n    native   ${native}\n    declared ${ours}`);
        }
      }
    }
  }
  expect(misfires.join("\n")).toBe("");
});

// The override reads a lazy collection's elements, not its call's arguments, so it answers a lazy
// collection as it answers the List of those elements (or declines).
test("an overridden head answers a lazy collection as it answers the list of its elements", () => {
  const misfires: string[] = [];
  const lazy = /^(take|drop|map|filter|reverse)\(|^(asc|desc|step|empty(Take|Filter|Range)|tied(Take)?)$/;
  for (const [head, build] of Object.entries(calls)) {
    if (head === "Rank" || head === "Length") continue;
    for (const [name, operand] of Object.entries(operands)) {
      if (!lazy.test(name)) continue;
      const elements = [
        ...(bare.box(operand as never).evaluate() as unknown as { each(): Iterable<{ json: Json }> }).each(),
      ];
      const asList: Json = ["List", ...elements.map((e) => e.json)];
      const listCalls = build(asList);
      build(operand).forEach((call, i) => {
        if (DELIBERATE.some((d) => d.skip(call))) return;
        // The native At, or First without a default, of an empty lazy collection is NaN, and of an empty list Missing.
        if (name.startsWith("empty") && (head === "At" || ((head === "First" || head === "Last") && call.length === 2)))
          return;
        const reference = answer(declared, listCalls[i]);
        const ours = answer(declared, call);
        if (reference !== undefined && ours !== undefined && !same(head, reference, ours)) {
          misfires.push(`${head} ${name}: ${JSON.stringify(call)}\n    list     ${reference}\n    declared ${ours}`);
        }
      });
    }
  }
  expect(misfires.join("\n")).toBe("");
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
