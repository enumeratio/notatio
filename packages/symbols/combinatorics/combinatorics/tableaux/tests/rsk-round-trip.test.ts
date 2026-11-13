// Rsk and ToPermutation through compiled code: inverse RSK of the pair is the permutation, for every permutation of
// n <= 6. The interpreter never answers here; compiled-maps.test.ts holds the compiled code to it.

import { bareEngine } from "@notatio/engine/testing";
import { expect, test } from "vite-plus/test";
import { CARRIERS } from "../../src/carriers.ts";
import { bareParts, fastDefinition } from "../../src/compiled.ts";
import { evaluateDefinition, MAPS } from "../../src/maps.ts";

const ce = bareEngine();
const shapeOf = (type: string): string => CARRIERS.find((c) => c.type === type)!.shape;

/** The map's definition with no interpreter behind it: compiled code or nothing. */
const compiledOnly = (name: string, from: string, fallback?: () => undefined) => {
  const map = MAPS.find((m) => m.name === name && m.from === from)!;
  return fastDefinition({
    ce,
    body: map.body,
    guard: map.guard,
    from: map.compiledFrom ?? shapeOf(map.from),
    to: shapeOf(map.to),
    cache: false,
    argumentParts: map.argumentParts,
    imageParts: map.imageParts,
    interpret:
      fallback ??
      (() => {
        throw new Error(`${name} fell back to the interpreter`);
      }),
  });
};

const permutations = (n: number): number[][] =>
  n === 0
    ? [[]]
    : permutations(n - 1).flatMap((rest) =>
        Array.from({ length: n }, (_, i) => [...rest.slice(0, i), n, ...rest.slice(i)]),
      );

test("ToPermutation of Rsk is the permutation, compiled, for every permutation of n <= 6", () => {
  const rsk = compiledOnly("Rsk", "permutation");
  const inverse = compiledOnly("ToPermutation", "standard_tableau_pair");
  for (let n = 0; n <= 6; n++)
    for (const word of permutations(n)) {
      const pair = rsk(["List", ...word]);
      expect((pair as unknown[])[0], `[${word.join(", ")}]`).toBe("Tuple");
      expect(inverse(pair), `[${word.join(", ")}]`).toEqual(["List", ...word]);
    }
});

test("Rsk's image holds the two tableaux as constructed parts, which the argument reads bare", () => {
  const pair = compiledOnly("Rsk", "permutation")(["List", 2, 3, 1]);
  expect(pair).toEqual([
    "Tuple",
    ["StandardTableau", ["List", ["List", 1, 3], ["List", 2]]],
    ["StandardTableau", ["List", ["List", 1, 2], ["List", 3]]],
  ]);
  expect(bareParts(["StandardTableau", "StandardTableau"], pair)).toEqual([
    "Tuple",
    ["List", ["List", 1, 3], ["List", 2]],
    ["List", ["List", 1, 2], ["List", 3]],
  ]);
});

test("Rsk's kernel route answers the same constructed parts as its compiled body", () => {
  const map = MAPS.find((m) => m.name === "Rsk")!;
  expect(map.kernel).toBeDefined();
  const viaKernel = fastDefinition({
    ce,
    body: map.body,
    from: shapeOf(map.from),
    to: shapeOf(map.to),
    cache: false,
    kernel: map.kernel,
    imageParts: map.imageParts,
    interpret: () => {
      throw new Error("Rsk fell back to the interpreter");
    },
  });
  const compiled = compiledOnly("Rsk", "permutation");
  for (const word of permutations(5)) expect(viaKernel(["List", ...word])).toEqual(compiled(["List", ...word]));
});

// A pair that is no RSK image: mismatched shapes, an empty row, a non-standard Q, a repeated entry, a column that falls.
const pair = (p: number[][], q: number[][]): unknown => [
  "Tuple",
  ["List", ...p.map((row) => ["List", ...row])],
  ["List", ...q.map((row) => ["List", ...row])],
];
const INVALID: readonly (readonly [string, number[][], number[][]])[] = [
  ["mismatched shapes", [[1, 3], [2]], [[1, 2, 3]]],
  ["mismatched row lengths", [[1, 2], [3]], [[1], [2, 3]]],
  ["an empty row", [[1, 2], []], [[1, 2], []]],
  ["a non-standard Q (entries 1, 2, 4)", [[1, 3], [2]], [[1, 2], [4]]],
  ["a Q with a repeated entry", [[1, 3], [2]], [[1, 2], [2]]],
  ["a Q whose column falls", [[1, 3], [2]], [[2, 3], [1]]],
  ["a P whose row falls", [[3, 1], [2]], [[1, 2], [3]]],
];

const toPermutation = MAPS.find((m) => m.name === "ToPermutation")!;
const interpreted = (given: unknown) =>
  evaluateDefinition(ce, toPermutation, bareParts(toPermutation.argumentParts, given));

test("ToPermutation declines a pair that is no RSK image, compiled", () => {
  // Compiled code that throws on a malformed pair (a read out of range) hands over to the interpreter, which declines.
  const compiled = compiledOnly("ToPermutation", "standard_tableau_pair", () => undefined);
  for (const [name, p, q] of INVALID) expect(compiled(pair(p, q)), name).toBeUndefined();
  expect(compiled(pair([[1, 3], [2]], [[1, 2], [3]]))).toEqual(["List", 2, 3, 1]);
});

// The interpreter takes about 0.7 s a pair, so the standard run holds one of each kind and the rest are deep cases.
test("ToPermutation declines a pair that is no RSK image, interpreted", () => {
  const cases = process.env.DEEP_TESTS === "1" ? INVALID : INVALID.filter(([name]) => name.startsWith("an empty row"));
  for (const [name, p, q] of cases) expect(interpreted(pair(p, q)), name).toBeUndefined();
  if (process.env.DEEP_TESTS === "1")
    expect(interpreted(pair([[1, 3], [2]], [[1, 2], [3]]))).toEqual(["List", 2, 3, 1]);
});
