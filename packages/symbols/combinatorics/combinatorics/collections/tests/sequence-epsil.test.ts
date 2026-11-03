// The recurrence, factorial, Catalan-family and binary-digit sequences defined in Epsil
// (src/families/sequence-definitions.ts), held to references written here in bigints: the kernel from
// the definitions alone and the one with its TS fast path agree with them on the first terms, on
// membership and first places around them (some sequences dip early or repeat a term), on both sides of
// 2^53, far out where only the interpreter answers, and past what a definition can reach, where the
// answer is a decline and never a wrong one. DEEP_TESTS=1 goes farther out.

import { bareEngine } from "@enumeratio/engine/testing";
import { expect, test } from "vite-plus/test";
import { epsilKernelOn, isEpsilFamily, kernelOn, liftFamily } from "../src/families/epsil.ts";
import { entries as closedForm } from "../src/families/numeric-closed-form.ts";
import { UNWIRED } from "../src/families/numeric-definitions.ts";
import { entries as digits } from "../src/families/numeric-digits-primes.ts";
import { entries as recurrences } from "../src/families/numeric-recurrence.ts";
import { definitions } from "../src/families/sequence-definitions.ts";
import { needsBigint } from "../src/families/types.ts";

const ce = bareEngine();
const MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER);
const DEEP = process.env.DEEP_TESTS === "1";

type Terms = (count: number) => bigint[];
const iterate =
  (seed: bigint[], next: (t: bigint[]) => bigint): Terms =>
  (count) => {
    const out = [...seed];
    while (out.length < count) out.push(next(out));
    return out.slice(0, count);
  };
const back = (t: bigint[], j: number): bigint => t[t.length - j];
const products =
  (factor: (i: bigint) => bigint): Terms =>
  (count) => {
    const out: bigint[] = [];
    for (let i = 1n, f = 1n; out.length < count; i++) out.push((f *= factor(i)));
    return out;
  };

/** The binary digits of n: the parity of their number, and Stern's s(n) by the usual two-register loop. */
function weight(n: bigint): bigint {
  let parity = 0n;
  for (let m = n; m > 0n; m >>= 1n) parity ^= m & 1n;
  return parity;
}
function fusc(n: bigint): bigint {
  let [a, b] = [1n, 0n];
  for (let m = n; m > 0n; m >>= 1n)
    if ((m & 1n) === 0n) a += b;
    else b += a;
  return b;
}
const binomial = (n: number, k: number): bigint => {
  let r = 1n;
  for (let i = 1; i <= k; i++) r = (r * BigInt(n - k + i)) / BigInt(i);
  return r;
};

const catalan = iterate([1n], (t) => (back(t, 1) * 2n * BigInt(2 * t.length - 1)) / BigInt(t.length + 1));
const littleSchroder = iterate([1n, 1n], (t) => {
  const n = BigInt(t.length);
  return ((6n * n - 3n) * back(t, 1) - (n - 2n) * back(t, 2)) / (n + 1n);
});

/** Bell numbers as the row sums of the Stirling numbers of the second kind, S(n, k) = S(n − 1, k − 1) + k S(n − 1, k). */
const stirlingRows = (count: number): bigint[][] => {
  const rows: bigint[][] = [[1n]];
  while (rows.length < count) {
    const prev = rows[rows.length - 1];
    rows.push(Array.from({ length: prev.length + 1 }, (_, k) => (prev[k - 1] ?? 0n) + BigInt(k) * (prev[k] ?? 0n)));
  }
  return rows;
};
const bell: Terms = (count) => stirlingRows(count).map((row) => row.reduce((a, b) => a + b, 0n));
/** Fubini numbers as Σ k! S(n, k): the ordered set partitions, by block count. */
const fubini: Terms = (count) =>
  stirlingRows(count).map((row) => {
    let factorial = 1n;
    return row.reduce((sum, s, k) => sum + s * (factorial *= BigInt(Math.max(k, 1))), 0n);
  });
