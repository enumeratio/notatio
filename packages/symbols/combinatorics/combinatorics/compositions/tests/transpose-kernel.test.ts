// TransposeComposition's kernel is a fast path: it gives the answers of its Epsil, Complement after Reverse.

import { expect, test } from "vite-plus/test";
import { MAPS } from "../../src/index.ts";
import { ce } from "../../tests/maps-helpers.ts";

const compositions = (n: number): number[][] =>
  n === 0
    ? [[]]
    : Array.from({ length: n }, (_, i) => i + 1).flatMap((first) =>
        compositions(n - first).map((rest) => [first, ...rest]),
      );

test("TransposeComposition's kernel gives its steps' answers", () => {
  const map = MAPS.find((m) => m.name === "TransposeComposition")!;
  expect(map.kernel).toBeDefined();
  for (const n of [1, 2, 3, 4, 5, 6]) {
    for (const parts of compositions(n)) {
      const wrapped = ["IntegerComposition", ["List", ...parts]];
      const viaHead = ce.box(["TransposeComposition", wrapped] as never).evaluate().json;
      const viaSteps = ce.box(["Complement", ["Reverse", wrapped]] as never).evaluate().json;
      expect(viaHead, parts.join("+")).toEqual(viaSteps);
    }
  }
});

test("the kernel declines what is no composition", () => {
  const { kernel } = MAPS.find((m) => m.name === "TransposeComposition")!;
  expect(kernel!([1, 0, 2] as never)).toBeUndefined();
  expect(kernel!([1.5] as never)).toBeUndefined();
});
