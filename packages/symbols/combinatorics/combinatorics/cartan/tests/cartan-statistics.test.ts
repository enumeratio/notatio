import { bareEngine } from "@enumeratio/engine/testing";
import { expect, test } from "vite-plus/test";
import { declareCombinatorics } from "../../src/index.ts";
import { applyDefinition } from "../../src/statistics/declare.ts";
import { bySignature } from "../../src/statistics/types.ts";
import { CARTAN_LETTERS } from "../src/carrier-data.ts";
import { cartanTypesUpTo } from "../src/sample-types.ts";
import { CARTAN_STATISTICS } from "../src/statistics.ts";
import {
  adjointDimension,
  cartanMatrix,
  type CartanType,
  centerSize,
  classicalCatalan,
  conjugacyClassCount,
  connectedElementCount,
  connectedFromParabolicOrders,
  classicalPositiveCatalan,
  commutativeRoots,
  coxeterClassSize,
  coxeterNumberFromRoots,
  coxeterNumberOf,
  determinant,
  dualCoxeterFromRoots,
  dynkinIndex,
  elementOrderLeastCommonMultiple,
  exponentsFromRoots,
  factorizationCount,
  firstFundamentalDimension,
  fullSupportRoots,
  fullyCommutativeCount,
  fussFromRoots,
  gammaFromRoots,
  grassmannianCount,
  grassmannianFromIndices,
  groupOrder,
  heightSum,
  highestRoot,
  highestRootPairing,
  involutionClassCount,
  involutionCount,
  involutionsFromOrthogonalRoots,
  largestFundamentalDimension,
  minimalFaithfulDimension,
  minusculeCount,
  parabolicSubgroupCount,
  permanent,
  poincareCoefficients,
  positiveRoots,
  quasiMinusculeDimension,
  reflectionOrbitsFromRoots,
  rowmotionOrder,
  smallestFundamentalOrbit,
} from "./cartan-findstat-readings.ts";

// The whole library, as a page evaluates it.
const ce = bareEngine();
declareCombinatorics(ce);
const index = bySignature(CARTAN_STATISTICS);

const DEEP = process.env.DEEP_TESTS === "1";
const typesUpTo = (rank: number): CartanType[] =>
  cartanTypesUpTo(rank).map((contents) => {
    const [, letter, n] = contents as [string, string, number];
    return [letter.slice(1, -1), n] as const;
  });
const subject = ([letter, rank]: CartanType): unknown => ["CartanType", ["Tuple", `'${letter}'`, rank]];
const evaluate = (head: string, type: CartanType): number =>
  applyDefinition(ce, index.get(`${head}@CartanType`)!, ce.box((subject(type) as unknown[])[1] as never)).re;

const matrixOf = (type: CartanType) => cartanMatrix(type);
const rootsOf = (type: CartanType) => positiveRoots(matrixOf(type));
const exponents = (type: CartanType): number[] => exponentsFromRoots(matrixOf(type));
const sum = (values: readonly number[]): number => values.reduce((a, b) => a + b, 0);
/** The generated group is cheap up to a few thousand elements; the deep run takes the bigger types. */
const groupSize = (type: CartanType): number => {
  const [letter, n] = type;
  return letter === "E"
    ? 10 ** 6
    : letter === "A"
      ? factorial(n + 1)
      : letter === "D"
        ? 2 ** (n - 1) * factorial(n)
        : letter === "F"
          ? 1152
          : letter === "G"
            ? 12
            : 2 ** n * factorial(n);
};
const factorial = (n: number): number => (n <= 1 ? 1 : n * factorial(n - 1));
const smallGroup =
  (limit: number) =>
  (type: CartanType): boolean =>
    groupSize(type) <= limit;