/** Partition numbers as the table p(n, k) of partitions of n into parts of at most k, all additions. */
const partitions: Terms = (count) => {
  const ways = Array.from({ length: count }, (_, n) => (n === 0 ? 1n : 0n));
  for (let part = 1; part < count; part++) for (let n = part; n < count; n++) ways[n] += ways[n - part];
  return ways;
};

/** The first `count` primes by a sieve of Eratosthenes, over a range doubled until it holds that many. */
const firstPrimes = (count: number): bigint[] => {
  for (let limit = 64; ; limit *= 2) {
    const composite = new Uint8Array(limit + 1);
    const primes: bigint[] = [];
    for (let k = 2; k <= limit && primes.length < count; k++) {
      if (composite[k] === 1) continue;
      primes.push(BigInt(k));
      for (let m = k * k; m <= limit; m += k) composite[m] = 1;
    }
    if (primes.length === count) return primes;
  }
};
/** The primorials p_1#, p_2#, …: running products of the sieve's primes. */
const primorials: Terms = (count) => {
  let product = 1n;
  return firstPrimes(count).map((p) => (product *= p));
};

/** The first `count` terms of each sequence, from their recurrences (a different formula than the definitions'). */
const TERMS: Record<string, Terms> = {
  FibonacciNumbers: iterate([0n, 1n], (t) => back(t, 1) + back(t, 2)),
  LucasNumbers: iterate([2n, 1n], (t) => back(t, 1) + back(t, 2)),
  JacobsthalNumbers: iterate([0n, 1n], (t) => back(t, 1) + 2n * back(t, 2)),
  PellNumbers: iterate([0n, 1n], (t) => 2n * back(t, 1) + back(t, 2)),
  TribonacciNumbers: iterate([0n, 0n, 1n], (t) => back(t, 1) + back(t, 2) + back(t, 3)),
  PadovanSequence: iterate([1n, 0n, 0n], (t) => back(t, 2) + back(t, 3)),
  PerrinSequence: iterate([3n, 0n, 2n], (t) => back(t, 2) + back(t, 3)),
  FactorialNumbers: products((i) => i),
  DoubleFactorialNumbers: products((i) => 2n * i - 1n),
  CatalanNumbers: catalan,
  PrimorialNumbers: primorials,
  MotzkinNumbers: (count) => {
    const cat = catalan(count + 1);
    return Array.from({ length: count }, (_, n) => {
      let sum = 0n;
      for (let k = 0; 2 * k <= n; k++) sum += binomial(n, 2 * k) * cat[k];
      return sum;
    });
  },
  BellNumbers: bell,
  FubiniNumbers: fubini,
  PartitionNumbers: partitions,
  CentralDelannoyNumbers: iterate([1n, 3n], (t) => {
    const n = BigInt(t.length);
    return (3n * (2n * n - 1n) * back(t, 1) - (n - 1n) * back(t, 2)) / n;
  }),
  LittleSchroderNumbers: littleSchroder,
  SchroederNumbers: (count) => littleSchroder(count).map((s, i) => (i === 0 ? 1n : 2n * s)),
  EvilNumbers: (count) => Array.from({ length: count }, (_, r) => 2n * BigInt(r) + weight(BigInt(r))),
  OdiousNumbers: (count) => Array.from({ length: count }, (_, r) => 2n * BigInt(r) + 1n - weight(BigInt(r))),
  ThueMorseNumbers: (count) => Array.from({ length: count }, (_, r) => weight(BigInt(r))),
  SternDiatomicSequence: (count) => Array.from({ length: count }, (_, r) => fusc(BigInt(r))),
};

/** Sequences whose terms grow (from a rank on), so a term is a member only of the first few thousand ranks. */
const growing = (head: string): boolean => !["ThueMorseNumbers", "SternDiatomicSequence"].includes(head);
const bitwise = (head: string): boolean =>
  ["EvilNumbers", "OdiousNumbers", "ThueMorseNumbers", "SternDiatomicSequence"].includes(head);

