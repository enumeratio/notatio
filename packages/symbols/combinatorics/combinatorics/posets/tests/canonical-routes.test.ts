// The routes to a canonical form agree: the kernel, the Epsil body interpreted and compiled, and the engine's heads
// through evaluate() and .N(); and past the sizes the kernel carries, the heads decline with a message.
import { collectMessages } from "@notatio/engine";
import { compileTyped } from "@notatio/engine/compiled";
import { bareEngine } from "@notatio/engine/testing";
import { expect, test } from "vite-plus/test";
import { CARRIERS, declareCombinatorics, declareMaps, evaluateDefinition, MAPS } from "../../src/index.ts";
import { posets } from "../src/families/posets.ts";
import { canonicalPosetBody } from "../src/canonical-definitions.ts";
import { canonicalPoset, MAX_CODED, MAX_LISTED, posetAt, posetCount } from "../src/canonical.ts";
import { type Poset, posetsOfSize } from "./poset-findstat-readings.ts";

const DEEP = process.env.DEEP_TESTS === "1";
const ce = bareEngine();
declareCombinatorics(ce);
declareMaps(ce, Object.fromEntries(CARRIERS.map((c) => [c.type, c.name])));
const bare = bareEngine();

const list = (value: readonly unknown[]): unknown => ["List", ...value.map((x) => (Array.isArray(x) ? list(x) : x))];
const poset = (p: Poset): unknown => ["Poset", list(p)];
const map = MAPS.find((m) => m.name === "CanonicalPoset")!;

test("the kernel gives the Epsil body's answers, interpreted (through 2 elements, 3 in a deep run)", () => {
  for (let n = 0; n <= (DEEP ? 3 : 2); n++)
    for (const p of posetsOfSize(n))
      expect(list(map.kernel!(p as never) as unknown[]), JSON.stringify(p)).toEqual(
        evaluateDefinition(ce, map, list(p)),
      );
});

test("the kernel gives the compiled Epsil body's answers, through 4 elements, 5 in a deep run", () => {
  const compiled = compileTyped(bare, canonicalPosetBody, { _raw: "list<list<integer>>" });
  expect(compiled).toBeDefined();
  for (let n = 0; n <= (DEEP ? 5 : 4); n++)
    for (const p of posetsOfSize(n)) expect(compiled!.run({ _raw: p }), JSON.stringify(p)).toEqual(canonicalPoset(p));
});

test("the kernel declines what is no poset, and what a code cannot carry", () => {
  expect(map.kernel!([[], [2]] as never)).toBeUndefined();
  expect(map.kernel!([1, 2, 3] as never)).toBeUndefined();
  expect(map.kernel!(Array.from({ length: MAX_CODED + 1 }, () => []) as never)).toBeUndefined();
});

test("CanonicalPoset on the engine: evaluate() and .N() agree with the kernel", () => {
  for (let n = 0; n <= 4; n++)
    for (const p of posetsOfSize(n)) {
      const call = ce.box(["CanonicalPoset", poset(p)] as never);
      expect(call.evaluate().json, JSON.stringify(p)).toEqual(poset(canonicalPoset(p)));
      expect(call.N().json, JSON.stringify(p)).toEqual(poset(canonicalPoset(p)));
    }
});

test("IsIsomorphicPoset on the engine: two posets are isomorphic when their canonical forms are equal", () => {
  const values = [2, 3, 4].flatMap(posetsOfSize);
  for (const p of values.filter((_, i) => i % 5 === 0))
    for (const q of values.filter((_, i) => i % 7 === 0)) {
      const expected = JSON.stringify(canonicalPoset(p)) === JSON.stringify(canonicalPoset(q));
      expect(
        ce.box(["IsIsomorphicPoset", poset(p), poset(q)] as never).evaluate().json,
        `${JSON.stringify(p)} ${JSON.stringify(q)}`,
      ).toBe(expected ? "True" : "False");
    }
  // Equality of values stays structural.
  const [relabeled, canonical] = [
    [[], [], [2]],
    [[], [1], []],
  ];
  expect(ce.box(["Equal", poset(relabeled), poset(canonical)] as never).evaluate().json).not.toBe("True");
});

test("Posets on the engine: the count, the elements and membership, through evaluate() and .N()", () => {
  for (let n = 0; n <= 6; n++) {
    expect(ce.box(["Count", ["Posets", n]] as never).evaluate().json).toBe(posetCount(n));
    expect(ce.box(["Count", ["Posets", n]] as never).N().json).toBe(posetCount(n));
  }
  for (const r of [0, 1, 7, 62]) {
    const element = ce.box(["At", ["Posets", 5], r + 1] as never);
    expect(element.evaluate().json).toEqual(poset(posetAt(5, r)));
    expect(ce.box(["Element", poset(posetAt(5, r)), ["Posets", 5]] as never).evaluate().json).toBe("True");
  }
  expect(ce.box(["Element", poset([[], [], [2]]), ["Posets", 3]] as never).evaluate().json).toBe("False");
  expect(ce.box(["Element", poset([[], [1]]), ["Posets", 3]] as never).evaluate().json).toBe("False");
});

test("Posets and CanonicalPoset agree: every member is its own canonical form and the list is the classes", () => {
  for (let n = 0; n <= 4; n++) {
    const members = Array.from({ length: posetCount(n) }, (_, r) => JSON.stringify(posetAt(n, r)));
    expect(new Set(members).size).toBe(members.length);
    expect(new Set(posetsOfSize(n).map((p) => JSON.stringify(canonicalPoset(p))))).toEqual(new Set(members));
  }
});

const run = (expr: unknown) => {
  const { value, messages } = collectMessages(ce, () => ce.box(expr as never).evaluate());
  return { json: value.json, texts: messages.map((m) => (m as { text?: string }).text ?? "") };
};

test(`past ${MAX_LISTED} elements Posets declines with a message, and the kernel declines`, () => {
  const count = run(["Count", ["Posets", MAX_LISTED + 1]]);
  expect(count.json).toEqual(["Count", ["Posets", MAX_LISTED + 1]]);
  expect(count.texts.join(" ")).toContain(`Posets(${MAX_LISTED + 1}) would enumerate`);
  expect(run(["At", ["Posets", MAX_LISTED + 1], 1]).texts.join(" ")).toContain("would enumerate");
  expect(() => posets.fast!.count([MAX_LISTED + 1])).toThrow(RangeError);
});

test("a value that is no poset is left to the definition through 6 elements, and left unevaluated past them", () => {
  // The kernel declines a cover implied by another; the definition reads the order the covers give.
  const implied = poset([[], [1], [1, 2]]);
  expect(run(["CanonicalPoset", implied]).json).toEqual(poset([[], [1], [2]]));
  const long = poset([[], [1], [1, 2], [3], [4], [5], [6], [7]]);
  expect(run(["CanonicalPoset", long]).json).toEqual(["CanonicalPoset", long]);
});

test(`past ${MAX_CODED} elements the heads decline, IsIsomorphicPoset with a message`, () => {
  const large = poset(Array.from({ length: MAX_CODED + 1 }, () => []));
  expect(run(["CanonicalPoset", large]).json).toEqual(["CanonicalPoset", large]);
  const isomorphic = run(["IsIsomorphicPoset", large, poset([[]])]);
  expect(isomorphic.json).toEqual(["IsIsomorphicPoset", large, poset([[]])]);
  expect(isomorphic.texts.join(" ")).toContain(`more than ${MAX_CODED} elements`);
});
