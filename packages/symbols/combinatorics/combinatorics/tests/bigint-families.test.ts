// A family that opts in with `bigSamples` answers past 2^53 from BigInt-compiled code. The
// interpreter is the oracle: the same family without the opt-in. The wide sweep is in
// compiled-families.test.ts (DEEP_TESTS).

import { bareEngine } from "@notatio/engine/testing";
import { expect, test } from "vite-plus/test";
import { COMPILED_FAMILIES } from "../collections/src/families/compiled-families.generated.js";
import { allFamilies } from "../collections/src/families/index.ts";
import { familyHash, isEpsilFamily, kernelOn, type EpsilFamily } from "../collections/src/families/epsil.ts";
import { definitions } from "../collections/src/families/sequence-definitions.ts";
import { shiftedStandardTableaux } from "../tableaux/src/families/standard-tableaux.ts";
import { dyckPaths, motzkinPaths, schroederPaths } from "../lattice-paths/src/families/core.ts";

const MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER);

const catalan = (n: bigint): bigint => {
  let c = 1n;
  for (let k = 0n; k < n; k++) c = (c * 2n * (2n * k + 1n)) / (k + 2n);
  return c;
};

const ce = bareEngine();
const big = kernelOn(ce, dyckPaths);
const interpreted = kernelOn(ce, { ...dyckPaths, bigSamples: undefined } as EpsilFamily, {});

test("DyckPaths opts in", () => {
  expect(dyckPaths.bigSamples).toBeDefined();
});

test("the count is exact past 2^53", () => {
  for (const n of [31, 35, 40, 60]) {
    expect(big.count([n])).toBe(catalan(BigInt(n)));
    expect(catalan(BigInt(n)) > MAX_SAFE).toBe(true);
  }
});

test("unrank and rank agree with the interpreter past 2^53, and rank undoes unrank", () => {
  for (const n of [31, 33, 36]) {
    const total = big.count([n]) as bigint;
    for (const r of [0n, 1n, total / 3n, total / 2n, total - 1n]) {
      const path = big.unrank([n], r);
      expect(path).toEqual(interpreted.unrank([n], r));
      expect(big.rank(path, [n])).toBe(r);
    }
  }
});

test("a rank outside the fiber still throws a RangeError", () => {
  const total = big.count([32]) as bigint;
  expect(() => big.unrank([32], total)).toThrow(RangeError);
});

test("BigInt code is used where generated, and the kernel answers the same without it", () => {
  const generated = COMPILED_FAMILIES as unknown as Record<string, { big?: object }>;
  // A build that stubbed the generated module has no code to check; the kernel compiles on first use then.
  if (Object.keys(generated).length > 0) expect(Object.keys(generated.DyckPaths?.big ?? {})).toContain("unrank");
  const marked = kernelOn(ce, dyckPaths, {
    DyckPaths: { hash: familyHash(dyckPaths), big: {}, bigInterpreted: ["count", "unrank", "rank"] },
  });
  expect(marked.count([32])).toBe(big.count([32]));
});

test("a fiber a double holds stays on the double path", () => {
  expect(big.count([20])).toBe(catalan(20n));
  expect(big.rank(big.unrank([20], 123456n), [20])).toBe(123456n);
});

// A sequence: the terms are past 2^53 from rank 31, where the double path and its fold bound can't follow.
const catalanFamily = definitions.get("CatalanNumbers")!;
const catalanTerms = kernelOn(ce, catalanFamily, COMPILED_FAMILIES, { fast: false });
const catalanInterpreted = kernelOn(
  ce,
  { ...catalanFamily, bigSamples: undefined } as EpsilFamily,
  {},
  { fast: false },
);

test("CatalanNumbers opts in, and its terms past 2^53 are exact", () => {
  expect(catalanFamily.bigSamples).toBeDefined();
  for (const r of [31n, 40n, 120n]) {
    const term = catalanTerms.unrank([], r);
    expect(BigInt(term as unknown as bigint)).toBe(catalan(r));
    expect(catalanTerms.rank(term, [])).toBe(r);
    expect(catalanTerms.valid(term, [])).toBe(true);
    expect(catalanTerms.valid(BigInt(term as unknown as bigint) + 1n, [])).toBe(false);
  }
});

test("CatalanNumbers agrees with the interpreter past 2^53", () => {
  for (const r of [31n, 45n]) {
    const term = catalanInterpreted.unrank([], r);
    expect(catalanTerms.unrank([], r)).toEqual(term);
    expect(catalanTerms.rank(term, [])).toBe(catalanInterpreted.rank(term, []));
    expect(catalanTerms.valid(term, [])).toBe(catalanInterpreted.valid(term, []));
  }
});