/** Head -> its reading from the root system, and the types it is held to (the readings that generate the group are dearer). */
const READINGS: Record<string, { read: (type: CartanType) => number; types: CartanType[] }> = {
  WeylGroupOrder: { read: (t) => groupOrder(matrixOf(t)), types: typesUpTo(6).filter(smallGroup(DEEP ? 60000 : 2000)) },
  CartanRank: { read: (t) => t[1], types: typesUpTo(8) },
  CoxeterNumber: {
    read: (t) => coxeterNumberOf(matrixOf(t)),
    types: typesUpTo(6).filter(smallGroup(DEEP ? 60000 : 2000)),
  },
  ReflectionCount: { read: (t) => rootsOf(t).length, types: typesUpTo(8) },
  AlmostPositiveRootCount: { read: (t) => rootsOf(t).length + t[1], types: typesUpTo(8) },
  WeylCatalanNumber: { read: (t) => classicalCatalan(t), types: typesUpTo(8) },
  PositiveWeylCatalanNumber: { read: (t) => classicalPositiveCatalan(t), types: typesUpTo(8) },
  SecondWeylFussCatalanNumber: { read: (t) => fussFromRoots(matrixOf(t), 2, 0), types: typesUpTo(8) },
  ThirdWeylFussCatalanNumber: { read: (t) => fussFromRoots(matrixOf(t), 3, 0), types: typesUpTo(8) },
  SecondPositiveWeylFussCatalanNumber: { read: (t) => fussFromRoots(matrixOf(t), 2, 2), types: typesUpTo(8) },
  ThirdPositiveWeylFussCatalanNumber: { read: (t) => fussFromRoots(matrixOf(t), 3, 2), types: typesUpTo(8) },
  CoxeterElementFactorizationCount: {
    read: (t) => factorizationCount(matrixOf(t)),
    types: typesUpTo(5).filter(smallGroup(DEEP ? 2000 : 400)),
  },
  CartanParkingFunctionCount: {
    read: (t) => (coxeterNumberFromRoots(matrixOf(t)) + 1) ** t[1],
    types: typesUpTo(8),
  },
  WeylGroupCenterOrder: {
    read: (t) => centerSize(matrixOf(t)),
    types: typesUpTo(6).filter(smallGroup(DEEP ? 60000 : 2000)),
  },
  CoxeterElementCount: {
    read: (t) => coxeterClassSize(matrixOf(t)),
    types: typesUpTo(6).filter(smallGroup(DEEP ? 60000 : 2000)),
  },
  FullSupportReflectionCount: { read: (t) => fullSupportRoots(matrixOf(t)), types: typesUpTo(8) },
  ReflectionOrbitCount: { read: (t) => reflectionOrbitsFromRoots(matrixOf(t)), types: typesUpTo(8) },
  ExponentSquareSum: { read: (t) => sum(exponents(t).map((e) => e * e)), types: typesUpTo(8) },
  GammaNumber: { read: (t) => gammaFromRoots(matrixOf(t)), types: typesUpTo(8) },
  RootPosetRowmotionOrder: { read: (t) => rowmotionOrder(matrixOf(t)), types: typesUpTo(DEEP ? 6 : 4) },
  PoincarePolynomialMaximalCoefficient: {
    read: (t) => Math.max(...poincareCoefficients(matrixOf(t))),
    types: typesUpTo(6).filter(smallGroup(DEEP ? 60000 : 2000)),
  },
  AdjointRepresentationDimension: { read: (t) => adjointDimension(matrixOf(t)), types: typesUpTo(8) },
  CartanMatrixPermanent: { read: (t) => permanent(matrixOf(t)), types: typesUpTo(DEEP ? 7 : 5) },
  CartanMatrixDeterminant: { read: (t) => determinant(matrixOf(t)), types: typesUpTo(8) },
  DualCoxeterNumber: { read: (t) => dualCoxeterFromRoots(matrixOf(t)), types: typesUpTo(8) },
  FirstFundamentalRepresentationDimension: { read: (t) => firstFundamentalDimension(matrixOf(t)), types: typesUpTo(8) },
  QuasiMinusculeRepresentationDimension: { read: (t) => quasiMinusculeDimension(matrixOf(t)), types: typesUpTo(8) },
  MinimalFaithfulRepresentationDimension: { read: (t) => minimalFaithfulDimension(matrixOf(t)), types: typesUpTo(8) },
  DynkinIndex: { read: (t) => dynkinIndex(matrixOf(t)), types: typesUpTo(8) },
  HighestRootMaximalCoefficient: { read: (t) => Math.max(...highestRoot(matrixOf(t))), types: typesUpTo(8) },
  MinusculeWeightCount: { read: (t) => minusculeCount(matrixOf(t)), types: typesUpTo(8) },
  HighestRootWeylVectorPairing: { read: (t) => highestRootPairing(matrixOf(t)), types: typesUpTo(8) },
  AtomicLengthOfLongestElement: { read: (t) => heightSum(matrixOf(t)), types: typesUpTo(8) },
  CommutativePositiveRootCount: { read: (t) => commutativeRoots(matrixOf(t)), types: typesUpTo(8) },
  FullyCommutativeElementCount: {
    read: (t) => fullyCommutativeCount(matrixOf(t)),
    types: typesUpTo(5).filter(smallGroup(DEEP ? 4000 : 400)),
  },
  WeylGroupConjugacyClassCount: {
    read: (t) => conjugacyClassCount(matrixOf(t)),
    types: typesUpTo(DEEP ? 6 : 4).filter(smallGroup(DEEP ? 60000 : 400)),
  },
  WeylGroupGrassmannianElementCount: { read: (t) => grassmannianFromIndices(matrixOf(t)), types: typesUpTo(8) },
  WeylGroupInvolutionCount: {
    read: (t) =>
      t[0] === "A" || t[0] === "D" || t[0] === "E"
        ? involutionsFromOrthogonalRoots(matrixOf(t))
        : involutionCount(matrixOf(t)),
    types: typesUpTo(DEEP ? 8 : 6).filter((t) => "ADE".includes(t[0]) || smallGroup(DEEP ? 60000 : 2000)(t)),
  },
  WeylGroupElementOrderLeastCommonMultiple: {
    read: (t) => elementOrderLeastCommonMultiple(matrixOf(t)),
    types: typesUpTo(6).filter(smallGroup(DEEP ? 60000 : 2000)),
  },
  LargestFundamentalRepresentationDimension: {
    read: (t) => largestFundamentalDimension(matrixOf(t)),
    types: typesUpTo(8),
  },
  WeylGroupParabolicSubgroupCount: {
    read: (t) => parabolicSubgroupCount(matrixOf(t)),
    types: typesUpTo(DEEP ? 7 : 5).filter((t) => !(t[0] === "E" && t[1] === 8)),
  },
  WeylGroupInvolutionClassCount: {
    read: (t) => involutionClassCount(matrixOf(t)),
    types: typesUpTo(6).filter(smallGroup(DEEP ? 60000 : 400)),
  },
  WeylGroupConnectedElementCount: { read: (t) => connectedFromParabolicOrders(matrixOf(t)), types: typesUpTo(8) },
  WeylGroupMinimalFaithfulPermutationDegree: {
    read: (t) => smallestFundamentalOrbit(matrixOf(t)),
    types: typesUpTo(8),
  },
};

