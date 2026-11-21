// A core is a partition, so TransposePartition takes a core and answers a core: transposing twice is the
// identity, and the answer is a core of the same t (a hook and its mirror have one length).

import { expect, test } from "vite-plus/test";
import { ce } from "../../tests/maps-helpers.ts";

/** The partitions of n, parts non-increasing. */
function partitions(n: number, most = n): number[][] {
  if (n === 0) return [[]];
  return Array.from({ length: Math.min(n, most) }, (_, i) => Math.min(n, most) - i).flatMap((first) =>
    partitions(n - first, first).map((rest) => [first, ...rest]),
  );
}

const conjugate = (parts: readonly number[]): number[] =>
  Array.from({ length: parts[0] ?? 0 }, (_, j) => parts.filter((p) => p > j).length);

/** No hook length is divisible by t, read off the diagram: arm + leg + 1 at each cell. */
function isCore(parts: readonly number[], t: number): boolean {
  const columns = conjugate(parts);
  return parts.every((row, i) =>
    Array.from({ length: row }, (_, j) => row - j + columns[j]! - i - 1).every((h) => h % t !== 0),
  );
}

const transposed = (core: readonly number[]): number[] => {
  const answer = ce.box(["TransposePartition", ["CorePartition", ["List", ...core]]] as never).evaluate();
  expect(answer.operator).toBe("CorePartition");
  const [, [, ...parts]] = answer.json as unknown as ["CorePartition", ["List", ...number[]]];
  return parts;
};

for (const t of [2, 3, 4, 5]) {
  test(`transposing a ${t}-core gives a ${t}-core, and twice is the identity`, () => {
    let seen = 0;
    for (let n = 0; n <= 14; n++) {
      for (const core of partitions(n).filter((p) => isCore(p, t))) {
        const once = transposed(core);
        expect(once, core.join(",")).toEqual(conjugate(core));
        expect(isCore(once, t), core.join(",")).toBe(true);
        expect(transposed(once), core.join(",")).toEqual(core);
        seen++;
      }
    }
    expect(seen).toBeGreaterThan(3);
  });
}