/** The term at rank `r` of a sequence of binary digits, at any size. */
const bitwiseTerm = (head: string, r: bigint): bigint =>
  head === "EvilNumbers"
    ? 2n * r + weight(r)
    : head === "OdiousNumbers"
      ? 2n * r + 1n - weight(r)
      : head === "ThueMorseNumbers"
        ? weight(r)
        : fusc(r);

/** How many ranks the exhaustive checks cover: the bit sequences are cheap, the sums dear. */
const RANKS: Record<string, number> = {
  EvilNumbers: 200,
  OdiousNumbers: 200,
  ThueMorseNumbers: 100,
  SternDiatomicSequence: 1000,
};
const ranksOf = (head: string): number => (DEEP ? 4 : 1) * (RANKS[head] ?? 150);

/** The first rank whose term a double can't hold (a sequence whose terms grow). */
const crossingOf = (head: string): number => TERMS[head](400).findIndex((term) => term > MAX_SAFE);

const found = [...closedForm, ...recurrences, ...digits];
const entry = (head: string) => liftFamily(found.find((f) => f.head === head)!);
const epsil = (head: string) => epsilKernelOn(ce, definitions.get(head)!);
const full = (head: string) => kernelOn(ce, entry(head));
const kernels = (head: string) =>
  [
    ["Epsil", epsil(head)],
    ["fast", full(head)],
  ] as const;

/** A term as the kernels return it: a number where it is exact in one, else the bigint. */
const asTerm = (x: bigint): number | bigint => (x <= MAX_SAFE ? Number(x) : x);

const answer = <T>(read: () => T): T | "declined" => {
  try {
    return read();
  } catch (error) {
    if (needsBigint(error)) return "declined";
    throw error;
  }
};

/** The first place of each value among `terms`. */
function firstPlaces(terms: bigint[]): Map<bigint, number> {
  const places = new Map<bigint, number>();
  terms.forEach((term, r) => {
    if (!places.has(term)) places.set(term, r);
  });
  return places;
}

test("the sequences are Epsil definitions with their TS kernels as fast paths, bar the unwired ones", () => {
  expect(definitions.size).toBe(Object.keys(TERMS).length);
  for (const head of definitions.keys()) {
    const family = entry(head);
    expect(isEpsilFamily(family), head).toBe(true);
    expect(kernelOn(ce, family).fast, head).toBe(UNWIRED.has(head) ? undefined : true);
    expect(epsil(head).fast, head).toBeUndefined();
  }
});

