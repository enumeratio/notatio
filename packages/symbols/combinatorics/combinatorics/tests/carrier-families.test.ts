// The families written for carriers that had only a type shape (KDyckPaths, RationalDyckPaths,
// RookPlacements, HyperbinaryWords, DecoratedPermutations, AscentSequences, MultiplicativePartitions,
// OrderedFactorizations), each against an independent reading: every element listed by
// brute force in the family's order, so count, unrank, rank and membership are all held to it.

import { bareEngine } from "@notatio/engine/testing";
import { expect, test } from "vite-plus/test";
import { epsilKernelOn } from "../collections/src/families/epsil.ts";
import { dyckPaths } from "../lattice-paths/src/families/core.ts";
import { kDyckPaths, rationalDyckPaths } from "../lattice-paths/src/families/slope-paths.ts";
import { orderedFactorizations } from "../compositions/src/families/ordered-factorizations.ts";
import { multiplicativePartitions } from "../partitions/src/families/multiplicative-partitions.ts";
import { decoratedPermutations } from "../permutations/src/families/decorated-permutations.ts";
import { rookPlacements } from "../permutations/src/families/rook-placements.ts";
import { ascentSequences } from "../words/src/families/ascent-sequences.ts";
import { hyperbinaryWords } from "../words/src/families/hyperbinary.ts";

const ce = bareEngine();
const kernel = (family: Parameters<typeof epsilKernelOn>[1]) => epsilKernelOn(ce, family);

/** The family at `params` equals `expected` in order, and each member ranks back to its place. */
function holds(family: Parameters<typeof epsilKernelOn>[1], params: number[], expected: number[][]): void {
  const k = kernel(family);
  expect(k.count(params)).toBe(BigInt(expected.length));
  expected.forEach((element, r) => {
    expect(k.unrank(params, BigInt(r))).toEqual(element);
    expect(k.rank(element, params)).toBe(BigInt(r));
    expect(k.valid(element, params)).toBe(true);
  });
}

/** Every word of `length` over `alphabet`, lexicographically with the alphabet's own order. */
const words = (length: number, alphabet: readonly number[]): number[][] =>
  length === 0 ? [[]] : words(length - 1, alphabet).flatMap((w) => alphabet.map((a) => [...w, a]));

/** The words that are walks: `up` the token that adds `rise`, 0 the token that takes `fall`, never
 *  below 0 and ending at 0. Order: 1 before 0. */
const walks = (length: number, rise: number, fall: number): number[][] =>
  words(length, [1, 0]).filter((w) => {
    let y = 0;
    for (const t of w) {
      y += t === 1 ? rise : -fall;
      if (y < 0) return false;
    }
    return y === 0;
  });

const binomial = (n: number, k: number): number => {
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return Math.round(r);
};
const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

test("KDyckPaths(n, k): the Fuss-Catalan words, and DyckPaths at k = 1", () => {
  for (const [n, k] of [
    [0, 2],
    [2, 2],
    [3, 2],
    [2, 3],
    [3, 1],
  ] as const) {
    const expected = walks((k + 1) * n, k, 1);
    expect(expected.length).toBe(n === 0 ? 1 : Math.round(binomial((k + 1) * n, n) / (k * n + 1)));
    holds(kDyckPaths, [n, k], expected);
  }
  for (let n = 0; n <= 4; n++) {
    const dyck = kernel(dyckPaths);
    const k = kernel(kDyckPaths);
    for (let r = 0n; r < dyck.count([n]); r++) expect(k.unrank([n, 1], r)).toEqual(dyck.unrank([n], r));
  }
});

test("KDyckPaths membership: near misses are not members", () => {
  const k = kernel(kDyckPaths);
  for (const w of words(7, [1, 0])) expect(k.valid(w, [2, 2])).toBe(false); // length 6 wanted
  const want = new Set(walks(6, 2, 1).map((w) => w.join()));
  for (const w of words(6, [1, 0])) expect(k.valid(w, [2, 2])).toBe(want.has(w.join()));
  expect(k.valid([1, 0, 2, 0, 0, 0], [2, 2])).toBe(false);
});

test("RationalDyckPaths(a, b): the paths weakly above the line, and DyckPaths at a = b", () => {
  for (const [a, b] of [
    [2, 1],
    [3, 2],
    [2, 3],
    [4, 3],
    [4, 2],
    [3, 3],
  ] as const) {
    // North (1) a step up in y, east (0) a step in x: a·y ≥ b·x throughout, a east and b north steps.
    const expected = words(a + b, [1, 0]).filter((w) => {
      let x = 0;
      let y = 0;
      for (const t of w) {
        if (t === 1) y++;
        else x++;
        if (a * y < b * x) return false;
      }
      return x === a && y === b;
    });
    if (gcd(a, b) === 1) expect(expected.length).toBe(binomial(a + b, a) / (a + b));
    holds(rationalDyckPaths, [a, b], expected);
  }
  for (let n = 0; n <= 4; n++) {
    const dyck = kernel(dyckPaths);
    const rational = kernel(rationalDyckPaths);
    for (let r = 0n; r < dyck.count([n]); r++) expect(rational.unrank([n, n], r)).toEqual(dyck.unrank([n], r));
  }
});