test("the loop bound that was a Log reads the same on doubles", () => {
  for (const x of [0, 1, 2, 3, 13, 14, 42, 43, 2 ** 40, 2 ** 53 - 1]) {
    expect(catalanTerms.rank(x as never, [])).toBe(catalanInterpreted.rank(x as never, []));
    expect(catalanTerms.valid(x as never, [])).toBe(catalanInterpreted.valid(x as never, []));
  }
});

// Table-based walks: the table is built once over BigInts, and unrank and rank read it.
test.each([
  ["MotzkinPaths", motzkinPaths, [39]],
  ["SchroederPaths", schroederPaths, [24]],
])("%s answers past 2^53 from a BigInt table", (_head, family, p) => {
  expect(family.bigSamples).toBeDefined();
  const tables: string[] = [];
  const kernel = kernelOn(ce, family, COMPILED_FAMILIES, { onTables: (_p, precision) => tables.push(precision) });
  const oracle = kernelOn(ce, { ...family, bigSamples: undefined } as EpsilFamily, {});
  const total = kernel.count(p) as bigint;
  expect(total > MAX_SAFE).toBe(true);
  for (const r of [0n, 1n, total / 2n, total - 1n]) {
    const path = kernel.unrank(p, r);
    expect(path).toEqual(oracle.unrank(p, r));
    expect(kernel.rank(path, p)).toBe(r);
  }
  expect(tables).toEqual(["big"]);
});

// The families that declined past 2^53 and now answer from BigInt code: an independent count, rank undoing
// unrank, and (where the interpreter takes seconds, not minutes, a call) unrank as the interpreter has it.
const choose = (n: bigint, k: bigint): bigint => {
  let c = 1n;
  for (let i = 1n; i <= k; i++) c = (c * (n - k + i)) / i;
  return c;
};
const optedIn: readonly (readonly [head: string, p: number[], count: (() => bigint) | undefined, oracle: boolean])[] = [
  ["NonCrossingTrees", [23], () => choose(69n, 23n) / 47n, true],
  ["BinaryTreeParentArrays", [31], () => catalan(31n), true],
  ["NonCrossingPartitions", [31], () => catalan(31n), true],
  ["NonNestingPartitions", [31], () => catalan(31n), true],
  ["PartCountBoundedCompositions", [55, 55], () => 2n ** 54n, true],
  // Counted by their TS kernels' exact classes.
  ["CarlitzCompositions", [68], undefined, true],
  ["ZigzagCompositions", [82], undefined, false],
  ["ParkingFunctions", [15], () => 16n ** 14n, false],
  // Lex-ranked families, which a table view scrolls row by row: 25! is past 2^53 and the interpreter takes ~0.2 s a row.
  ["SymmetricGroup", [25], () => factorial(25), true],
  ["KPermutations", [25, 13], () => factorial(25) / factorial(12), true],
  ["SignedPermutations", [15], () => 2n ** 15n * factorial(15), true],
  ["IntegerCompositions", [55], () => 2n ** 54n, true],
];
const byHead = new Map(allFamilies.filter(isEpsilFamily).map((family) => [family.head, family]));

test.each(optedIn)(
  "%s answers past 2^53 from BigInt code",
  (head, p, count, oracle) => {
    const family = byHead.get(head)!;
    expect(family.bigSamples).toBeDefined();
    expect(family.declinePastDoubles).toBeUndefined();
    const kernel = kernelOn(ce, { ...family, fast: undefined, fastCount: undefined } as EpsilFamily, COMPILED_FAMILIES);
    const exact = family.fast?.count ?? family.fastCount;
    const total = kernel.count(p) as bigint;
    expect(total).toBe(count?.() ?? BigInt(exact!(p) as bigint));
    expect(total > MAX_SAFE).toBe(true);
    const interpreted = oracle
      ? kernelOn(ce, { ...family, bigSamples: undefined, fast: undefined } as EpsilFamily, {})
      : undefined;
    for (const r of [0n, total / 3n, total - 1n]) {
      const element = kernel.unrank(p, r);
      expect(kernel.rank(element, p)).toBe(r);
      expect(kernel.valid(element, p)).toBe(true);
      if (interpreted !== undefined && r !== 0n) expect(element).toEqual(interpreted.unrank(p, r));
    }
  },
  120_000,
);

