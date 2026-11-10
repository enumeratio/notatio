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
  bind,
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

/** `fold`, as this file's `MathJSON`. */
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
  );
})();

/** `list[index]`, 1-based. */
const entry = (list: MathJSON, index: MathJSON): MathJSON => ["At", list, index];
/** The sum of `body` over `from .. to`, which stays real (compiled sums of a fold's entries type complex otherwise). */
const total = (from: MathJSON, to: MathJSON, body: MathJSON, variable: string): MathJSON =>
  floored(["Sum", forEach(["Range", from, to, 1], body, variable)]);
/** `answer` once the integer `n` is known exact in doubles (the larger of the counts it is built from is `n`). */
const exactAt = (name: string, n: MathJSON, answer: MathJSON): MathJSON =>
  bind(name, n, exactly(name, answer), "integer");

/**
 * The partitions of 0 .. m, counted by the parity of their number of parts: one list of 2 (m + 1) entries, the
 * even-length counts at 1 .. m + 1 and the odd-length ones after them. Each part size k multiplies the series by 1 / (1 - q^k);
 * i copies of k flip the parity i times.
 */
const partitionParities = (m: MathJSON): MathJSON => {
  const width = add(m, 1);
  const place = (side: MathJSON, j: MathJSON): MathJSON => add(add(times(side, width), j), 1);
  const side: MathJSON = ["If", atLeastValue("pu", add(width, 1)), 1, 0];
  const j: MathJSON = subtract(subtract("pu", 1), times(side, width));
  const copies: MathJSON = where(["Range", 0, j, 1], ["LessEqual", times("pi", "pk"), j], "pi");
  return typedFold(
    forEach(
      upTo(times(2, width)),
      floored([
        "Sum",
        forEach(
          copies,
          entry(
            "pq",
            place(["If", equals(["Mod", "pi", 2], 0), side, subtract(1, side)], subtract(j, times("pi", "pk"))),
          ),
          "pi",
        ),
      ]),
      "pu",
    ),
    "pq",
    "pk",
    forEach(upTo(times(2, width)), ["If", equals("pz", 1), 1, 0], "pz"),
    upTo(m),
    "list<integer>",
  );
};
/** The partitions of k, from the parities list of `partitionParities(m)` (k at most m). */
const partitionsOf = (parities: MathJSON, m: MathJSON, k: MathJSON): MathJSON =>
  add(entry(parities, add(k, 1)), entry(parities, add(add(m, 1), add(k, 1))));
/** The partitions of k with an even number of parts. */
const evenLengthPartitionsOf = (parities: MathJSON, k: MathJSON): MathJSON => entry(parities, add(k, 1));

/**
 * u(0) = 1 and u(m) = sum_s C(m - 1, s) b^s u(m - 1 - s) for m up to `last`, as a list: the Bell numbers for b = 1, and for
 * b = 2 the weights of the set partitions whose blocks carry a sign (each block of size t has 2^(t - 1) of them).
 */
const blockSums = (base: MathJSON, last: MathJSON): MathJSON =>
  typedFold(
    [
      "Join",
      "bl",
      [
        "List",
        total(
          0,
          subtract(["Length", "bl"], 1),
          times(
            ["Binomial", subtract(["Length", "bl"], 1), "bs"],
            power(base, "bs"),
            entry("bl", subtract(["Length", "bl"], "bs")),
          ),
          "bs",
        ),
      ],
    ],
    "bl",
    "bm",
    ["List", 1],
    upTo(last),
    "list<integer>",
  );

/** The involutions u(k) = s u(k - 1) + s (k - 1) u(k - 2) of a group of signed or plain permutations, as a list up to k = `last`. */
const involutionSeries = (scale: MathJSON, last: MathJSON): MathJSON =>
  typedFold(
    [
      "Join",
      "iu",
      [
        "List",
        add(
          times(scale, entry("iu", ["Length", "iu"])),
          times(scale, subtract(["Length", "iu"], 1), entry("iu", subtract(["Length", "iu"], 1))),
        ),
      ],
    ],
    "iu",
    "ik",
    ["List", 1, scale],
    ["Range", 2, last, 1],
    "list<integer>",
  );