/** The partial injections of [n] as lists, 0 for a row without a rook, in lex order. */
function rooks(n: number): number[][] {
  const place = (row: number, used: readonly number[]): number[][] =>
    row === n
      ? [[]]
      : [0, ...Array.from({ length: n }, (_, i) => i + 1).filter((c) => !used.includes(c))].flatMap((c) =>
          place(row + 1, c === 0 ? used : [...used, c]).map((rest) => [c, ...rest]),
        );
  return place(0, []);
}

test("RookPlacements(n): the partial injections, sum of C(n, k)^2 k!", () => {
  const factorial = (k: number): number => (k <= 1 ? 1 : k * factorial(k - 1));
  for (let n = 0; n <= 3; n++) {
    const expected = rooks(n);
    expect(expected.length).toBe(
      Array.from({ length: n + 1 }, (_, k) => binomial(n, k) ** 2 * factorial(k)).reduce((s, v) => s + v, 0),
    );
    holds(rookPlacements, [n], expected);
  }
  // 1, 2, 7, 34, 209, 1546.
  expect([0, 1, 2, 3, 4, 5].map((n) => Number(kernel(rookPlacements).count([n])))).toEqual([1, 2, 7, 34, 209, 1546]);
});

test("RookPlacements membership: near misses are not members", () => {
  const k = kernel(rookPlacements);
  const want = new Set(rooks(3).map((w) => w.join()));
  for (const w of words(3, [0, 1, 2, 3, 4])) expect(k.valid(w, [3])).toBe(want.has(w.join()));
  expect(k.valid([1, 0], [3])).toBe(false);
  expect(k.valid([1, 0, 0, 0], [3])).toBe(false);
});

/** The hyperbinary representations of n, most significant digit first, ordered by the last digit
 *  and then the rest (the order the family states): by the digits read from the least significant. */
function hyperbinary(n: number): number[][] {
  const all = (m: number): number[][] => {
    if (m === 0) return [[]];
    const out: number[][] = [];
    for (const d of m % 2 === 1 ? [1] : [0, 2])
      if (m - d >= 0) for (const rest of all((m - d) / 2)) out.push([...rest, d]);
    return out;
  };
  const key = (w: number[]): number[] => w.toReversed();
  const less = (a: number[], b: number[]): number => {
    for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] !== b[i]) return a[i]! - b[i]!;
    return a.length - b.length;
  };
  return all(n).toSorted((a, b) => less(key(a), key(b)));
}

test("HyperbinaryWords(n): the representations by digits 0 to 2, Stern's diatomic counts", () => {
  for (let n = 0; n <= 18; n++) {
    const expected = hyperbinary(n);
    // Each is a sum of powers of two used at most twice.
    for (const w of expected) {
      expect(w.reduce((v, d) => 2 * v + d, 0)).toBe(n);
      expect(w.length === 0 || w[0] !== 0).toBe(true);
    }
    holds(hyperbinaryWords, [n], expected);
  }
  // s(n + 1): 1, 1, 2, 1, 3, 2, 3, 1, 4, 3, 5, 2, 5, 3, 4, 1.
  expect([...Array(16).keys()].map((n) => Number(kernel(hyperbinaryWords).count([n])))).toEqual([
    1, 1, 2, 1, 3, 2, 3, 1, 4, 3, 5, 2, 5, 3, 4, 1,
  ]);
});

test("HyperbinaryWords membership: wrong value, leading zero, digit 3", () => {
  const k = kernel(hyperbinaryWords);
  expect(k.valid([1, 0, 0], [4])).toBe(true);
  expect(k.valid([0, 1, 0, 0], [4])).toBe(false);
  expect(k.valid([1, 0, 1], [4])).toBe(false);
  expect(k.valid([3, 1], [7])).toBe(false);
  expect(k.valid([], [0])).toBe(true);
  expect(k.valid([0], [0])).toBe(false);
});

/** Every permutation of 1..n in lex order, then each fixed point −j before +j: the decorated permutations. */
function decorated(n: number): number[][] {
  const place = (row: number, used: readonly number[]): number[][] => {
    if (row > n) return [[]];
    const out: number[][] = [];
    for (let u = 1; u <= n; u++) {
      if (used.includes(u)) continue;
      for (const e of u === row ? [-u, u] : [u])
        for (const rest of place(row + 1, [...used, u])) out.push([e, ...rest]);
    }
    return out;
  };
  return place(1, []);
}