for (const head of definitions.keys()) {
  const terms = TERMS[head];
  // Past the crossing the interpreter answers each rank in turn: the far-out checks below hold it to account.
  // (The primorials' interpreted ranks cost a second each: their standard run stops at the last double.)
  const beyond = head === "PrimorialNumbers" && !DEEP ? 0 : 1;
  const count = bitwise(head) ? ranksOf(head) : Math.min(ranksOf(head), crossingOf(head) + (DEEP ? 4 : beyond));

  test(`${head}: the first terms, their first places and the numbers between`, () => {
    const sequence = terms(count);
    const places = firstPlaces(sequence);
    // A term past the last is no number's to judge here, but those below it are all known (these grow); Stern's
    // every number is a member, with a place where the first ranks reach it.
    const horizon = growing(head) ? sequence[count - 1] : head === "SternDiatomicSequence" ? (DEEP ? 60n : 30n) : 3n;
    const probes = new Set<bigint>();
    for (let x = -2n; x <= horizon && x < (DEEP ? 400n : 150n); x++) probes.add(x);
    for (const x of [...places.keys()].slice(0, DEEP ? 80 : 40))
      for (const d of [-1n, 0n, 1n]) if (x + d <= horizon) probes.add(x + d);
    for (const [name, kernel] of kernels(head)) {
      expect([name, kernel.count([])]).toEqual([name, Infinity]);
      sequence.forEach((term, r) => expect([name, r, kernel.unrank([], BigInt(r))]).toEqual([name, r, asTerm(term)]));
      for (const x of probes) {
        const member = head === "SternDiatomicSequence" ? x >= 0n : places.has(x);
        const place = places.get(x);
        expect([name, x, kernel.valid(asTerm(x), [])]).toEqual([name, x, member]);
        expect([name, x, kernel.rank(asTerm(x), [])]).toEqual([name, x, BigInt(place ?? -1)]);
      }
    }
  });

  if (bitwise(head)) {
    // Where the terms are no longer exact in doubles (2r is, past 2^52) or never leave them (a rank in the
    // trillions), ranks answer in closed form at any size, exactly.
    test(`${head}: ranks from 2^52 to 10^60 are answered exactly`, () => {
      const ranks = DEEP
        ? [2n ** 52n - 3n, 2n ** 52n, 2n ** 53n + 1n, 10n ** 15n, 10n ** 30n + 7n, 10n ** 60n + 123456789n]
        : [2n ** 52n - 3n, 2n ** 53n + 1n, 10n ** 30n + 7n];
      for (const [name, kernel] of kernels(head)) {
        for (const r of ranks) {
          const x = bitwiseTerm(head, r);
          expect([name, r, kernel.unrank([], r)]).toEqual([name, r, asTerm(x)]);
          if (head === "EvilNumbers" || head === "OdiousNumbers") {
            expect([name, r, kernel.valid(asTerm(x), [])]).toEqual([name, r, true]);
            expect([name, r, kernel.rank(asTerm(x), [])]).toEqual([name, r, r]);
            // The other parity, and the neighbours of a different weight, are no members.
            expect([name, r, kernel.valid(asTerm(x ^ 1n), [])]).toEqual([name, r, false]);
            expect([name, r, kernel.rank(asTerm(x ^ 1n), [])]).toEqual([name, r, -1n]);
          }
        }
      }
    });
  } else {
    // The first rank whose term a double can't hold; the interpreter answers from there.
    const sequence = terms(DEEP ? 1500 : 400);
    const crossing = crossingOf(head);
    const places = firstPlaces(sequence);

    test(`${head}: terms and places on either side of 2^53 are exact`, () => {
      for (let r = Math.max(0, crossing - (DEEP ? 4 : 1)); r < crossing + (DEEP ? 3 : 2); r++) {
        const x = sequence[r];
        // The primorials' interpreted membership and rank cost a second each past 2^53: the standard run takes the
        // unrank alone there (the far-out test below ranks one), and DEEP_TESTS the term and its neighbours.
        const ys = head === "PrimorialNumbers" && r >= crossing && !DEEP ? [] : [x - 1n, x, x + 1n];
        // Where the definition declines the rank, the fast path alone answers (the decline is held below).
        const early = definitions.get(head)!.early;
        const reached =
          early?.unrank?.(BigInt(r), []) !== "decline" &&
          ys.every((y) => early?.member?.(asTerm(y) as never, []) !== "decline");
        const usable = kernels(head).filter(([name]) => name !== "Epsil" || reached);
        for (const [name, kernel] of DEEP ? usable : usable.slice(0, 1)) {
          expect([name, r, kernel.unrank([], BigInt(r))]).toEqual([name, r, asTerm(x)]);
          for (const y of ys) {
            const place = places.get(y);
            expect([name, y, kernel.valid(asTerm(y), [])]).toEqual([name, y, place !== undefined]);
            expect([name, y, kernel.rank(asTerm(y), [])]).toEqual([name, y, BigInt(place ?? -1)]);
          }
        }
      }
    });

    // Far out the terms are bigints of hundreds of digits: the first place of each, and the numbers beside it, are exact.
    test(`${head}: terms hundreds of digits long are exact, with their places`, () => {
      // A sum of binomials costs more the farther out it goes.
      const summed = ["Motzkin", "Delannoy", "Schroder", "Schroeder", "Bell", "Fubini", "Partition"].some((name) =>
        head.includes(name),
      );
      // The definition trial-divides, so it reaches 50 ranks (200 bits): rank 15 has 66 bits, rank 30 has 183.
      const out =
        head === "PrimorialNumbers"
          ? DEEP
            ? [15, 30, 50]
            : [15]
          : summed
            ? DEEP
              ? ["Bell", "Fubini", "Partition"].some((name) => head.includes(name))
                ? [50, 120, 150]
                : [50, 120, 250, 399]
              : [50]
            : DEEP
              ? [120, 250, 399, 1000, 1499]
              : ["PadovanSequence", "PerrinSequence"].includes(head)
                ? [300]
                : [120];
      for (const r of out) {
        const x = sequence[r];
        // The fast path passes on its own bigint terms; membership and places are the interpreter's.
        expect([r, full(head).unrank([], BigInt(r))]).toEqual([r, asTerm(x)]);
        const kernel = epsil(head);
        expect([r, kernel.unrank([], BigInt(r))]).toEqual([r, asTerm(x)]);
        // A member too big to scan for in a second or two is declined, a member never denied.
        if (definitions.get(head)!.early?.member?.(x as never, []) === "decline") {
          expect([r, answer(() => kernel.valid(asTerm(x) as never, []))]).toEqual([r, "declined"]);
          expect([r, answer(() => kernel.rank(asTerm(x) as never, []))]).toEqual([r, "declined"]);
          continue;
        }
        expect([r, kernel.valid(asTerm(x) as never, [])]).toEqual([r, true]);
        expect([r, kernel.rank(asTerm(x) as never, [])]).toEqual([r, BigInt(places.get(x)!)]);
        for (const y of DEEP ? [x - 1n, x + 1n, 2n * x, x / 2n] : [x + 1n])
          if (!places.has(y)) {
            expect([r, y, kernel.valid(y as never, [])]).toEqual([r, y, false]);
            expect([r, y, kernel.rank(y as never, [])]).toEqual([r, y, -1n]);
          }
      }
    });

    // Never wrong: a rank or a number out of reach is a decline, and a member is never denied.
    test(`${head}: what is out of reach is declined, never answered wrong`, () => {
      const kernel = epsil(head);
      for (const r of [10n ** 6n, 10n ** 30n, 2n ** 60n])
        expect([r, answer(() => kernel.unrank([], r))]).toEqual([r, "declined"]);
      // A number of 30000 bits, member or not, is no one's to scan the ranks for.
      for (const x of [2n ** 30_000n, 3n ** 20_000n + 1n]) {
        const verdict = answer(() => kernel.valid(x as never, []));
        expect([head, verdict === true]).toEqual([head, false]);
      }
    });
  }
}