/** C(1 .. last), the permutations of 1 .. m that do not split into a prefix permuting its own values, as a list: C(m) = m! - sum_k C(k) (m - k)!. */
const indecomposablePermutations = (last: MathJSON): MathJSON =>
  typedFold(
    [
      "Join",
      "dc",
      [
        "List",
        subtract(
          ["Factorial", add(["Length", "dc"], 1)],
          total(
            1,
            ["Length", "dc"],
            times(entry("dc", "dk"), ["Factorial", subtract(add(["Length", "dc"], 1), "dk")]),
            "dk",
          ),
        ),
      ],
    ],
    "dc",
    "dm",
    ["List", 1],
    ["Range", 2, last, 1],
    "list<integer>",
  );

/** The least common multiple of the degrees: the exponent of the group of a Weyl group is it. */
const leastCommonDegree: MathJSON = typedFold(["LCM", "la", "ld"], "la", "ld", 1, degrees);

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
    withDegrees(typedFold(["Join", "xs", ["List", subtract("x", 1)]], "xs", "x", ["List"], degrees)),
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
        ["List", typedFold(["Join", "my", ["List", cartanEntry("mi", "mj")]], "my", "mj", ["List"], upTo(rank))],
      ],
      "mx",
      "mi",
      ["List"],
      upTo(rank),
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
  stat(
    "WeylGroupConjugacyClassCount",
    "The conjugacy classes of the Weyl group: p(n + 1) for A_n, the bipartitions of n for B_n and C_n, and for D_n those with an even number of parts in the second partition, together with the classes that split.",
    bindList(
      "pp",
      partitionParities(add(rank, 1)),
      byLetter({
        A: partitionsOf("pp", add(rank, 1), add(rank, 1)),
        BC: exactly(
          total(
            0,
            rank,
            times(partitionsOf("pp", add(rank, 1), "ck"), partitionsOf("pp", add(rank, 1), subtract(rank, "ck"))),
            "ck",
          ),
          total(
            0,
            rank,
            times(partitionsOf("pp", add(rank, 1), "ck"), partitionsOf("pp", add(rank, 1), subtract(rank, "ck"))),
            "ck",
          ),
        ),
        D: add(
          total(
            0,
            rank,
            times(partitionsOf("pp", add(rank, 1), "ck"), evenLengthPartitionsOf("pp", subtract(rank, "ck"))),
            "ck",
          ),
          ["If", equals(["Mod", rank, 2], 0), partitionsOf("pp", add(rank, 1), divide(rank, 2)), 0],
        ),
        E: byRank(25, 60, 112),
        F: 25,
        G: 6,
      }),
    ),
    "The classes of B_n are the pairs of partitions of sizes adding to n (the positive and the negative cycles); those of D_n have an even number of negative cycles, and a class with only even positive cycles and no negative ones splits in two. The exceptional types are tabulated (Carter, Conjugacy classes in the Weyl group).",
  ),
  stat(
    "WeylGroupGrassmannianElementCount",
    "The elements of the Weyl group with at most one descent: the identity and, for each simple reflection s, the minimal coset representatives for the parabolic subgroup without s, less the identity.",
    byLetter({
      A: exactly(power(2, add(rank, 1)), subtract(subtract(power(2, add(rank, 1)), rank), 1)),
      BC: exactly(power(3, rank), subtract(power(3, rank), rank)),
      D: exactly(power(3, rank), subtract(subtract(power(3, rank), times(rank, power(2, subtract(rank, 1)))), rank)),
      E: byRank(1273, 17636, 881753),
      F: 237,
      G: 11,
    }),
    "The count is 1 + the sum over s of |W| / |W_(S - s)| - 1; the indices are binomial for A_n (C(n + 1, k)) and 2^k C(n, k) for B_n, C_n and D_n.",
  ),
  stat(
    "WeylGroupInvolutionCount",
    "The elements of the Weyl group that are their own inverse, the identity included: the telephone numbers for A_n, and for B_n, C_n and D_n the coefficients of exp(x^2 + 2x) and exp(x^2) (exp(2x) + 1) / 2.",
    bindList(
      "ii",
      involutionSeries(["If", isLetter("A"), 1, 2], ["If", isLetter("A"), add(rank, 1), rank]),
      byLetter({
        A: exactAt("ij", entry("ii", add(rank, 2)), "ij"),
        BC: exactAt("ij", entry("ii", add(rank, 1)), "ij"),
        D: exactAt(
          "ij",
          entry("ii", add(rank, 1)),
          divide(
            add("ij", ["If", equals(["Mod", rank, 2], 0), ["Product", ["Range", add(divide(rank, 2), 1), rank, 1]], 0]),
            2,
          ),
        ),
        E: byRank(892, 10208, 199952),
        F: 140,
        G: 8,
      }),
    ),
    "The E_6, E_7 and E_8 counts are of the elements fixing every vector of a root-spanned subspace and negating its complement: 892 = 1 + 36 + 270 + 540 + 45.",
  ),
  stat(
    "WeylGroupElementOrderLeastCommonMultiple",
    "The exponent of the Weyl group, the least common multiple of the orders of its elements: the least common multiple of its degrees.",
    withDegrees(leastCommonDegree),
    "For A_n the orders are the cycle lengths, for B_n and C_n the cycle lengths and twice them (a negative cycle doubles its length), for D_n the same with an even number of negative cycles; each case is the least common multiple of the degrees, and the exceptional types are checked against their element orders.",
  ),
  stat(
    "LargestFundamentalRepresentationDimension",
    "The largest dimension among the fundamental representations of the Lie algebra, by Weyl's formula: an exterior power of the vector representation, or its traceless part, for the classical types.",
    byLetter({
      A: exactAt("lf", ["Binomial", add(rank, 1), divide(subtract(add(rank, 1), ["Mod", add(rank, 1), 2]), 2)], "lf"),
      B: exactAt("lf", ["Binomial", add(times(2, rank), 1), subtract(rank, 1)], "lf"),
      C: exactAt(
        "lf",
        ["Binomial", times(2, rank), subtract(rank, 1)],
        subtract("lf", ["Binomial", times(2, rank), subtract(rank, 3)]),
      ),
      D: exactAt("lf", ["Binomial", times(2, rank), subtract(rank, 2)], "lf"),
      E: byRank(2925, 365750, 6899079264),
      F: 1274,
      G: 14,
    }),
  ),
  stat(
    "WeylGroupParabolicSubgroupCount",
    "The parabolic subgroups of the Weyl group, the fixers of subspaces: the Bell number B(n + 1) for A_n, and for B_n and C_n the sum of C(n, k) times the signed set partitions of k, D_n leaving out those with exactly one zero coordinate.",
    bindList(
      "pb",
      blockSums(["If", isLetter("A"), 1, 2], ["If", isLetter("A"), add(rank, 1), rank]),
      byLetter({
        A: entry("pb", add(rank, 2)),
        BC: exactly(
          total(0, rank, times(["Binomial", rank, "bk"], entry("pb", add("bk", 1))), "bk"),
          total(0, rank, times(["Binomial", rank, "bk"], entry("pb", add("bk", 1))), "bk"),
        ),
        D: subtract(
          total(0, rank, times(["Binomial", rank, "bk"], entry("pb", add("bk", 1))), "bk"),
          times(rank, entry("pb", rank)),
        ),
        E: byRank(4598, 90408, 5506504),
        F: 268,
        G: 8,
      }),
    ),
    "A parabolic subgroup is the pointwise stabilizer of a subspace (Steinberg), so these are the flats of the reflection arrangement; Marin calls the counts the parabolic Bell numbers. The exceptional types are tabulated.",
  ),
  stat(
    "WeylGroupMinimalFaithfulPermutationDegree",
    "The least number of points a permutation action of the Weyl group can have and stay faithful: the orbit of a fundamental weight of least size, n + 1 for A_n, 2 n for B_n, C_n and D_n.",
    byLetter({ A: add(rank, 1), BC: times(2, rank), D: times(2, rank), E: byRank(27, 56, 240), F: 24, G: 6 }),
    "The degrees are tabulated by type (Stembridge, Computational aspects of root systems, Coxeter groups, and Weyl characters, Table 1).",
  ),
  stat(
    "WeylGroupInvolutionClassCount",
    "The conjugacy classes of the Weyl group whose elements are involutions, the identity left out: a class is a set of cycle types with positive and negative one- and two-cycles.",
    byLetter({
      A: divide(subtract(add(rank, 1), ["Mod", add(rank, 1), 2]), 2),
      BC: subtract(
        times(
          add(divide(subtract(rank, ["Mod", rank, 2]), 2), 1),
          subtract(add(rank, 1), divide(subtract(rank, ["Mod", rank, 2]), 2)),
        ),
        1,
      ),
      D: add(
        subtract(
          divide(
            times(
              add(divide(subtract(rank, ["Mod", rank, 2]), 2), 1),
              add(divide(subtract(rank, ["Mod", rank, 2]), 2), 2),
            ),
            2,
          ),
          1,
        ),
        subtract(1, ["Mod", rank, 2]),
      ),
      E: byRank(4, 9, 9),
      F: 7,
      G: 3,
    }),
    "An involution of B_n has a positive one-cycles, b negative ones and c positive two-cycles with a + b + 2 c = n (a negative two-cycle has order 4), and one of D_n has b even; the class of the one with only two-cycles, none negative, splits in two. The exceptional types are tabulated.",
  ),
  stat(
    "WeylGroupConnectedElementCount",
    "The elements of the Coxeter group whose reduced words use every simple reflection, by inclusion and exclusion over the standard parabolic subgroups: the indecomposable permutations for A_n.",
    byCases(
      [
        [isLetter("E"), byRank(47527, 2823981, 693437119)],
        [isLetter("F"), 1057],
        [isLetter("G"), 9],
      ],
      bindList(
        "cp",
        indecomposablePermutations(add(rank, 1)),
        byLetter({
          A: exactly(["Factorial", add(rank, 1)], entry("cp", add(rank, 1))),
          BC: exactly(
            times(power(2, rank), ["Factorial", rank]),
            subtract(
              times(power(2, rank), ["Factorial", rank]),
              total(
                0,
                subtract(rank, 1),
                times(power(2, "ck"), ["Factorial", "ck"], entry("cp", subtract(rank, "ck"))),
                "ck",
              ),
            ),
          ),
          D: exactly(
            times(power(2, rank), ["Factorial", rank]),
            subtract(
              total(
                0,
                subtract(rank, 3),
                times(
                  [
                    "If",
                    equals("ck", subtract(rank, 3)),
                    1,
                    ["Negate", entry("cp", ["Max", 1, subtract(subtract(rank, 3), "ck")])],
                  ],
                  add(
                    subtract(["Factorial", add("ck", 2)], times(2, ["Factorial", add("ck", 3)])),
                    times(power(2, add("ck", 2)), ["Factorial", add("ck", 3)]),
                  ),
                ),
                "ck",
              ),
              entry("cp", subtract(rank, 2)),
            ),
          ),
          E: 0,
          F: 0,
          G: 0,
        }),
      ),
    ),
    "For B_n the elements whose support misses the last node are 2^k k! C(n - k) with C the indecomposable permutations; D_n splits by the component through the node n - 2. The exceptional types are the alternating sums of the orders of their standard parabolic subgroups.",
  ),
];