// Thrall's shifted hook-length formula, per strict partition: n!/∏λᵢ! · ∏ᵢ<ⱼ (λᵢ−λⱼ)/(λᵢ+λⱼ).
const factorial = (n: number): bigint => (n < 2 ? 1n : BigInt(n) * factorial(n - 1));
const strictPartitions = (n: number, max = n): number[][] =>
  n === 0
    ? [[]]
    : Array.from({ length: Math.min(n, max) }, (_, i) => Math.min(n, max) - i).flatMap((p) =>
        strictPartitions(n - p, p - 1).map((rest) => [p, ...rest]),
      );
const thrall = (lambda: number[]): bigint => {
  let top = factorial(lambda.reduce((a, b) => a + b, 0));
  let bottom = 1n;
  for (const [i, a] of lambda.entries()) {
    bottom *= factorial(a);
    for (const b of lambda.slice(i + 1)) {
      top *= BigInt(a - b);
      bottom *= BigInt(a + b);
    }
  }
  return top / bottom;
};
const shiftedTableaux = (n: number): bigint => strictPartitions(n).reduce((sum, lambda) => sum + thrall(lambda), 0n);

test("ShiftedStandardTableaux counts past 2^53 as Thrall's formula does", () => {
  const kernel = kernelOn(ce, shiftedStandardTableaux, COMPILED_FAMILIES);
  expect(shiftedTableaux(34)).toBeGreaterThan(MAX_SAFE);
  for (const n of [33, 34, 35]) expect(kernel.count([n]), `n=${n}`).toBe(shiftedTableaux(n));
});

test("the BigInt-compiled ShiftedStandardTableaux keeps its operations", () => {
  const entry = (COMPILED_FAMILIES as unknown as Record<string, { big?: object; bigInterpreted?: string[] }>)[
    "ShiftedStandardTableaux"
  ];
  // A build that stubbed the generated module has nothing to check.
  if (entry === undefined) return;
  expect(entry.bigInterpreted ?? []).toEqual([]);
  expect(Object.keys(entry.big ?? {})).toEqual(expect.arrayContaining(["count", "unrank", "rank"]));
});

// The families a table view pages by rank, whose order is graded or lex or largest first. Each is checked against
// an independent BigInt reading of the order, at the ends, a third of the way, and across 2^53 (the join), where
// the double path hands over; the interpreter checks the same ranks under DEEP_TESTS.
const DEEP = process.env.DEEP_TESTS === "1";
const binomial = (n: number, k: number): bigint => (k < 0 || k > n ? 0n : choose(BigInt(n), BigInt(k)));

/** The k-subset of 1..n of lex rank r. */
const lexSubset = (n: number, k: number, r: bigint): number[] => {
  const out: number[] = [];
  let v = 0;
  for (let i = 1; i <= k; i++) {
    v++;
    for (let c = binomial(n - v, k - i); r >= c; c = binomial(n - v, k - i)) {
      r -= c;
      v++;
    }
    out.push(v);
  }
  return out;
};
/** Subsets by size, lex within a size; `sizes` are the sizes that belong. */
const gradedSubset = (n: number, sizes: (k: number) => boolean, r: bigint): number[] => {
  for (let k = 0; k <= n; k++) {
    if (!sizes(k)) continue;
    const block = binomial(n, k);
    if (r < block) return lexSubset(n, k, r);
    r -= block;
  }
  throw new RangeError("rank outside the fiber");
};
/** The restricted growth string of rank r over n positions with at most `cap` labels (exactly `exactly`, if given). */
const growthString = (n: number, exactly: number | undefined, r: bigint): number[] => {
  const cap = exactly ?? n;
  const T: bigint[][] = [
    Array.from({ length: cap + 2 }, (_, open) => (exactly === undefined || open === exactly ? 1n : 0n)),
  ];
  for (let rem = 1; rem <= n; rem++)
    T.push(
      Array.from(
        { length: cap + 1 },
        (_, open) => BigInt(open) * T[rem - 1]![open]! + (open < cap ? T[rem - 1]![open + 1]! : 0n),
      ),
    );
  const labels: number[] = [];
  let open = 0;
  for (let i = 1; i <= n; i++) {
    const rem = n - i;
    for (let label = 0; label <= open; label++) {
      const here = label < open ? T[rem]![open]! : open < cap ? T[rem]![open + 1]! : 0n;
      if (r < here) {
        labels.push(label);
        if (label === open) open++;
        break;
      }
      r -= here;
    }
  }
  return labels;
};
const blocksOfLabels = (labels: number[]): number[][] => {
  const blocks: number[][] = [];
  for (const [i, label] of labels.entries()) (blocks[label] ??= []).push(i + 1);
  return blocks;
};
/** The partition of n of rank r, largest part first, never above the part before. */
const partitionOfRank = (n: number, r: bigint): number[] => {
  const P: bigint[][] = [];
  for (let m = 0; m <= n; m++) {
    P.push([]);
    for (let c = 0; c <= n; c++) P[m]![c] = m === 0 ? 1n : c === 0 ? 0n : P[m]![c - 1]! + (c <= m ? P[m - c]![c]! : 0n);
  }
  const parts: number[] = [];
  for (let m = n, cap = n; m > 0;) {
    for (let p = Math.min(m, cap); p >= 1; p--) {
      const here = P[m - p]![p]!;
      if (r < here) {
        parts.push(p);
        m -= p;
        cap = p;
        break;
      }
      r -= here;
    }
  }
  return parts;
};