// The TS kernels answered a rank of tens of thousands; the fast path keeps that reach (Epsil alone stops far short of it).
test("the fast path answers ranks of thousands and tens of thousands, exactly", () => {
  for (const head of definitions.keys()) {
    if (bitwise(head) || head === "MotzkinNumbers") continue; // Motzkin's reference sums binomials, too slow this far out
    if (["BellNumbers", "FubiniNumbers"].includes(head)) continue; // the kernels' own reach is a few hundred terms
    const r = head.includes("Factorial") ? 2000 : 3000;
    expect([head, full(head).unrank([], BigInt(r))]).toEqual([head, TERMS[head](r + 1)[r]]);
  }
  const fibonacci = full("FibonacciNumbers");
  const far = fibonacci.unrank([], 100_000n) as unknown as bigint;
  expect(far.toString().length).toBe(20899);
  // Fibonacci's identity F(2n) = F(n)(2F(n+1) - F(n)), one rank down the middle.
  const [a, b] = [
    fibonacci.unrank([], 40_000n) as unknown as bigint,
    fibonacci.unrank([], 40_001n) as unknown as bigint,
  ];
  expect(fibonacci.unrank([], 80_000n)).toBe(a * (2n * b - a));
  expect(answer(() => fibonacci.unrank([], 100_001n))).toBe("declined");
});