test("every Cartan type definition has an independent reading, or is the exponents", () => {
  const heads = CARTAN_STATISTICS.map((d) => d.head);
  for (const head of heads)
    expect(
      READINGS[head] ?? (head === "WeylGroupExponents" || head === "CartanMatrix" ? true : undefined),
      head,
    ).toBeDefined();
  expect(Object.keys(READINGS).length).toBe(heads.length - 2);
});

for (const [head, { read, types }] of Object.entries(READINGS))
  test(`${head} agrees over ${types.length} types`, () => {
    expect(types.length).toBeGreaterThan(8);
    for (const type of types) expect(evaluate(head, type), `${type[0]}${type[1]}`).toBe(read(type));
  });

test("the two readings of the Grassmannian count, and of the involution count, agree where both are cheap", () => {
  for (const type of typesUpTo(5).filter(smallGroup(2000))) {
    expect(grassmannianCount(matrixOf(type)), `${type[0]}${type[1]}`).toBe(grassmannianFromIndices(matrixOf(type)));
    if ("ADE".includes(type[0]))
      expect(involutionsFromOrthogonalRoots(matrixOf(type)), `${type[0]}${type[1]}`).toBe(
        involutionCount(matrixOf(type)),
      );
  }
});

test("the connected elements counted from the group are those the parabolic orders give", () => {
  for (const type of typesUpTo(5).filter(smallGroup(400)))
    expect(connectedElementCount(matrixOf(type)), `${type[0]}${type[1]}`).toBe(
      connectedFromParabolicOrders(matrixOf(type)),
    );
});

