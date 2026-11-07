// Finite Cartan type statistics, over `_x` = Tuple("A", 3): the letter and the rank of an irreducible type.
// Most are closed forms in the degrees d of the Weyl group's fundamental invariants: A_n has 2 .. n + 1,
// B_n and C_n have 2, 4 .. 2n, D_n has 2, 4 .. 2n - 2 and n, and the exceptional types have the lists below.
// The rank is the number of degrees, the Coxeter number h the largest, the number of reflections the sum of
// the exponents d - 1. A statistic of the Lie algebra rather than the Weyl group is a table by letter (and
// by rank for E), with the formulas of the families.

import type { Definition, MathJSON } from "../../src/statistics/types.ts";
import {
  add,
  at,
  atLeastValue,
  bindList,
  count,
  equals,
  floored,
  forEach,
  less,
  max,
  subtract,
  upTo,
  where,
} from "../../src/statistics/vocabulary.ts";
import { fold as foldOf } from "../../collections/src/families/tables.ts";

/** A fold whose accumulator has the type given last (an untyped one declines to compile). */
const typedFold = (...args: Parameters<typeof foldOf>): MathJSON => foldOf(...args) as MathJSON;

const on = "CartanType";
const stat = (head: string, summary: string, expr: MathJSON, note?: string, result?: string): Definition => ({
  head,
  on,
  summary,
  expr,
  ...(note ? { note } : {}),
  ...(result ? { result } : {}),
});

const letter: MathJSON = at(1);
const rank: MathJSON = at(2);
const isLetter = (name: string): MathJSON => equals(letter, `'${name}'`);
const times = (...factors: MathJSON[]): MathJSON => ["Multiply", ...factors];
const divide = (a: MathJSON, b: MathJSON): MathJSON => ["Divide", a, b];
const power = (a: MathJSON, b: MathJSON): MathJSON => ["Power", a, b];

/** The cases in order, the last one standing for every letter not named before it. */
const byCases = (cases: readonly (readonly [test: MathJSON, value: MathJSON])[], otherwise: MathJSON): MathJSON =>
  cases.reduceRight<MathJSON>((rest, [test, value]) => ["If", test, value, rest], otherwise);

type Letters = Readonly<Partial<Record<"A" | "B" | "C" | "D" | "E" | "F" | "G", MathJSON>>>;
/** The value of a letter, each of A .. F given and G the last. B and C may share a value (`BC`). */
const byLetter = (cases: Letters & { BC?: MathJSON; G: MathJSON }): MathJSON => {
  const value = (name: "A" | "B" | "C" | "D" | "E" | "F"): MathJSON => (cases[name] ?? cases.BC) as MathJSON;
  return byCases(
    (["A", "B", "C", "D", "E", "F"] as const).map((name) => [isLetter(name), value(name)] as const),
    cases.G,
  );
};
/** The three ranks of E, 6 then 7 and 8. */
const byRank = (e6: MathJSON, e7: MathJSON, e8: MathJSON): MathJSON =>
  byCases(
    [
      [equals(rank, 6), e6],
      [equals(rank, 7), e7],
    ],
    e8,
  );

/** The degrees of the Weyl group, ascending (D_n: 2, 4 .. 2n - 2 with n among them). */
const degreesOfType: MathJSON = byLetter({
  A: ["Range", 2, add(rank, 1), 1],
  BC: forEach(upTo(rank), times(2, "i")),
  D: [
    "Join",
    where(forEach(upTo(subtract(rank, 1)), times(2, "i")), less("e", rank), "e"),
    ["List", rank],
    where(forEach(upTo(subtract(rank, 1)), times(2, "i")), atLeastValue("e", rank), "e"),
  ],
  E: byRank(["List", 2, 5, 6, 8, 9, 12], ["List", 2, 6, 8, 10, 12, 14, 18], ["List", 2, 8, 12, 14, 18, 20, 24, 30]),
  F: ["List", 2, 6, 8, 12],
  G: ["List", 2, 6],
});