test("Stern's first places are searched to a limit, then declined", () => {
  // The first index of each value among the first 300000 numbers.
  const places = firstPlaces(TERMS.SternDiatomicSequence(300_000));
  for (const [name, kernel] of kernels("SternDiatomicSequence")) {
    for (const x of [100n, 255n, 500n, 987n, 1000n])
      expect([name, x, kernel.rank(Number(x), [])]).toEqual([name, x, BigInt(places.get(x)!)]);
    // Every integer is a member; past 1000 the rank is not searched.
    expect([name, kernel.valid(1001, [])]).toEqual([name, true]);
    expect([name, answer(() => kernel.rank(1001, []))]).toEqual([name, "declined"]);
    expect([name, answer(() => kernel.rank((10n ** 30n) as never, []))]).toEqual([name, "declined"]);
    expect([name, kernel.valid((10n ** 30n) as never, [])]).toEqual([name, true]);
  }
});

test("Evil and odious numbers split the integers, and a negative number is neither", () => {
  for (const [name, kernel] of [...kernels("EvilNumbers"), ...kernels("OdiousNumbers")]) {
    for (const x of [-1, -2, -1000]) expect([name, x, kernel.valid(x, [])]).toEqual([name, x, false]);
  }
  const [evil, odious] = [epsil("EvilNumbers"), epsil("OdiousNumbers")];
  for (let x = 0; x < 300; x++)
    expect([x, evil.valid(x, []), odious.valid(x, [])].slice(1).filter(Boolean).length).toBe(1);
});

// Values as the OEIS lists them (A000110, A000670, A000041), the last of each past 2^53 where the definition reaches.
const LISTED: readonly (readonly [string, number, bigint])[] = [
  ["BellNumbers", 25, 4638590332229999353n],
  ["BellNumbers", 30, 846749014511809332450147n],
  ["FubiniNumbers", 10, 102247563n],
  ["PartitionNumbers", 100, 190569292n],
  ["PartitionNumbers", 200, 3972999029388n],
];

test("Bell, Fubini and partition numbers at the values the OEIS lists", () => {
  for (const [head, r, term] of LISTED) {
    for (const [name, kernel] of kernels(head)) {
      expect([head, name, r, kernel.unrank([], BigInt(r))]).toEqual([head, name, r, asTerm(term)]);
      expect([head, name, r, kernel.rank(asTerm(term), [])]).toEqual([head, name, r, BigInt(r)]);
    }
  }
});

// A002110, a(n) the product of the first n primes: the sequence starts at n = 1 here, so a(n) is the term at rank n − 1.
// Ranks 12 and 13 straddle 2^53; the interpreter answers the last three.
const A002110: readonly (readonly [number, bigint])[] = [
  [0, 2n],
  [1, 6n],
  [5, 30030n],
  [9, 6469693230n],
  [12, 304250263527210n],
  [13, 13082761331670030n],
  [14, 614889782588491410n],
  [15, 32589158477190044730n],
  [16, 1922760350154212639070n],
];

test("primorial numbers at the values the OEIS lists, on either side of 2^53", () => {
  for (const [r, term] of A002110) {
    // A term past 2^53 costs the interpreter a second to rank and check: the standard run takes its unrank alone.
    const interpreted = term > MAX_SAFE;
    for (const [name, kernel] of kernels("PrimorialNumbers")) {
      if (interpreted && !DEEP && name === "fast") continue;
      expect([name, r, kernel.unrank([], BigInt(r))]).toEqual([name, r, asTerm(term)]);
      if (interpreted && !DEEP) continue;
      expect([name, r, kernel.rank(asTerm(term), [])]).toEqual([name, r, BigInt(r)]);
      expect([name, r, kernel.valid(asTerm(term), [])]).toEqual([name, r, true]);
    }
  }
  expect(A002110[4][1] <= MAX_SAFE && A002110[5][1] > MAX_SAFE).toBe(true);
});