test("the exponents are the exponents of the generated root system, ascending", () => {
  for (const type of typesUpTo(8))
    expect(
      applyDefinition(
        ce,
        index.get("WeylGroupExponents@CartanType")!,
        ce.box(["Tuple", `'${type[0]}'`, type[1]] as never),
      ).json,
      `${type[0]}${type[1]}`,
    ).toEqual(["List", ...exponents(type).toSorted((a, b) => a - b)]);
});

test("the Cartan matrix is the one the root system is generated from", () => {
  for (const type of typesUpTo(8))
    expect(
      applyDefinition(ce, index.get("CartanMatrix@CartanType")!, ce.box(["Tuple", `'${type[0]}'`, type[1]] as never))
        .json,
      `${type[0]}${type[1]}`,
    ).toEqual(["List", ...matrixOf(type).map((row) => ["List", ...row])]);
});

test("the rank of every type is the number of its exponents, and the order the product of their successors", () => {
  for (const type of typesUpTo(8)) {
    expect(exponents(type).length).toBe(type[1]);
    expect(evaluate("WeylGroupOrder", type)).toBe(exponents(type).reduce((p, e) => p * (e + 1), 1));
  }
});

test("each head called on the carrier value gives the reading", () => {
  for (const [head, { read, types }] of Object.entries(READINGS))
    for (const type of types.slice(0, 12))
      expect(ce.box([head, subject(type)] as never).evaluate().re, `${head} ${type[0]}${type[1]}`).toBe(read(type));
});

// ─── past 2^53: the statistics stay exact ──────────────────────────────────────────────────────

const exact = (head: string, type: CartanType): string =>
  ce
    .box([head, subject(type)] as never)
    .evaluate()
    .toString();
const fact = (n: number): bigint => (n <= 1 ? 1n : BigInt(n) * fact(n - 1));
const choose = (n: number, k: number): bigint => fact(n) / (fact(k) * fact(n - k));

test("sizes past 2^53 are exact: the group orders, and the counts that divide them", () => {
  expect(exact("WeylGroupOrder", ["A", 20])).toBe(String(fact(21)));
  expect(exact("WeylGroupOrder", ["B", 15])).toBe(String(2n ** 15n * fact(15)));
  expect(exact("WeylGroupOrder", ["D", 20])).toBe(String(2n ** 19n * fact(20)));
  expect(exact("CoxeterElementCount", ["A", 20])).toBe(String(fact(20)));
  expect(exact("CoxeterElementCount", ["B", 12])).toBe(String((2n ** 12n * fact(12)) / 24n));
  // The Catalan number of A_30 is C(32); its numerator ∏ (d + h) passes 2^53 long before the quotient does.
  expect(exact("WeylCatalanNumber", ["A", 30])).toBe(String(choose(62, 31) / 32n));
  expect(exact("WeylCatalanNumber", ["B", 25])).toBe(String(choose(50, 25)));
  expect(exact("CartanParkingFunctionCount", ["B", 20])).toBe(String(41n ** 20n));
  expect(exact("FullyCommutativeElementCount", ["A", 40])).toBe(String(choose(82, 41) / 42n));
  expect(exact("CoxeterElementFactorizationCount", ["A", 10])).toBe(String((fact(10) * 11n ** 10n) / fact(11)));
});

