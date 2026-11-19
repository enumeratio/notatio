// The canonical form of a poset against brute force: every natural labeling, its code read off the pairs in lex order.
import { expect, test } from "vite-plus/test";
import {
  canonicalCode,
  canonicalPoset,
  codeOf,
  indexOfCode,
  isCanonical,
  isPosetMember,
  MAX_LISTED,
  posetAt,
  posetCodes,
  posetRank,
  valueOfCode,
} from "../src/canonical.ts";
import { isPoset, posetsOfSize, strictOrder } from "./poset-findstat-readings.ts";

const DEEP = process.env.DEEP_TESTS === "1";

/** The pairs (a < b) in lex order, 1-based: pair k is bit k − 1 of a code. */
const pairs = (n: number): [number, number][] =>
  Array.from({ length: n }, (_, a) => a + 1).flatMap((a) =>
    Array.from({ length: n - a }, (_, k) => [a, a + 1 + k] as [number, number]),
  );

/** The code of the strict order `less` (indexed from 0), as read off the pairs. */
const codeOfOrder = (less: readonly (readonly boolean[])[]): number =>
  pairs(less.length).reduce((code, [a, b], k) => code + (less[a - 1]![b - 1] ? 2 ** k : 0), 0);

const permutations = (n: number): number[][] =>
  n === 0
    ? [[]]
    : permutations(n - 1).flatMap((rest) =>
        Array.from({ length: n }, (_, at) => [...rest.slice(0, at), n - 1, ...rest.slice(at)]),
      );

/** The least code over the natural relabelings of `value`. */
function bruteCode(value: readonly (readonly number[])[]): number {
  const n = value.length;
  const less = strictOrder(value);
  let least = Number.POSITIVE_INFINITY;
  for (const label of permutations(n)) {
    // `label[x]` is the new place of element x.
    let natural = true;
    for (let x = 0; x < n && natural; x++)
      for (let y = 0; y < n; y++) if (less[x]![y] && label[x]! > label[y]!) natural = false;
    if (!natural) continue;
    const moved = Array.from({ length: n }, () => Array.from({ length: n }, () => false));
    for (let x = 0; x < n; x++) for (let y = 0; y < n; y++) moved[label[x]!]![label[y]!] = less[x]![y]!;
    least = Math.min(least, codeOfOrder(moved));
  }
  return least;
}

const LARGEST = DEEP ? 6 : 5;
/** The standard run lists to 7 elements (some 50 ms); the list of 8 takes a third of a second and 9 five seconds, so they are DEEP's. */
const LISTED = DEEP ? MAX_LISTED : 7;

test("the code of a value is the rank of its comparability graph", () => {
  for (let n = 0; n <= 4; n++)
    for (const p of posetsOfSize(n)) expect(codeOf(p), JSON.stringify(p)).toBe(codeOfOrder(strictOrder(p)));
});

test("a code gives back its value", () => {
  for (let n = 0; n <= 5; n++)
    for (const p of posetsOfSize(n)) expect(valueOfCode(n, codeOf(p)), JSON.stringify(p)).toEqual(p);
});

test("a code that is no strict order gives no value", () => {
  // 1 < 2 and 2 < 3 without 1 < 3: bits of (1, 2) and (2, 3).
  expect(valueOfCode(3, 1 + 4)).toBeUndefined();
  expect(valueOfCode(3, 1 + 2 + 4)).toEqual([[], [1], [2]]);
});

test(`the canonical code equals the least code over all natural labelings, through ${LARGEST} elements`, () => {
  for (let n = 0; n <= LARGEST; n++)
    for (const p of posetsOfSize(n)) {
      expect(isPoset(p)).toBe(true);
      expect(canonicalCode(p), JSON.stringify(p)).toBe(n < 2 ? 0 : bruteCode(p));
    }
});

