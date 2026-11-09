// Maps compiled at build from their Epsil (src/compiled-maps.generated.js): every compiled map
// gives the interpreter's answers exactly, over the small elements of every family on its
// source carrier.

import { bareEngine } from "@enumeratio/engine/testing";
import { applyComposition } from "@enumeratio/structures";
import { expect, test, vi } from "vite-plus/test";
import { CARRIERS, declareCombinatoricsCarriers } from "../src/carriers.ts";
import { COMPILED_MAPS } from "../src/compiled-maps.generated.js";
import {
  bareParts,
  composedDefinition,
  compositionHash,
  compositionSteps,
  fastDefinition,
  mapKey,
  wrapParts,
} from "../src/compiled.ts";
import { FLAT } from "../src/flat.ts";
import { declareMaps, evaluateDefinition, MAPS } from "../src/maps.ts";
import { rightRotationFlat } from "../trees/src/flat.ts";
import { evaluateTable, partSubjects } from "../scripts/compile-maps.ts";
import { allElements, smallElements } from "../scripts/samples.ts";

// The interpreter is the slow side of the comparison: a small sample in the standard run, more
// under DEEP_TESTS.
const DEEP = process.env.DEEP_TESTS === "1";
const MAX_SIZE = DEEP ? 6 : 4;
const PER_FAMILY = DEEP ? 60 : 6;

const carrierByType = new Map(CARRIERS.map((carrier) => [carrier.type, carrier]));
const carrierByName = new Map(CARRIERS.map((carrier) => [carrier.name, carrier]));

/** Small elements of every family whose elements are values of `carrier`, as its contents. */
const subjectsOf = (carrier: string): unknown[] => smallElements(ce, carrier, MAX_SIZE, PER_FAMILY, true);

const ce = bareEngine();

test("the build compiled maps", () => {
  expect(Object.keys(COMPILED_MAPS).length).toBeGreaterThan(0);
});

// Maps whose Epsil the compiler can't take, left to the interpreter on purpose: each is pinned here with its
// reason, so one that starts to compile (or is dropped) shows up as a failure rather than going unnoticed.
const INTERPRETED: Readonly<Record<string, string>> = {};

test("the pinned maps are declared and not compiled", () => {
  for (const key of Object.keys(INTERPRETED)) {
    expect(
      MAPS.some((m) => `${m.name}@${m.from}` === key),
      key,
    ).toBe(true);
    expect(COMPILED_MAPS[key]?.run, key).toBeUndefined();
  }
});

// A map with a flat body is compiled from it (its entry carries the flat reading's carriers), whatever the nested
// body does.
test("the tree maps with a flat body are compiled from it", () => {
  for (const name of ["Mirror", "LeftRotation", "RightRotation"]) {
    const entry = COMPILED_MAPS[`${name}@binary_tree`];
    expect(entry?.run, name).toBeDefined();
    expect([entry?.flatIn, entry?.flatOut], name).toEqual(["binary_tree", "binary_tree"]);
  }
});

// The ordered tree maps with a flat body: the Dyck word in, and a Dyck word, a parent array or (DyckPath, whose
// carrier has no flat reading) the nested value out.
test("the ordered tree maps with a flat body are compiled from it", () => {
  const flat: [string, string, string | undefined, string | undefined][] = [
    ["Mirror", "ordered_tree", "ordered_tree", "ordered_tree"],
    ["Rotation", "ordered_tree", "ordered_tree", "ordered_tree"],
    ["DyckPath", "ordered_tree", "ordered_tree", undefined],
    ["BinaryTree", "ordered_tree", "ordered_tree", "binary_tree"],
    ["RightBranchBinaryTree", "ordered_tree", "ordered_tree", "binary_tree"],
    ["OrderedTree", "binary_tree", "binary_tree", "ordered_tree"],
    ["RightBranchOrderedTree", "binary_tree", "binary_tree", "ordered_tree"],
  ];
  for (const [name, from, flatIn, flatOut] of flat) {
    const entry = COMPILED_MAPS[`${name}@${from}`];
    expect(entry?.run, name).toBeDefined();
    expect([entry?.flatIn, entry?.flatOut], name).toEqual([flatIn, flatOut]);
  }
});

