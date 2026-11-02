// Rsk and ToPermutation through compiled code: inverse RSK of the pair is the permutation, for every permutation of
// n <= 6. The interpreter never answers here; compiled-maps.test.ts holds the compiled code to it.

import { bareEngine } from "@enumeratio/engine/testing";
import { expect, test } from "vite-plus/test";
import { CARRIERS } from "../../src/carriers.ts";
import { bareParts, fastDefinition } from "../../src/compiled.ts";
import { MAPS } from "../../src/maps.ts";

const ce = bareEngine();
const shapeOf = (type: string): string => CARRIERS.find((c) => c.type === type)!.shape;

/** The map's definition with no interpreter behind it: compiled code or nothing. */
const compiledOnly = (name: string, from: string) => {
  const map = MAPS.find((m) => m.name === name && m.from === from)!;
  return fastDefinition({
    ce,
    body: map.body,
    from: map.compiledFrom ?? shapeOf(map.from),
    to: shapeOf(map.to),
    cache: false,
    argumentParts: map.argumentParts,
    imageParts: map.imageParts,
    interpret: () => {
      throw new Error(`${name} fell back to the interpreter`);
    },
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