/** `body` over the degrees `ds`. */
const withDegrees = (body: MathJSON): MathJSON => bindList("ds", degreesOfType, body);
const degrees: MathJSON = "ds";
const coxeterNumber: MathJSON = max(degrees);
const sumOfDegrees: MathJSON = floored(["Sum", degrees]);
const reflections: MathJSON = subtract(sumOfDegrees, rank);
const weylOrder: MathJSON = ["Product", degrees];
/** The sum of the squares of the exponents. */
const exponentSquares: MathJSON = floored(["Sum", forEach(degrees, power(subtract("d", 1), 2), "d")]);
/** The number of degrees that are odd: the Weyl group has -1 exactly when there is none. */
const oddDegrees: MathJSON = count(degrees, equals(["Mod", "d", 2], 1), "d");
const centerOrder: MathJSON = ["If", equals(oddDegrees, 0), 2, 1];

/**
 * `answer` when the integer `n` is exact in doubles. Compiled code computes in doubles, which round a product past
 * 2^53 and then divide the rounded value; the interpreter is exact. For a double n at least 2^53 the first parity
 * below differs from the second (adding 1 to an even double that large gives an even double), so compiled code
 * declines (NaN) there and the interpreter answers.
 */
const exactly = (n: MathJSON, answer: MathJSON): MathJSON => [
  "If",
  equals(["Mod", add(n, 1), 2], ["Mod", add(["Mod", n, 2], 1), 2]),
  answer,
  divide(0, 0),
];

/** ∏ (m h + d - shift) / ∏ d, the Fuss-Catalan number of order m (shift 2 for the positive one). */
const fussCatalan = (m: number, shift: number): MathJSON => {
  const numerator: MathJSON = ["Product", forEach(degrees, add(times(m, coxeterNumber), subtract("d", shift)), "d")];
  return exactly(numerator, divide(numerator, weylOrder));
};

/** n! h^n / |W|, the factorizations of a Coxeter element into reflections. */
const factorizations: MathJSON = (() => {
  const numerator: MathJSON = times(["Product", upTo(rank)], ["Product", forEach(upTo(rank), coxeterNumber)]);
  return exactly(numerator, divide(numerator, weylOrder));
})();

/** n h times the product of the codegrees d - 2 (the degree 2 left out). */
const fullSupportNumerator: MathJSON = times(rank, coxeterNumber, [
  "Product",
  forEach(degrees, ["If", equals("d", 2), 1, subtract("d", 2)], "d"),
]);

/** The Catalan number C(m) = ∏_{i=2}^{m} (m + i) / i, for m at least 2. */
const catalan = (m: MathJSON): MathJSON => {
  const numerator: MathJSON = ["Product", forEach(["Range", 2, m, 1], add(m, "j"), "j")];
  return exactly(numerator, divide(numerator, ["Product", ["Range", 2, m, 1]]));
};

/** The coefficients of ∏ (1 + q + ... + q^(d-1)) over the degrees, the Poincaré polynomial of the Weyl group. */
const poincareCoefficients: MathJSON = typedFold(
  forEach(
    upTo(subtract(add(["Length", "pc"], "pd"), 1)),
    floored([
      "Sum",
      forEach(
        ["Range", ["Max", 1, add(subtract("pk", "pd"), 1)], ["Min", "pk", ["Length", "pc"]], 1],
        at("pj", "pc"),
        "pj",
      ),
    ]),
    "pk",
  ),
  "pc",
  "pd",
  ["List", 1],
  degrees,
  "list<integer>",
);

/**
 * The entry of the Cartan matrix at row i, column j (1-based), a_ij = <alpha_i, alpha_j^vee> in Bourbaki's numbering:
 * 2 on the diagonal, -1 between neighbors of the Dynkin diagram, and the multiple bond of B (a_{n-1,n} = -2),
 * C (a_{n,n-1} = -2), F (a_{2,3} = -2) and G (a_{2,1} = -3).
 */
const cartanEntry = (i: MathJSON, j: MathJSON): MathJSON => {
  const chain: MathJSON = equals(["Abs", subtract(i, j)], 1);
  const pair = (a: MathJSON, b: MathJSON): MathJSON => ["And", equals(i, a), equals(j, b)];
  const bond = (neighbors: MathJSON, weights: readonly (readonly [MathJSON, number])[]): MathJSON => [
    "If",
    neighbors,
    weights.reduceRight<MathJSON>((rest, [test, weight]) => ["If", test, -weight, rest], -1),
    0,
  ];
  const off = byLetter({
    A: bond(chain, []),
    B: bond(chain, [[pair(subtract(rank, 1), rank), 2]]),
    C: bond(chain, [[pair(rank, subtract(rank, 1)), 2]]),
    // D_n: the chain 1 .. n - 1, with n attached to n - 2 instead of n - 1.
    D: [
      "If",
      ["Or", pair(subtract(rank, 2), rank), pair(rank, subtract(rank, 2))],
      -1,
      ["If", ["And", chain, ["Less", i, rank], ["Less", j, rank]], -1, 0],
    ],
    // E_n: the chain 1 - 3 - 4 - 5 .. n, with 2 attached to 4.
    E: [
      "If",
      ["Or", pair(2, 4), pair(4, 2)],
      -1,
      ["If", ["Or", pair(1, 3), pair(3, 1)], -1, ["If", ["And", ["Greater", i, 2], ["Greater", j, 2], chain], -1, 0]],
    ],
    F: bond(chain, [[pair(2, 3), 2]]),
    G: bond(chain, [[pair(2, 1), 3]]),
  });
  return ["If", equals(i, j), 2, off];
};