// DeBruijnMorselt is binary <-> ordered and back: its chain stays in the flat readings between the steps.
test("DeBruijnMorselt runs flat, with one encode and one decode", () => {
  const map = MAPS.find((m) => m.name === "DeBruijnMorselt" && m.from === "ordered_tree")!;
  const steps = compositionSteps(MAPS, map)!;
  expect(steps.map((step) => `${step.name}@${step.from}`)).toEqual([
    "RightBranchBinaryTree@ordered_tree",
    "OrderedTree@binary_tree",
  ]);
  const chain = composedDefinition({ ce, steps, generated: COMPILED_MAPS[mapKey(map)] })!;
  const encode = vi.spyOn(FLAT["ordered_tree"]!, "encode");
  const decode = vi.spyOn(FLAT["ordered_tree"]!, "decode");
  const binaryEncode = vi.spyOn(FLAT["binary_tree"]!, "encode");
  const binaryDecode = vi.spyOn(FLAT["binary_tree"]!, "decode");
  try {
    const tree = subjectsOf("OrderedTree").at(-1);
    expect(chain(tree)).toEqual(evaluateDefinition(ce, steps[1]!, evaluateDefinition(ce, steps[0]!, tree)));
    expect([encode.mock.calls.length, decode.mock.calls.length]).toEqual([1, 1]);
    expect([binaryEncode.mock.calls.length, binaryDecode.mock.calls.length]).toEqual([0, 0]);
  } finally {
    vi.restoreAllMocks();
  }
});

// With no generated entry (absent or stale) the flat body has not been checked by the build, so it is not used:
// Mirror given another map's flat body still answers as its nested definition does.
test("with no generated entry the flat body is not used", () => {
  const mirror = MAPS.find((m) => m.name === "Mirror" && m.from === "binary_tree")!;
  const tree = carrierByType.get("binary_tree")!;
  const run = fastDefinition({
    ce,
    body: mirror.body,
    from: tree.shape,
    to: tree.shape,
    cache: false,
    flat: rightRotationFlat,
    codecs: { encode: FLAT.binary_tree, decode: FLAT.binary_tree },
    interpret: (contents) => evaluateDefinition(ce, mirror, contents),
  });
  const subjects = subjectsOf(tree.name).slice(0, 20);
  expect(subjects.length).toBeGreaterThan(0);
  for (const contents of subjects)
    expect(run(contents), JSON.stringify(contents)).toEqual(evaluateDefinition(ce, mirror, contents));
});

// Families overlap, and the build's cross-checks cost per subject.
test("each small element is sampled once", () => {
  const subjects = smallElements(ce, "Permutation").map((s) => JSON.stringify(s));
  const all = allElements(ce, "Permutation").map((s) => JSON.stringify(s));
  expect(subjects.length).toBeGreaterThan(0);
  expect(new Set(subjects).size).toBe(subjects.length);
  expect(subjects).toEqual([...new Set(all)]);
});

/** How many subjects of a carrier its maps interpret together, deep or not. The interpreter is the slow
 *  side of the comparison, so a map's share is this over the carrier's maps: the file's time stays put as
 *  maps are added, and each map sees fewer subjects. Sized from the seconds one interpretation took on a
 *  2-thread box, the mean over a carrier's maps at the standard sizes (BinaryWord .03, Permutation .14,
 *  SignedPermutation .2, DyckPath .3, SetPartition .3, StandardTableau .3, IntegerPartition .7, whose
 *  composition ReadingTableau takes seconds); deep sizes cost several times that. */
const CARRIER_ALLOWANCE: Readonly<Record<string, number>> = {
  Permutation: 800,
  SignedPermutation: 400,
  DyckPath: 450,
  SetPartition: 400,
  StandardTableau: 300,
  IntegerPartition: 200,
  BinaryWord: 2000,
};
/** The allowance of a carrier not listed: the others' maps are cheap at every size the sample reaches. */
const DEFAULT_ALLOWANCE = 1500;

/** The fewest subjects a map interprets however many maps share the carrier: enough to take every
 *  size up to 3 whole in a one-parameter family. */
const MIN_PER_MAP = 12;

/** Maps whose interpretation grows steeply with the element: the most cells (the sum of its numbers) a
 *  subject may have. A family's sample reaches shapes of 36 cells at its largest sizes; RskRecording, which
 *  ReadingTableau applies to the reading word, takes about a second at 3 cells, 3 at 6 and 9 at 10, so past
 *  8 the composition outlasts `testTimeout`. */
const SLOW_TO_INTERPRET: ReadonlyMap<string, number> = new Map([["ReadingTableau@integer_partition", 8]]);

const cellsOf = (contents: unknown): number =>
  typeof contents === "number"
    ? contents
    : Array.isArray(contents)
      ? contents.reduce((n: number, c) => n + cellsOf(c), 0)
      : 0;