test("a product that passes 2^53 while its quotient stays below it still divides exactly", () => {
  // Compiled code computes in doubles; these types have a numerator past 2^53 and a quotient under it.
  for (const [head, type] of [
    ["ThirdPositiveWeylFussCatalanNumber", ["A", 12]],
    ["ThirdWeylFussCatalanNumber", ["B", 8]],
    ["SecondWeylFussCatalanNumber", ["A", 18]],
    ["CoxeterElementFactorizationCount", ["D", 10]],
  ] as const) {
    const a = matrixOf(type);
    const m = head.startsWith("Third") ? 3 : 2;
    const shift = head.includes("Positive") ? 2 : 0;
    if (head.startsWith("CoxeterElementFactorization")) {
      const h = BigInt(coxeterNumberFromRoots(a));
      const order = exponents(type).reduce((p, e) => p * BigInt(e + 1), 1n);
      expect(exact(head, type), head).toBe(String((fact(type[1]) * h ** BigInt(type[1])) / order));
    } else {
      const h = BigInt(coxeterNumberFromRoots(a));
      let numerator = 1n;
      let denominator = 1n;
      for (const e of exponents(type)) {
        numerator *= BigInt(m) * h + BigInt(e) + 1n - BigInt(shift);
        denominator *= BigInt(e) + 1n;
      }
      expect(exact(head, type), `${head} ${type[0]}${type[1]}`).toBe(String(numerator / denominator));
    }
  }
});

// ─── the family ────────────────────────────────────────────────────────────────────────────────

const value = (json: unknown) => ce.box(json as never).evaluate().json;

test("FiniteCartanTypes(n) lists the irreducible types of rank n in FindStat's order", () => {
  const letters = (n: number): string =>
    [...Array(Number(value(["Count", ["FiniteCartanTypes", n]])))]
      .map((_, i) => ((value(["At", ["FiniteCartanTypes", n], i + 1]) as unknown as unknown[])[1] as unknown[])[1])
      .map((s) => String(s).replaceAll("'", ""))
      .join("");
  expect(Array.from({ length: 12 }, (_, i) => letters(i + 1))).toEqual([
    "A",
    "ABG",
    "ABC",
    "ABCDF",
    "ABCD",
    "ABCDE",
    "ABCDE",
    "ABCDE",
    "ABCD",
    "ABCD",
    "ABCD",
    "ABCD",
  ]);
  expect(value(["At", ["FiniteCartanTypes", 3], 2])).toEqual(["CartanType", ["Tuple", "'B'", 3]]);
  expect(CARTAN_LETTERS.join("")).toBe("ABCDEFG");
  expect(value(["Count", ["FiniteCartanTypes", 0]])).toBe(0);
});

test("a type is a member of the family of its rank, and of no other", () => {
  expect(value(["Element", ["CartanType", ["Tuple", "'D'", 4]], ["FiniteCartanTypes", 4]])).toBe("True");
  expect(value(["Element", ["CartanType", ["Tuple", "'D'", 3]], ["FiniteCartanTypes", 3]])).toBe("False");
  expect(value(["Element", ["CartanType", ["Tuple", "'C'", 2]], ["FiniteCartanTypes", 2]])).toBe("False");
  expect(value(["Element", ["CartanType", ["Tuple", "'E'", 5]], ["FiniteCartanTypes", 5]])).toBe("False");
  expect(value(["Element", ["CartanType", ["Tuple", "'F'", 4]], ["FiniteCartanTypes", 4]])).toBe("True");
  expect(value(["Element", ["CartanType", ["Tuple", "'A'", 3]], ["FiniteCartanTypes", 4]])).toBe("False");
});

test("a statistic over the family tallies the Weyl group orders of the rank", () => {
  // Tally lists the values in order of first appearance (A, B, C, D, F) with their counts.
  expect(value(["Tally", ["CombinatorialStat", ["FiniteCartanTypes", 4], "'WeylGroupOrder'"]])).toEqual([
    "Tuple",
    ["List", 120, 384, 192, 1152],
    ["List", 1, 2, 1, 1],
  ]);
});