const readings: readonly (readonly [
  head: string,
  p: number[],
  count: () => bigint,
  element: (r: bigint) => unknown,
  oracle: boolean,
])[] = [
  ["Subsets", [54], () => 2n ** 54n, (r) => gradedSubset(54, () => true, r), true],
  ["Subsets", [60], () => 2n ** 60n, (r) => gradedSubset(60, () => true, r), false],
  ["KSubsets", [60, 30], () => binomial(60, 30), (r) => lexSubset(60, 30, r), true],
  ["SetPartitions", [23], () => bell(23), (r) => blocksOfLabels(growthString(23, undefined, r)), true],
  ["SetPartitions", [30], () => bell(30), (r) => blocksOfLabels(growthString(30, undefined, r)), false],
  ["RestrictedGrowthStrings", [30], () => bell(30), (r) => growthString(30, undefined, r), false],
  [
    "SetPartitionsIntoKBlocks",
    [30, 10],
    () => stirlingSecond(30, 10),
    (r) => blocksOfLabels(growthString(30, 10, r)),
    true,
  ],
  ["IntegerPartitions", [300], () => partitionCount(300), (r) => partitionOfRank(300, r), false],
  ["IntegerPartitions", [400], () => partitionCount(400), (r) => partitionOfRank(400, r), false],
];
function bell(n: number): bigint {
  const row = [1n];
  for (let i = 1; i <= n; i++) {
    const next = [row[row.length - 1]!];
    for (const x of row) next.push(next[next.length - 1]! + x);
    row.splice(0, row.length, ...next);
  }
  return row[0]!;
}
function stirlingSecond(n: number, k: number): bigint {
  const S: bigint[][] = [[1n]];
  for (let i = 1; i <= n; i++) {
    S.push([0n]);
    for (let j = 1; j <= Math.min(i, k); j++) S[i]![j] = BigInt(j) * (S[i - 1]![j] ?? 0n) + (S[i - 1]![j - 1] ?? 0n);
  }
  return S[n]![k]!;
}
function partitionCount(n: number): bigint {
  const p = [1n];
  for (let m = 1; m <= n; m++) {
    let sum = 0n;
    for (let k = 1, sign = 1n; ; k++, sign = -sign) {
      const a = (k * (3 * k - 1)) / 2;
      if (a > m) break;
      sum += sign * p[m - a]!;
      const b = (k * (3 * k + 1)) / 2;
      if (b <= m) sum += sign * p[m - b]!;
    }
    p.push(sum);
  }
  return p[n]!;
}

test.each(readings)(
  "%s %j pages across 2^53 in the order of its reading",
  (head, p, count, element, oracle) => {
    const family = byHead.get(head)!;
    expect(family.bigSamples).toBeDefined();
    const kernel = kernelOn(ce, family, COMPILED_FAMILIES);
    const total = kernel.count(p) as bigint;
    expect(total).toBe(count());
    expect(total > MAX_SAFE).toBe(true);
    const join = [MAX_SAFE - 1n, MAX_SAFE, MAX_SAFE + 1n].filter((r) => r < total);
    const interpreted =
      DEEP && oracle
        ? kernelOn(ce, { ...family, bigSamples: undefined, fast: undefined } as EpsilFamily, {})
        : undefined;
    for (const r of [0n, 1n, ...join, total / 3n, total - 1n]) {
      const found = kernel.unrank(p, r);
      expect(found, `rank ${r}`).toEqual(element(r));
      expect(kernel.rank(found, p)).toBe(r);
      expect(kernel.valid(found, p)).toBe(true);
      if (interpreted !== undefined && r !== 0n) expect(found).toEqual(interpreted.unrank(p, r));
    }
  },
  120_000,
);

test("IntegerPartitions declines past the size its BigInt table is built for", () => {
  const kernel = kernelOn(ce, byHead.get("IntegerPartitions")!, COMPILED_FAMILIES);
  expect(() => kernel.unrank([1001], 10n ** 20n)).toThrow(/past 2\^53/);
});