test("the canonical poset has the canonical code and is canonical", () => {
  for (let n = 0; n <= 5; n++)
    for (const p of posetsOfSize(n)) {
      const canonical = canonicalPoset(p);
      expect(isPoset(canonical)).toBe(true);
      expect(codeOf(canonical)).toBe(canonicalCode(p));
      expect(isCanonical(canonical)).toBe(true);
      expect(canonicalPoset(canonical)).toEqual(canonical);
    }
});

test("every relabeling of a poset canonicalizes alike", () => {
  for (let n = 2; n <= 5; n++)
    for (const p of posetsOfSize(n)) {
      const less = strictOrder(p);
      for (const label of permutations(n)) {
        let natural = true;
        for (let x = 0; x < n; x++)
          for (let y = 0; y < n; y++) if (less[x]![y] && label[x]! > label[y]!) natural = false;
        if (!natural) continue;
        const moved = Array.from({ length: n }, () => Array.from({ length: n }, () => false));
        for (let x = 0; x < n; x++) for (let y = 0; y < n; y++) moved[label[x]!]![label[y]!] = less[x]![y]!;
        const code = codeOfOrder(moved);
        expect(canonicalCode(valueOfCode(n, code)!), `${JSON.stringify(p)} ${label.join(",")}`).toBe(canonicalCode(p));
      }
    }
});

const COUNTS = [1, 1, 2, 5, 16, 63, 318, 2045, 16999, 183231];

test("the list has A000112's lengths, ascending, the antichain first and the chain last", () => {
  for (let n = 0; n <= LISTED; n++) {
    const list = posetCodes(n);
    expect(list.length, `n = ${n}`).toBe(COUNTS[n]);
    for (let k = 1; k < list.length; k++) expect(list[k]! > list[k - 1]!).toBe(true);
    expect(list[0]).toBe(0);
    if (n >= 1) expect(list[list.length - 1]).toBe(2 ** ((n * (n - 1)) / 2) - 1);
  }
});

test("the list is every code that is a strict order and its own canonical code, through 5 elements", () => {
  for (let n = 0; n <= 5; n++) {
    const found: number[] = [];
    for (let code = 0; code < 2 ** ((n * (n - 1)) / 2); code++) {
      const value = valueOfCode(n, code);
      if (value !== undefined && bruteCode(value) === (n < 2 ? 0 : code)) found.push(code);
    }
    expect(Array.from(posetCodes(n)), `n = ${n}`).toEqual(found);
  }
});

test("heredity: a canonical code shifted right by n − 1 is canonical on n − 1", () => {
  for (let n = 2; n <= LISTED; n++) {
    const below = posetCodes(n - 1);
    const shift = 2 ** (n - 1);
    for (const code of posetCodes(n))
      expect(indexOfCode(below, Math.floor(code / shift)), `${n}: ${code}`).toBeGreaterThanOrEqual(0);
  }
});

test("the list's members are exactly the canonical values", () => {
  for (let n = 0; n <= Math.min(LISTED, 7); n++) {
    const list = posetCodes(n);
    for (let r = 0; r < list.length; r++) {
      const value = posetAt(n, r);
      expect(isPosetMember(value, n)).toBe(true);
      expect(posetRank(value)).toBe(r);
    }
  }
  // Every value through 5 elements is a member exactly when it is its own canonical form.
  for (let n = 0; n <= 5; n++)
    for (const p of posetsOfSize(n))
      expect(isPosetMember(p, n), JSON.stringify(p)).toBe(JSON.stringify(canonicalPoset(p)) === JSON.stringify(p));
});

test("a value that is not a reduced natural poset is no member", () => {
  expect(isPosetMember([[], [1], [1, 2]], 3)).toBe(false);
  expect(isPosetMember([[], [2]], 2)).toBe(false);
  expect(isPosetMember([[], []], 3)).toBe(false);
  expect(isPosetMember("poset", 2)).toBe(false);
});

test("past the largest listed size the kernel declines", () => {
  expect(() => posetCodes(MAX_LISTED + 1)).toThrow(RangeError);
  expect(() => canonicalCode(Array.from({ length: 11 }, () => []))).toThrow(RangeError);
});
