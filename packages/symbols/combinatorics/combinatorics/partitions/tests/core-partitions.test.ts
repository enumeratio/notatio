// CorePartitions(t, n): the partitions of n with no hook length divisible by t, in IntegerPartitions'
// order, against an independent reading (every partition of n, each cell's hook counted off the diagram).
// The interpreter's Epsil answers here; the compiled code and the fast path are held to it by
// fast-kernels.test.ts and the generator's own check.

import { bareEngine } from "@notatio/engine/testing";
import { expect, test } from "vite-plus/test";
import { epsilKernelOn } from "../../collections/src/families/epsil.ts";
import { epsilEntries } from "../src/families/core.ts";

const ce = bareEngine();
const family = epsilEntries.find((f) => f.head === "CorePartitions")!;
const kernel = epsilKernelOn(ce, family);

const DEEP = process.env.DEEP_TESTS === "1";

/** Every partition of n with parts at most `cap`, largest part first. */
function partitionsOf(n: number, cap = n): number[][] {
  if (n === 0) return [[]];
  return Array.from({ length: Math.min(n, cap) }, (_, i) => Math.min(n, cap) - i).flatMap((first) =>
    partitionsOf(n - first, first).map((rest) => [first, ...rest]),
  );
}

/** No cell's hook (arm + leg + 1, counted off the diagram) is divisible by t. */
function isCore(parts: readonly number[], t: number): boolean {
  return parts.every((row, i) =>
    Array.from({ length: row }, (_, j) => {
      const arm = row - j - 1;
      const leg = parts.filter((p, k) => k > i && p > j).length;
      return arm + leg + 1;
    }).every((hook) => hook % t !== 0),
  );
}

const cores = (t: number, n: number): number[][] => partitionsOf(n).filter((p) => isCore(p, t));

const params: number[][] = [
  [1, 0],
  [1, 3],
  [2, 0],
  [2, 6],
  [2, 10],
  [3, 5],
  [3, 8],
  [4, 7],
  [5, 6],
  ...(DEEP
    ? [
        [2, 15],
        [3, 12],
        [4, 12],
        [7, 13],
      ]
    : []),
];

/** The number of t-cores of n for n = 0..top: the coefficients of ∏ (1 − q^(tk))^t / (1 − q^k) (Garvan–Kim–Stanton). */
function coreCounts(t: number, top: number): number[] {
  let series = Array.from({ length: top + 1 }, (_, i) => (i === 0 ? 1 : 0));
  for (let k = 1; k <= top; k++) {
    for (let i = k; i <= top; i++) series[i]! += series[i - k]!; // divide by 1 − q^k
    for (let rep = 0; rep < t && t * k <= top; rep++) {
      const next = series.slice(); // multiply by 1 − q^(tk)
      for (let i = t * k; i <= top; i++) next[i]! -= series[i - t * k]!;
      series = next;
    }
  }
  return series;
}

/** Granville and Ono: the 3-cores of n number d₁(3n + 1) − d₂(3n + 1), divisors by residue mod 3. */
const threeCores = (n: number): number => {
  let total = 0;
  for (let d = 1; d <= 3 * n + 1; d++) if ((3 * n + 1) % d === 0) total += d % 3 === 1 ? 1 : -1;
  return total;
};

test("the counts follow the generating function, and the 3-cores follow the divisor formula", () => {
  const top = DEEP ? 22 : 14;
  for (const t of [2, 3, 4, 5, 7]) {
    const series = coreCounts(t, top);
    for (let n = 0; n <= top; n++) expect([t, n, kernel.count([t, n])]).toEqual([t, n, BigInt(series[n]!)]);
  }
  expect(coreCounts(3, top)).toEqual(Array.from({ length: top + 1 }, (_, n) => threeCores(n)));
  // 2-cores are the staircases: one of n when n is triangular, else none.
  const triangular = new Set(Array.from({ length: 8 }, (_, k) => (k * (k + 1)) / 2));
  expect(coreCounts(2, top)).toEqual(Array.from({ length: top + 1 }, (_, n) => (triangular.has(n) ? 1 : 0)));
});

for (const [t, n] of params) {
  test(`CorePartitions(${t}, ${n}) agrees with the hook-length reading`, () => {
    const expected = cores(t, n);
    expect(kernel.count([t, n])).toBe(BigInt(expected.length));
    expected.forEach((core, r) => {
      expect(kernel.unrank([t, n], BigInt(r))).toEqual(core);
      expect(kernel.rank(core, [t, n])).toBe(BigInt(r));
    });
    for (const candidate of partitionsOf(n)) expect(kernel.valid(candidate, [t, n])).toBe(isCore(candidate, t));
    // Not partitions of n, or not partitions at all.
    expect(kernel.valid([...partitionsOf(n + 1)[0]!], [t, n])).toBe(false);
    expect(kernel.valid([1, 2], [t, n])).toBe(false);
  });
}