test("DecoratedPermutations(n): signed fixed points, sum of C(n, k) (n - k)! (A000522)", () => {
  for (let n = 0; n <= 5; n++) holds(decoratedPermutations, [n], decorated(n));
  expect([0, 1, 2, 3, 4, 5, 6, 7].map((n) => Number(kernel(decoratedPermutations).count([n])))).toEqual([
    1, 2, 5, 16, 65, 326, 1957, 13700,
  ]);
});

test("DecoratedPermutations membership: near misses are not members", () => {
  const k = kernel(decoratedPermutations);
  const want = new Set(decorated(3).map((w) => w.join()));
  for (const w of words(3, [-3, -2, -1, 0, 1, 2, 3, 4])) expect(k.valid(w, [3])).toBe(want.has(w.join()));
  expect(k.valid([1, 2], [3])).toBe(false);
  expect(k.valid([-2, 1, 3], [3])).toBe(false); // a negative entry that is no fixed point
});

/** The ascent sequences of length n, lexicographically. */
function ascentSeqs(n: number): number[][] {
  const grow = (seq: number[], asc: number): number[][] =>
    seq.length === n
      ? [seq]
      : Array.from({ length: asc + 2 }, (_, v) => v).flatMap((v) =>
          grow([...seq, v], asc + (v > seq[seq.length - 1]! ? 1 : 0)),
        );
  return n === 0 ? [[]] : grow([0], 0);
}

test("AscentSequences(n): the Fishburn numbers (A022493)", () => {
  for (let n = 0; n <= 6; n++) holds(ascentSequences, [n], ascentSeqs(n));
  expect([0, 1, 2, 3, 4, 5, 6, 7, 8].map((n) => Number(kernel(ascentSequences).count([n])))).toEqual([
    1, 1, 2, 5, 15, 53, 217, 1014, 5335,
  ]);
});

test("AscentSequences membership: near misses are not members", () => {
  const k = kernel(ascentSequences);
  const want = new Set(ascentSeqs(4).map((w) => w.join()));
  for (const w of words(4, [-1, 0, 1, 2, 3])) expect(k.valid(w, [4])).toBe(want.has(w.join()));
  expect(k.valid([0, 1, 2], [4])).toBe(false);
  expect(k.valid([], [0])).toBe(true);
});

/** The factorizations of n into factors above 1, as lists in lex order, with `ordered` or nonincreasing. */
function factorizations(n: number, ordered: boolean): number[][] {
  const go = (m: number, bound: number): number[][] =>
    m === 1
      ? [[]]
      : Array.from({ length: Math.min(m, bound) - 1 }, (_, i) => i + 2)
          .filter((f) => m % f === 0)
          .flatMap((f) => go(m / f, ordered ? m : f).map((rest) => [f, ...rest]));
  return n < 1 ? [] : go(n, n);
}

test("MultiplicativePartitions(n): unordered factorizations (A001055)", () => {
  for (let n = 0; n <= 30; n++) holds(multiplicativePartitions, [n], factorizations(n, false));
  expect([...Array(13).keys()].map((n) => Number(kernel(multiplicativePartitions).count([n])))).toEqual([
    0, 1, 1, 1, 2, 1, 2, 1, 3, 2, 2, 1, 4,
  ]);
});

test("OrderedFactorizations(n): ordered factorizations (A074206)", () => {
  for (let n = 0; n <= 30; n++) holds(orderedFactorizations, [n], factorizations(n, true));
  expect([...Array(13).keys()].map((n) => Number(kernel(orderedFactorizations).count([n])))).toEqual([
    0, 1, 1, 1, 2, 1, 3, 1, 4, 2, 3, 1, 8,
  ]);
});

test("Factorization membership: near misses are not members", () => {
  const multiplicative = kernel(multiplicativePartitions);
  const ordered = kernel(orderedFactorizations);
  for (const w of words(3, [1, 2, 3, 4, 6, 12])) {
    expect(multiplicative.valid(w, [12])).toBe(factorizations(12, false).some((f) => f.join() === w.join()));
    expect(ordered.valid(w, [12])).toBe(factorizations(12, true).some((f) => f.join() === w.join()));
  }
  expect(multiplicative.valid([], [1])).toBe(true);
  expect(multiplicative.valid([], [0])).toBe(false);
  expect(multiplicative.valid([2, 3], [6])).toBe(false); // not nonincreasing
  expect(ordered.valid([2, 3], [6])).toBe(true);
});