/** The permanent of the Cartan matrix, row by row over the sets of columns used: entry m + 1 of the carried list is the sum
 *  over the ways to place the first r rows on the columns of the bits of m (0 unless m has r bits). */
const permanentTable: MathJSON = (() => {
  const columns: MathJSON = upTo(rank);
  const bit = (mask: MathJSON, column: MathJSON): MathJSON =>
    atLeastValue(["Mod", mask, power(2, column)], power(2, subtract(column, 1)));
  const masks: MathJSON = ["Range", 0, subtract(power(2, rank), 1), 1];
  return typedFold(
    forEach(
      masks,
      [
        "If",
        equals(floored(["Sum", forEach(columns, ["If", bit("pm", "pc"), 1, 0], "pc")]), "pr"),
        [
          "Sum",
          forEach(
            where(columns, bit("pm", "pc"), "pc"),
            times(cartanEntry("pr", "pc"), at(add(subtract("pm", power(2, subtract("pc", 1))), 1), "pa")),
            "pc",
          ),
        ],
        0,
      ],
      "pm",
    ),
    "pa",
    "pr",
    forEach(masks, ["If", equals("pz", 0), 1, 0], "pz"),
    columns,
    "list<integer>",
  );
})();

export const CARTAN_STATISTICS: readonly Definition[] = [
  stat(
    "WeylGroupOrder",
    "The size of the Weyl group of the type: the product of its degrees.",
    withDegrees(weylOrder),
    "Humphreys, Reflection Groups and Coxeter Groups, section 3.7 and the table of section 2.11.",
  ),
  stat(
    "WeylGroupExponents",
    "The exponents of the Weyl group of the type: one less than each degree.",
    withDegrees(typedFold(["Join", "xs", ["List", subtract("x", 1)]], "xs", "x", ["List"], degrees, "list<integer>")),
    undefined,
    "list<integer>",
  ),
  stat("CartanRank", "The rank of the type: the number of simple roots.", rank),
  stat(
    "CoxeterNumber",
    "The Coxeter number of the type: the largest degree of its Weyl group.",
    withDegrees(coxeterNumber),
  ),
  stat(
    "ReflectionCount",
    "The number of reflections in the Weyl group, which is the number of positive roots: the sum of the exponents.",
    withDegrees(reflections),
  ),
  stat(
    "AlmostPositiveRootCount",
    "The number of almost positive roots: the positive roots and the negatives of the simple roots.",
    withDegrees(sumOfDegrees),
  ),
  stat(
    "WeylCatalanNumber",
    "The Catalan number of the type, ∏ (d + h) / d over the degrees d and the Coxeter number h.",
    withDegrees(fussCatalan(1, 0)),
  ),
  stat(
    "PositiveWeylCatalanNumber",
    "The positive Catalan number of the type, ∏ (d + h - 2) / d.",
    withDegrees(fussCatalan(1, 2)),
  ),
  stat(
    "SecondWeylFussCatalanNumber",
    "The Fuss-Catalan number of order 2 of the type, ∏ (d + 2h) / d.",
    withDegrees(fussCatalan(2, 0)),
  ),
  stat(
    "ThirdWeylFussCatalanNumber",
    "The Fuss-Catalan number of order 3 of the type, ∏ (d + 3h) / d.",
    withDegrees(fussCatalan(3, 0)),
  ),
  stat(
    "SecondPositiveWeylFussCatalanNumber",
    "The positive Fuss-Catalan number of order 2 of the type, ∏ (d + 2h - 2) / d.",
    withDegrees(fussCatalan(2, 2)),
  ),
  stat(
    "ThirdPositiveWeylFussCatalanNumber",
    "The positive Fuss-Catalan number of order 3 of the type, ∏ (d + 3h - 2) / d.",
    withDegrees(fussCatalan(3, 2)),
  ),
  stat(
    "CoxeterElementFactorizationCount",
    "The ways to write a Coxeter element as a product of n reflections: n! h^n / |W|.",
    withDegrees(factorizations),
  ),
  stat(
    "CartanParkingFunctionCount",
    "The parking functions of the type, the points of the torus Q / (h + 1) Q: (h + 1)^n.",
    withDegrees(["Product", forEach(upTo(rank), add(coxeterNumber, 1))]),
  ),
  stat(
    "WeylGroupCenterOrder",
    "The size of the center of the Weyl group: 2 when -1 is in the group (every degree is even), else 1.",
    withDegrees(centerOrder),
  ),
  stat(
    "CoxeterElementCount",
    "The Coxeter elements of the Weyl group, one conjugacy class of size |W| / h.",
    withDegrees(exactly(weylOrder, divide(weylOrder, coxeterNumber))),
  ),
  stat(
    "FullSupportReflectionCount",
    "The reflections whose reduced words use every simple reflection: n h / |W| times the product of the codegrees d - 2 (leaving out the degree 2).",
    withDegrees(exactly(fullSupportNumerator, divide(fullSupportNumerator, weylOrder))),
  ),
  stat(
    "ReflectionOrbitCount",
    "The conjugacy classes of reflections in the Weyl group: 2 where the simple roots have two lengths (B, C, F, G), else 1.",
    byLetter({ A: 1, BC: 2, D: 1, E: 1, F: 2, G: 2 }),
  ),
  stat("ExponentSquareSum", "The sum of the squares of the exponents of the Weyl group.", withDegrees(exponentSquares)),
  stat(
    "GammaNumber",
    "The gamma number of the Weyl group, from the sum of the squares of its exponents e: γ = 6 Σ e² / n - h² + h.",
    withDegrees(add(subtract(divide(times(6, exponentSquares), rank), power(coxeterNumber, 2)), coxeterNumber)),
  ),
  stat(
    "RootPosetRowmotionOrder",
    "The order of rowmotion on the root poset: h where -1 is in the Weyl group, else 2 h.",
    withDegrees(times(coxeterNumber, subtract(3, centerOrder))),
  ),
  stat(
    "PoincarePolynomialMaximalCoefficient",
    "The largest coefficient of the Poincaré polynomial ∏ [d]_q of the Weyl group.",
    withDegrees(max(poincareCoefficients)),
  ),
  stat(
    "AdjointRepresentationDimension",
    "The dimension of the adjoint representation of the Lie algebra: n plus twice the number of positive roots.",
    withDegrees(subtract(times(2, sumOfDegrees), rank)),
  ),
  stat(
    "CartanMatrix",
    "The Cartan matrix of the type in Bourbaki's numbering: the entry at row i and column j is the pairing of the simple root i with the coroot j.",
    typedFold(
      [
        "Join",
        "mx",
        [
          "List",
          typedFold(
            ["Join", "my", ["List", cartanEntry("mi", "mj")]],
            "my",
            "mj",
            ["List"],
            upTo(rank),
            "list<integer>",
          ),
        ],
      ],
      "mx",
      "mi",
      ["List"],
      upTo(rank),
      "list<list<integer>>",
    ),
    undefined,
    "list<list<integer>>",
  ),
  {
    ...stat(
      "CartanMatrixPermanent",
      "The permanent of the Cartan matrix: the sum over the ways to choose one entry from each row and column.",
      at(power(2, rank), permanentTable),
      "The table has 2^n entries, so the build checks compiled code against the interpreter up to rank 7.",
    ),
    checkWeight: 7,
  },
  stat(
    "CartanMatrixDeterminant",
    "The determinant of the Cartan matrix, the order of the center of the simply connected group.",
    byLetter({ A: add(rank, 1), BC: 2, D: 4, E: byRank(3, 2, 1), F: 1, G: 1 }),
  ),
  stat(
    "DualCoxeterNumber",
    "The dual Coxeter number of the type.",
    byLetter({
      A: add(rank, 1),
      B: subtract(times(2, rank), 1),
      C: add(rank, 1),
      D: subtract(times(2, rank), 2),
      E: byRank(12, 18, 30),
      F: 9,
      G: 4,
    }),
  ),
  stat(
    "FirstFundamentalRepresentationDimension",
    "The dimension of the representation with highest weight the first fundamental weight, in Bourbaki's numbering.",
    byLetter({
      A: add(rank, 1),
      B: add(times(2, rank), 1),
      C: times(2, rank),
      D: times(2, rank),
      E: byRank(27, 133, 3875),
      F: 52,
      G: 7,
    }),
  ),
  stat(
    "QuasiMinusculeRepresentationDimension",
    "The dimension of the quasi-minuscule representation, whose highest weight is the highest short root.",
    byLetter({
      A: times(rank, add(rank, 2)),
      B: add(times(2, rank), 1),
      C: subtract(subtract(times(2, power(rank, 2)), rank), 1),
      D: times(rank, subtract(times(2, rank), 1)),
      E: byRank(78, 133, 248),
      F: 26,
      G: 7,
    }),
  ),
  stat(
    "MinimalFaithfulRepresentationDimension",
    "The smallest dimension of a faithful representation of the Lie algebra.",
    byLetter({
      A: add(rank, 1),
      B: ["If", equals(rank, 2), 4, add(times(2, rank), 1)],
      C: times(2, rank),
      D: times(2, rank),
      E: byRank(27, 56, 248),
      F: 26,
      G: 7,
    }),
  ),
  stat(
    "DynkinIndex",
    "The Dynkin index of the Lie algebra: the greatest common divisor of the indices of its representations.",
    byLetter({ A: 1, B: ["If", equals(rank, 2), 1, 2], C: 1, D: 2, E: byRank(6, 12, 60), F: 6, G: 2 }),
  ),
  stat(
    "HighestRootMaximalCoefficient",
    "The largest coefficient of the highest root in the simple roots.",
    byLetter({ A: 1, BC: 2, D: 2, E: byRank(3, 4, 6), F: 4, G: 3 }),
  ),
  stat(
    "MinusculeWeightCount",
    "The minuscule dominant weights: the simple roots that appear once in the highest root.",
    byLetter({ A: rank, BC: 1, D: 3, E: byRank(2, 1, 0), F: 0, G: 0 }),
  ),
  stat(
    "HighestRootWeylVectorPairing",
    "The symmetric bilinear form of the highest root with the Weyl vector, normalized so that the shortest roots have squared length 2.",
    withDegrees(
      byLetter({
        A: rank,
        B: subtract(times(4, rank), 4),
        C: times(2, rank),
        D: subtract(times(2, rank), 3),
        E: subtract(coxeterNumber, 1),
        F: 16,
        G: 9,
      }),
    ),
  ),
  stat(
    "AtomicLengthOfLongestElement",
    "The atomic length of the longest element of the Weyl group: the sum of the heights of the positive roots.",
    withDegrees(
      byLetter({
        A: divide(times(rank, add(rank, 1), add(rank, 2)), 6),
        BC: divide(times(rank, add(rank, 1), subtract(times(4, rank), 1)), 6),
        D: divide(times(rank, coxeterNumber, add(coxeterNumber, 1)), 6),
        E: divide(times(rank, coxeterNumber, add(coxeterNumber, 1)), 6),
        F: 110,
        G: 16,
      }),
    ),
  ),
  stat(
    "CommutativePositiveRootCount",
    "The commutative positive roots: those whose upper ideal in the root poset is abelian.",
    byLetter({
      A: divide(times(rank, add(rank, 1)), 2),
      BC: divide(times(rank, add(rank, 1)), 2),
      D: add(divide(times(rank, add(rank, 1)), 2), subtract(rank, 3)),
      E: byRank(25, 34, 44),
      F: 10,
      G: 3,
    }),
  ),
  stat(
    "FullyCommutativeElementCount",
    "The fully commutative elements of the Weyl group: the Catalan number C(n + 1) for A_n, (n + 2) C(n) - 1 for B_n and C_n, (n + 3) C(n) / 2 - 1 for D_n (Stembridge).",
    byLetter({
      A: catalan(add(rank, 1)),
      BC: subtract(times(add(rank, 2), catalan(rank)), 1),
      D: subtract(divide(times(add(rank, 3), catalan(rank)), 2), 1),
      E: byRank(662, 2670, 10846),
      F: 106,
      G: 11,
    }),
  ),
];
