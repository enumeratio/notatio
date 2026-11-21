import { createEngine } from "@notatio/engine/testing";
import { declareCombinatorics, declareLate } from "@notatio/combinatorics";
import { expect, test } from "vite-plus/test";
import { declareHopf } from "../src/declare.ts";

const ce = createEngine(declareCombinatorics, declareHopf, declareLate);

function compositions(n: number): number[][] {
  if (n === 0) return [[]];
  return Array.from({ length: n }, (_, i) => i + 1).flatMap((first) =>
    compositions(n - first).map((rest) => [first, ...rest]),
  );
}

test("ConjugateComposition on a list is TransposeComposition of the same composition", () => {
  for (const n of [1, 2, 3, 4, 5, 6]) {
    for (const parts of compositions(n)) {
      const list = ["List", ...parts] as never;
      const conjugate = ce.box(["ConjugateComposition", list]).evaluate().json;
      const transpose = ce.box(["TransposeComposition", ["IntegerComposition", list]]).evaluate().json;
      expect(conjugate, parts.join("+")).toEqual((transpose as unknown as [string, unknown])[1]);
    }
  }
});