/** The subjects a map of `carrier` interprets, at most its share of the carrier's allowance. The
 *  smallest (by length of their MathJSON) half stay whole and the rest are spread evenly through the
 *  larger ones, the largest taken last, so every size is represented. The same subjects every run. */
function budgeted(carrier: string, subjects: unknown[]): unknown[] {
  const type = carrierByName.get(carrier)?.type;
  const maps = MAPS.filter(
    (m) => m.from === type && (m.composedOf !== undefined || COMPILED_MAPS[mapKey(m)]?.run !== undefined),
  );
  const cap = Math.max(
    MIN_PER_MAP,
    Math.floor((CARRIER_ALLOWANCE[carrier] ?? DEFAULT_ALLOWANCE) / Math.max(1, maps.length)),
  );
  if (subjects.length <= cap) return subjects;
  const bySize = subjects
    .map((s) => [JSON.stringify(s).length, s] as const)
    .toSorted((a, b) => a[0] - b[0])
    .map(([, s]) => s);
  const whole = Math.ceil(cap / 2);
  const rest = bySize.slice(whole);
  const spread = cap - whole;
  return [
    ...bySize.slice(0, whole),
    ...Array.from({ length: spread }, (_, k) => rest[Math.ceil(((k + 1) * rest.length) / spread) - 1]),
  ];
}

// A map's subjects run in chunks of one test each, so the file's total grows with the sample
// but no test comes near `testTimeout`.
const CHUNK = 40;

// Every map compiled ahead of time, run from its generated code, against the interpreter. A map
// the generator left interpreted (its compiled code disagreed) has no code to run.
for (const map of MAPS.filter((m) => m.composedOf === undefined && COMPILED_MAPS[mapKey(m)]?.run !== undefined)) {
  const from = carrierByType.get(map.from)!;
  const to = carrierByType.get(map.to)!;
  let fallbacks = 0;
  const run = fastDefinition({
    ce,
    body: map.body,
    guard: map.guard,
    from: map.compiledFrom ?? from.shape,
    to: to.shape,
    cache: false,
    flat: map.flat,
    codecs: {
      ...(FLAT[map.from] === undefined ? {} : { encode: FLAT[map.from] }),
      ...(FLAT[map.to] === undefined ? {} : { decode: FLAT[map.to] }),
    },
    generated: COMPILED_MAPS[`${map.name}@${map.from}`],
    argumentParts: map.argumentParts,
    imageParts: map.imageParts,
    interpret: (contents) => {
      fallbacks++;
      return evaluateDefinition(ce, map, contents);
    },
  });
  // The pair carrier's families aren't sampled: its subjects are the images of small permutations (words of at most
  // three letters in the standard run: the interpreter's inverse RSK is slow).
  const small = (words: unknown[]): unknown[] => words.filter((word) => DEEP || (word as unknown[]).length <= 4);
  const subjects =
    map.argumentParts !== undefined
      ? partSubjects(ce, map, budgeted("Permutation", small(subjectsOf("Permutation"))))
      : map.imageParts !== undefined
        ? budgeted(from.name, small(subjectsOf(from.name)))
        : budgeted(from.name, subjectsOf(from.name));
  const title = `${map.name} from ${map.from}: compiled agrees with interpreted`;
  for (let start = 0; start < subjects.length; start += CHUNK) {
    test(subjects.length > CHUNK ? `${title} (${start / CHUNK + 1})` : title, () => {
      for (const contents of subjects.slice(start, start + CHUNK))
        expect(run(contents), JSON.stringify(contents)).toEqual(
          wrapParts(map.imageParts, evaluateDefinition(ce, map, bareParts(map.argumentParts, contents))),
        );
    });
  }
  test(`${map.name} from ${map.from}: the generated code answers`, () => {
    expect(fallbacks).toBeLessThan(subjects.length);
  });
}

// A composition (`composedOf`) runs as one chain once every map it applies has compiled code, and
// is interpreted while one has none.
const compositions = MAPS.filter((m) => m.composedOf !== undefined);

test("a composition is compiled exactly while all its steps are", () => {
  expect(compositions.length).toBeGreaterThan(0);
  for (const map of compositions) {
    const steps = compositionSteps(MAPS, map);
    expect(steps, `${mapKey(map)} resolves`).toBeDefined();
    const compiled = steps!.every((step) => COMPILED_MAPS[mapKey(step)]?.run !== undefined);
    expect(COMPILED_MAPS[mapKey(map)]?.run !== undefined, mapKey(map)).toBe(compiled);
  }
});