test("primorial numbers: the empty product is no member, nor is a number between or beside two", () => {
  for (const [name, kernel] of kernels("PrimorialNumbers")) {
    for (const x of [-30, -1, 0, 1, 3, 12, 29, 31, 60, 209, 211, 2309, 2311]) {
      expect([name, x, kernel.valid(x, [])]).toEqual([name, x, false]);
      expect([name, x, kernel.rank(x, [])]).toEqual([name, x, -1n]);
    }
  }
});

test("primorial numbers: the primes a rank or a number needs are within the definition's range, every term of the kernel", () => {
  // A number x of b = ⌊log₂ x⌋ + 1 bits is met or passed by the primorial of at most ⌊(b − 1)/2⌋ + 2 primes (the
  // bound of the definition's rank and membership). Held against the first 400 primorials and each one's two neighbours.
  const terms = primorials(400);
  const floorLog2 = (x: bigint): number => x.toString(2).length - 1;
  const primesNeeded = (x: bigint): number => terms.findIndex((term) => term >= x) + 1;
  for (const term of terms)
    for (const x of [term - 1n, term, term + 1n]) {
      if (x < 2n) continue;
      expect([x, primesNeeded(x) <= Math.floor(floorLog2(x) / 2) + 2]).toEqual([x, true]);
    }
});

test("primorial numbers: the fast path answers to its reach, and Epsil alone stops at its own", () => {
  const fast = full("PrimorialNumbers");
  const reference = primorials(10_001);
  for (const r of [100, 1234, 5000, 10_000]) expect([r, fast.unrank([], BigInt(r))]).toEqual([r, asTerm(reference[r])]);
  expect(answer(() => fast.unrank([], 10_001n))).toBe("declined");
  // The definition declines at once, and never answers a wrong term, past 50 ranks and 200 bits.
  const epsilOnly = epsil("PrimorialNumbers");
  expect(answer(() => epsilOnly.unrank([], 51n))).toBe("declined");
  expect(answer(() => epsilOnly.valid(reference[50] as never, []))).toBe("declined");
  expect(answer(() => epsilOnly.rank(reference[60] as never, []))).toBe("declined");
  // The fast path takes a number of that size (a member, a rank to find) without the interpreter.
  expect(fast.valid(reference[60] as never, [])).toBe(true);
  expect(fast.rank(reference[60] as never, [])).toBe(60n);
  expect(fast.valid((reference[60] + 1n) as never, [])).toBe(false);
});

test("a negative rank is outside the fiber", () => {
  for (const head of definitions.keys()) {
    expect(() => epsil(head).unrank([], -1n), head).toThrow(RangeError);
    expect(() => full(head).unrank([], -1n), head).toThrow(RangeError);
  }
});

test("a number that is not an integer, or not a number, is no member", () => {
  for (const head of definitions.keys())
    for (const [name, kernel] of kernels(head))
      for (const x of [1.5, Number.NaN, Number.POSITIVE_INFINITY, [1]])
        expect([head, name, x, kernel.valid(x as never, [])]).toEqual([head, name, x, false]);
});

// The definitions as the interpreter reads them, bypassing compiled code and the fast paths.
for (const [head, family] of definitions) {
  test(`${head}: the interpreted definition gives the same terms and places`, async () => {
    const { evaluateEpsil } = await import("@enumeratio/structures");
    const sequence = TERMS[head](24);
    const places = firstPlaces(sequence);
    sequence.slice(0, DEEP ? 9 : 5).forEach((term, r) => {
      expect([head, r, evaluateEpsil(ce, family.epsil.unrank, { _r: r })]).toEqual([head, r, Number(term)]);
      expect([head, r, evaluateEpsil(ce, family.epsil.rank, { _x: Number(term) })]).toEqual([
        head,
        r,
        places.get(term),
      ]);
    });
    for (let x = 0; x < (DEEP ? 20 : 8); x++) {
      const member = head === "SternDiatomicSequence" ? true : places.has(BigInt(x));
      expect([head, x, evaluateEpsil(ce, family.epsil.valid, { _x: x })]).toEqual([head, x, member ? "True" : "False"]);
    }
  });
}