test("a chain declines at a failed guard and at an image compiled code can't hand back exactly", () => {
  const chain = (...steps: string[]) =>
    evaluateTable([
      { key: "Inc@x", hash: "", body: "_._raw.map((x) => x + 1)" },
      { key: "Half@x", hash: "", body: "_._raw.map((x) => x / 2)" },
      { key: "Odd@x", hash: "", body: "_._raw", guard: "_._raw[0] > 1 && _._image.length === _._raw.length" },
      { key: "Chain@x", hash: "", steps },
    ])["Chain@x"]!.run(null, { _raw: [1, 2] });
  expect(chain("Inc@x")).toEqual([2, 3]);
  expect(chain("Odd@x", "Inc@x")).toBeUndefined();
  expect(chain("Inc@x", "Odd@x")).toEqual([2, 3]);
  expect(chain("Half@x")).toBeUndefined();
});

test("compositions resolve through the carrier each step delivers, and are keyed on every step", () => {
  const step = (name: string, from: string, to: string, body: unknown = [name]) => ({ name, from, to, body });
  const a = step("A", "x", "y");
  const b = step("B", "y", "z");
  const inner = { ...step("AB", "x", "z"), body: undefined, composedOf: ["B", "A"] };
  const outer = { ...step("Outer", "x", "w"), body: undefined, composedOf: ["C", "AB"] };
  const c = step("C", "z", "w");
  const maps = [a, b, c, inner, outer];
  expect(compositionSteps(maps, inner)).toEqual([a, b]);
  // A composed step stands for its own steps.
  expect(compositionSteps(maps, outer)).toEqual([a, b, c]);
  // A step on the wrong carrier, a missing step, or a chain ending elsewhere has no steps.
  expect(compositionSteps([a, c, outer], outer)).toBeUndefined();
  expect(compositionSteps(maps, { ...inner, to: "y" })).toBeUndefined();
  expect(compositionSteps([a, step("B", "q", "z"), inner], inner)).toBeUndefined();
  // Editing any step, or the order, changes the hash.
  const hash = compositionHash([a, b, c]);
  expect(compositionHash([a, { ...b, body: ["B2"] }, c])).not.toBe(hash);
  expect(compositionHash([a, { ...b, guard: ["True"] }, c])).not.toBe(hash);
  expect(compositionHash([b, a, c])).not.toBe(hash);
});

const heads = bareEngine();
declareCombinatoricsCarriers(heads);
declareMaps(heads, Object.fromEntries(CARRIERS.map((c) => [c.type, c.name])));

// The chain against the interpreter applying the same maps' definitions, and the declared head (which
// runs the chain) against its steps applied head by head.
for (const map of compositions.filter((m) => COMPILED_MAPS[mapKey(m)]?.run !== undefined)) {
  const steps = compositionSteps(MAPS, map)!;
  const from = carrierByType.get(map.from)!;
  const chain = composedDefinition({ ce, steps, generated: COMPILED_MAPS[mapKey(map)] })!;
  const largest = SLOW_TO_INTERPRET.get(mapKey(map)) ?? Infinity;
  const subjects = budgeted(
    from.name,
    subjectsOf(from.name).filter((contents) => cellsOf(contents) <= largest),
  );
  let declined = 0;
  const interpret = (contents: unknown): unknown => {
    let value = contents;
    for (const step of steps) {
      value = evaluateDefinition(ce, step, value);
      if (value === undefined) return undefined;
    }
    return value;
  };
  const title = `${map.name} from ${map.from}: the compiled composition`;
  for (let start = 0; start < subjects.length; start += CHUNK) {
    const part = subjects.length > CHUNK ? ` (${start / CHUNK + 1})` : "";
    test(`${title} agrees with the interpreter${part}`, () => {
      for (const contents of subjects.slice(start, start + CHUNK)) {
        const answer = chain(contents);
        if (answer === undefined) declined++;
        else expect(answer, JSON.stringify(contents)).toEqual(interpret(contents));
      }
    });
    test(`${title} agrees with its steps as heads${part}`, () => {
      for (const contents of subjects.slice(start, start + CHUNK)) {
        const subject = heads.box([from.name, contents] as never);
        expect(heads.box([map.name, subject.json] as never).evaluate().json, JSON.stringify(contents)).toEqual(
          applyComposition(heads, map.composedOf!, subject).json,
        );
      }
    });
  }
  test(`${title} answers`, () => {
    expect(declined).toBeLessThan(subjects.length);
  });
}
