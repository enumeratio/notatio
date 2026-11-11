// Integer-partition statistics, over `_x` = the parts in WEAKLY DECREASING order.
//
// The conjugate is the workhorse: the conjugate of λ has, in position i, the number of parts
// of λ that are at least i. Written once here, several statistics that read "down the
// columns" become statements about the conjugate rather than fresh definitions — which is
// exactly the reduction-to-lesser-symbols the whole exercise is for.

import { fold as foldWithType } from "../../collections/src/families/tables.ts";
import type { Definition, MathJSON } from "../../src/statistics/types.ts";
import {
  add,
  adjacent,
  and,
  at,
  atLeastValue,
  atMostValue,
  bind,
  count,
  equals,
  distance,
  floored,
  fold,
  forEach,
  greater,
  length,
  less,
  nonEmpty,
  or,
  positions,
  subtract,
  sumOver,
  upTo,
  where,
  x,
} from "../../src/statistics/vocabulary.ts";

/** The shared typed fold (a list accumulator the compiler can index), as this file's expressions. */
const typedFold = (...args: Parameters<typeof foldWithType>): MathJSON => foldWithType(...args) as MathJSON;

const on = "IntegerPartition";
const stat = (
  head: string,
  summary: string,
  expr: Definition["expr"],
  note?: string,
  checkWeight?: number,
): Definition => ({
  head,
  on,
  summary,
  expr,
  ...(note ? { note } : {}),
  ...(checkWeight === undefined ? {} : { checkWeight }),
});

/** Interpreting these tables costs seconds per subject past a dozen cells (a 5 x 5 box takes over
 *  a minute), while the compiled code takes milliseconds at any size. The compile cross-check
 *  stops at 10 cells: every partition up to that size is still compared, among them repeated
 *  parts, one row and one column. */
const TABLE_CHECK_WEIGHT = 10;

const here = at("i");
const largest: MathJSON = ["Max", x];

/** The conjugate partition: column i is how many parts are at least i. */
const conjugate: MathJSON = forEach(upTo(largest), count(positions, atLeastValue(at("j"), "i"), "j"));

/** The number of cells strictly right of the diagonal in row i — the arm of cell (i, i). */
const armAt = (i: MathJSON): MathJSON => subtract(at(i), i);
/** Cells strictly below the diagonal in column i — the leg of cell (i, i). */
const legAt = (i: MathJSON): MathJSON => subtract(["At", conjugate, i], i);

/** The hook length of cell (i, j): arm + leg + 1. */
const hookAt: MathJSON = add(add(subtract(at("i"), "j"), subtract(["At", conjugate, "j"], "i")), 1);
/** The product of every hook length. Named once so StandardTableauCount can be defined
 *  in terms of it rather than repeating the diagram walk. */
const hookProduct: MathJSON = ["Product", forEach(positions, ["Product", forEach(upTo(here), hookAt, "j")])];
/** How many parts equal 1 — the ω of the crank. */
const ones: MathJSON = count(positions, equals(here, 1));

/** The side of the Durfee square: the largest d with at least d parts of size at least d. */
const durfee: MathJSON = ["Count", where(positions, atLeastValue(here, "i"))];

/** How many parts equal `value`. */
const multiplicityOf = (value: MathJSON): MathJSON => count(positions, equals(here, value));
/** The sum of the parts. */
const total: MathJSON = ["Sum", x];
/** `body` with `c` bound to the conjugate, evaluated once rather than at every cell. */
const withConjugate = (body: MathJSON): MathJSON => bind("c", conjugate, body, "list<integer>");
/** The conjugate's entry for column j, reading the bound `c`. */
const columnLength = (j: MathJSON): MathJSON => ["At", "c", j];
/** Arm minus leg of cell (i, j). */
const armMinusLeg: MathJSON = subtract(subtract(here, "j"), subtract(columnLength("j"), "i"));
/** Hook length of cell (i, j), reading the bound `c`. */
const hookWith: MathJSON = add(add(subtract(here, "j"), subtract(columnLength("j"), "i")), 1);
/** `body` summed over every cell (i, j); reads the bound `c`. */
const sumOverCells = (body: MathJSON): MathJSON =>
  nonEmpty(withConjugate(sumOver(positions, sumOver(upTo(here), body, "j"))));
/** The cells (i, j) satisfying `predicate`; reads the bound `c`. */
const cellsWhere = (predicate: MathJSON): MathJSON =>
  nonEmpty(withConjugate(sumOver(positions, count(upTo(here), predicate, "j"))));
/** The side of the largest staircase (k, k-1, ..., 1) that fits: the least part + i - 1 over rows 1 .. length + 1, where row length + 1 has part 0. */
const staircaseSide: MathJSON = [
  "Min",
  forEach(upTo(add(length(), 1)), ["If", equals("i", add(length(), 1)), length(), add(here, subtract("i", 1))]),
];

/** The largest even part, 0 if there is none. */
const largestEven: MathJSON = ["Max", forEach(positions, ["If", equals(["Mod", here, 2], 0), here, 0])];
/** The distinct sums of sub-multisets of the parts, 0 (the empty one) included: each part either joins or not. */
const subsetSums: MathJSON = fold(x, ["List", 0], ["Unique", ["Join", "a", forEach("a", add("i", "b"))]]);

/** m!, with 0! = 1 (`Range(1, 0)` stays symbolic). */
const factorialOf = (m: MathJSON): MathJSON => ["If", equals(m, 0), 1, ["Product", ["Range", 1, m]]];
/** The product of the factorials of the multiplicities: a part's factor is its place within its run of equal parts. */
const multiplicityFactorials: MathJSON = ["Product", forEach(positions, count(upTo("i"), equals(at("j"), here), "j"))];
/** The sum of the greatest common divisors of all pairs of parts. */
const pairwiseGreatestCommonDivisorSum: MathJSON = sumOver(
  positions,
  sumOver(
    positions,
    ["If", less("j", "i"), ["Divide", ["Multiply", at("i"), at("j")], ["LCM", at("i"), at("j")]], 0],
    "j",
  ),
);
/** The least common multiple and the greatest common divisor of the parts. */
const leastCommonMultiple: MathJSON = fold(["Rest", x], at(1), ["LCM", "a", "b"]);
const greatestCommonDivisor: MathJSON = fold(["Rest", x], at(1), ["Divide", ["Multiply", "a", "b"], ["LCM", "a", "b"]]);
/** C(n, 2) and C(n, 3), for n a count. */
const choose2 = (n: MathJSON): MathJSON => ["Divide", ["Multiply", n, subtract(n, 1)], 2];
const choose3 = (n: MathJSON): MathJSON => ["Divide", ["Multiply", n, subtract(n, 1), subtract(n, 2)], 6];
/** How many parts equal `value`, outside a definition that already binds `i`. */
const partsEqualTo = (value: number): MathJSON => count(positions, equals(here, value));
/** C(n, k) for counts, 0 when k > n. */
const binomialOf = (n: MathJSON, k: MathJSON): MathJSON => [
  "If",
  greater(k, n),
  0,
  ["Divide", factorialOf(n), ["Multiply", factorialOf(k), factorialOf(subtract(n, k))]],
];

/** 1 when `p` is even, 0 when odd. */
const deltaEven = (p: MathJSON): MathJSON => ["If", equals(["Mod", p, 2], 0), 1, 0];
/** Half the last part, rounded up when it is odd: (last + 1 - delta)/2. */
const lastFactor: MathJSON = ["Divide", subtract(add(at(length()), 1), deltaEven(at(length()))), 2];

/** The gap from part i to the next, less 1 for each of the two that is even. */
const pairGap: MathJSON = subtract(
  subtract(subtract(here, at(add("i", 1))), deltaEven(here)),
  deltaEven(at(add("i", 1))),
);

/** The number of standard Young tableaux: the size factorial over the hook product. */
const standardTableauxCount: MathJSON = ["Divide", factorialOf(total), hookProduct];
/** The number of semistandard tableaux with entries up to `k`: the product of (k + j - i) over the cells, over the hook product. */
const semistandardTableauxCount = (k: MathJSON): MathJSON => [
  "Divide",
  ["Product", forEach(positions, ["Product", forEach(upTo(here), add(k, subtract("j", "i")), "j")])],
  hookProduct,
];
/** The same, 0 where the shape has more rows than entries: spelled out, or the compiled form leaves a -0. */
const boundedSemistandardTableauxCount = (k: number): MathJSON => [
  "If",
  greater(length(), k),
  0,
  semistandardTableauxCount(k),
];
/** The sum of the squares of the hook lengths, reading the conjugate in place. */
const hookSquareSum: MathJSON = ["Sum", forEach(positions, ["Sum", forEach(upTo(here), ["Power", hookAt, 2], "j")])];
/** C(2p, p), as the rising product over p!. */
const centralBinomial = (p: MathJSON): MathJSON => [
  "Divide",
  ["Product", ["Range", add(p, 1), ["Multiply", 2, p]]],
  factorialOf(p),
];
/**
 * The partitions contained in the shape, row by row. Entry j + 1 counts the choices of the first rows whose last row has j cells (j = 0 .. largest part, so
 * `upTo(largest + 1)` positions); each row may be any size up to the shape's row and at most the row above, so its entry sums the entries from j up.
 * `least` is the smallest size a row may take, 0 or 1 (every row non-empty: same length).
 */
const subpartitionRow = (previous: MathJSON, least: number, rowLength: MathJSON): MathJSON =>
  forEach(upTo(add(largest, 1)), [
    "If",
    and(atLeastValue("i", least + 1), atMostValue("i", add(rowLength, 1))),
    sumOver(["Range", "i", add(largest, 1)], at("k", previous), "k"),
    0,
  ]);
const subpartitionCounts = (least: number): MathJSON =>
  fold(
    ["Rest", x],
    forEach(upTo(add(largest, 1)), ["If", atLeastValue("i", least + 1), 1, 0]),
    subpartitionRow("a", least, "b"),
  );
/** Orbits on the edges of the complete graph: half of each part rounded down, plus the gcd of every pair of parts. */
const edgeOrbits: MathJSON = add(
  sumOver(positions, ["Divide", subtract(here, ["Mod", here, 2]), 2]),
  pairwiseGreatestCommonDivisorSum,
);
/**
 * Bulgarian solitaire on the multiplicity vector (entry j = how many parts equal j), which needs no sorting:
 * every part loses a cell and a part of the old number of parts joins.
 */
const solitaireStart: MathJSON = forEach(upTo(total), count(positions, equals(at("p"), "j"), "p"), "j");
const solitaireMoveOf = (state: MathJSON): MathJSON =>
  forEach(
    upTo(total),
    add(["If", less("j", total), at(add("j", 1), state), 0], ["If", equals("j", ["Sum", state]), 1, 0]),
    "j",
  );
/** After this many steps the orbit has surely reached its cycle: the pre-period is below size^2. */
const solitaireSteps: MathJSON = ["Multiply", total, add(total, 1)];
/** `steps` moves from `state`, none when `steps` is 0 (a bare `Range(1, 0)` counts down). */
const solitaireAfter = (steps: MathJSON, state: MathJSON): MathJSON =>
  fold(["Range", 1, steps, 1], state, solitaireMoveOf("a"));
const sameState = (u: MathJSON, v: MathJSON): MathJSON =>
  equals(["Sum", forEach(upTo(total), distance(at("j", u), at("j", v)), "j")], 0);
/** The length of the cycle: the fewest steps (at most the size) that bring the state `c`, already on it, back to itself. */
const solitairePeriod: MathJSON = ["Min", where(upTo(total), sameState(solitaireAfter("l", "c"), "c"), "l")];
/** Steps before the cycle: the times the state differs from the one a period on, which walk together one step at a time. */
const solitairePreperiod: MathJSON = bind(
  "p",
  solitairePeriod,
  [
    "Sum",
    [
      "At",
      fold(
        ["Range", 1, add(solitaireSteps, 1), 1],
        ["List", solitaireStart, solitaireAfter("p", solitaireStart), ["List", 0]],
        [
          "List",
          solitaireMoveOf(["At", "a", 1]),
          solitaireMoveOf(["At", "a", 2]),
          [
            "List",
            add(at(1, ["At", "a", 3]), [
              "Min",
              1,
              ["Sum", forEach(upTo(total), distance(at("j", ["At", "a", 1]), at("j", ["At", "a", 2])), "j")],
            ]),
          ],
        ],
      ),
      3,
    ],
  ],
  "integer",
);
/** `body` with `c` bound to a state on the cycle. */
const onSolitaireCycle = (body: MathJSON): MathJSON =>
  bind("c", solitaireAfter(solitaireSteps, solitaireStart), body, "list<integer>");
/**
 * The partitions of the size dominated by `bound`, a partition of that size, by a table over the rows of the candidate: entry
 * (s, m) counts the non-increasing rows so far (zeros allowed, so every partition is one sequence) summing to s and ending
 * at m. Row k may only bring the sum to at most the first k parts of `bound` (padded with zeros). `rows` rows are laid, so
 * the candidates have at most that many parts. Entries are indexed from 1: row s + 1, column m + 1.
 */
const dominatedPartitionTableOf = (bound: MathJSON, rows: MathJSON): MathJSON =>
  fold(
    upTo(rows),
    forEach(
      upTo(add(total, 1)),
      forEach(upTo(add(total, 1)), ["If", and(equals("r", 1), equals("c", add(total, 1))), 1, 0], "c"),
      "r",
    ),
    forEach(
      upTo(add(total, 1)),
      forEach(
        upTo(add(total, 1)),
        [
          "If",
          and(
            atMostValue("c", "r"),
            atMostValue(
              subtract("r", 1),
              sumOver(["Range", 1, "b", 1], ["If", atMostValue("q", length(bound)), at("q", bound), 0], "q"),
            ),
          ),
          sumOver(["Range", "c", add(total, 1), 1], at("d", at(add(subtract("r", "c"), 1), "a")), "d"),
          0,
        ],
        "c",
      ),
      "r",
    ),
  );
const dominatedPartitionTable: MathJSON = dominatedPartitionTableOf(x, total);
/**
 * Permutations whose cube is a fixed permutation with `a` cycles of length `d`: a cycle of d is the cube of a d-cycle
 * (unless 3 divides d), and three of them are the cube of a 3d-cycle in 2d^2 ways, over the unordered triples of cycles.
 */
const cubeRoots = (d: MathJSON, a: MathJSON): MathJSON =>
  sumOver(
    ["Range", 0, ["Divide", subtract(a, ["Mod", a, 3]), 3], 1],
    [
      "If",
      or(greater(["Mod", d, 3], 0), equals(a, ["Multiply", 3, "s"])),
      [
        "Multiply",
        [
          "Divide",
          factorialOf(a),
          ["Multiply", factorialOf(subtract(a, ["Multiply", 3, "s"])), ["Power", 6, "s"], factorialOf("s")],
        ],
        ["Power", ["Multiply", 2, d, d], "s"],
      ],
      0,
    ],
    "s",
  );
/**
 * Hurwitz's count of genus-0 factorizations: (n + c - 2)! n^(c-3) prod p^p / (p-1)! for n cells in c parts. The power of n
 * goes to the numerator or the denominator by the sign of c - 3, so the quotient is of integers.
 */
const hurwitzNumber: MathJSON = [
  "Divide",
  [
    "Multiply",
    factorialOf(add(total, subtract(length(), 2))),
    ["Power", total, ["Max", subtract(length(), 3), 0]],
    ["Product", forEach(positions, ["Power", here, here])],
  ],
  [
    "Multiply",
    ["Power", total, ["Max", subtract(3, length()), 0]],
    ["Product", forEach(positions, factorialOf(subtract(here, 1)))],
  ],
];
/**
 * The Catalan numbers C(0), ..., C(largest part) as a list, by C(m) = sum of C(k) C(m - 1 - k): only sums and products of
 * positive integers, so a value past 2^53 reaches the answer and the compiled code declines, never rounds.
 */
const catalanTable: MathJSON = fold(
  upTo(largest),
  ["List", 1],
  [
    "Join",
    "a",
    [
      "List",
      sumOver(upTo(["Length", "a"]), ["Multiply", at("i", "a"), at(subtract(["Length", "a"], subtract("i", 1)), "a")]),
    ],
  ],
);
/**
 * The distinct sub-multisets of the parts, as one index t = 1 .. T in a mixed radix with a digit per run of equal parts: the
 * digit of a run (how many of its parts are taken) is floor((t - 1) / stride) mod (run length + 1), the stride being the product
 * of (run length + 1) over the runs of larger parts. A part is taken when its place within its run is at most its run's digit.
 * These read the bound lists `m` (the length of each part's run), `r` (its place in the run) and `s` (its run's stride).
 */
const endsRunAt = (j: MathJSON): MathJSON => equals(at(j, "r"), at(j, "m"));
const runLengths: MathJSON = forEach(positions, count(positions, equals(at("j"), here), "j"));
const placesInRun: MathJSON = forEach(positions, count(upTo("i"), equals(at("j"), here), "j"));
const runStrides: MathJSON = forEach(positions, [
  "Product",
  forEach(positions, ["If", and(greater(at("j"), here), endsRunAt("j")), add(at("j", "m"), 1), 1], "j"),
]);
const submultisetCount: MathJSON = [
  "Product",
  forEach(positions, ["If", endsRunAt("j"), add(at("j", "m"), 1), 1], "j"),
];
/** floor(a / b) for integers, without `Floor`. */
const quotient = (a: MathJSON, b: MathJSON): MathJSON => ["Divide", subtract(a, ["Mod", a, b]), b];
const takenAt = (i: MathJSON): MathJSON => [
  "If",
  atMostValue(at(i, "r"), ["Mod", quotient(subtract("t", 1), at(i, "s")), add(at(i, "m"), 1)]),
  1,
  0,
];
/** How many parts up to position i the sub-multiset t takes: the rank of position i among them, when it is taken. */
const takenRankAt = (i: MathJSON): MathJSON => floored(["Sum", forEach(upTo(i), takenAt("j"), "j")]);
/**
 * 1 when the sub-multiset t fails to dominate its conjugate, else 0: for some k the first k taken parts sum to less than the
 * first k parts of the conjugate, which sum to min(part, k) over the taken parts.
 */
const failsToDominateConjugate: MathJSON = [
  "Min",
  1,
  floored([
    "Sum",
    forEach(
      upTo(total),
      [
        "If",
        less(
          floored([
            "Sum",
            forEach(positions, ["Multiply", takenAt("i"), here, ["If", atMostValue(takenRankAt("i"), "k"), 1, 0]]),
          ]),
          floored(["Sum", forEach(positions, ["Multiply", takenAt("i"), ["Min", here, "k"]])]),
        ),
        1,
        0,
      ],
      "k",
    ),
  ]),
];
const nonDominatingSubmultisets: MathJSON = bind(
  "m",
  runLengths,
  bind(
    "r",
    placesInRun,
    bind(
      "s",
      runStrides,
      floored(["Sum", forEach(upTo(submultisetCount), failsToDominateConjugate, "t")]),
      "list<integer>",
    ),
    "list<integer>",
  ),
  "list<integer>",
);
/** The parts before position i that are larger than part i: with the parts weakly decreasing, those that differ from it. */
const largerPartsBefore: MathJSON = count(positions, and(less("j", "i"), greater(at("j"), here)), "j");

/**
 * The partition numbers p(0), ..., p(largest part) as a list, by the table that adds one part size at a time:
 * with parts up to b allowed, p(s) is the sum of the old p(s - t b) over every t.
 */
const partitionNumberTable: MathJSON = fold(
  upTo(largest),
  forEach(upTo(add(largest, 1)), ["If", equals("i", 1), 1, 0]),
  forEach(
    upTo(add(largest, 1)),
    sumOver(
      ["Range", 0, ["Divide", subtract(subtract("i", 1), ["Mod", subtract("i", 1), "b"]), "b"]],
      at(subtract("i", ["Multiply", "t", "b"]), "a"),
      "t",
    ),
  ),
);
/**
 * The k-rim hooks removed to reach the k-core: (size - core size) / k. On the abacus the beads are the parts
 * shifted to distinct positions, part i + length - i; the core slides the c beads of each runner r (position mod k) to the
 * first c places of the runner, which sit at r, r + k, ..., so its beads sum to c r + k c (c - 1) / 2 over the runners.
 */
const rimHooksRemoved = (k: number): MathJSON => {
  const beadsOnRunner = count(positions, equals(["Mod", add(here, subtract(length(), "i")), k], "r"));
  const coreBeadSum = sumOver(
    ["Range", 0, k - 1],
    ["Multiply", beadsOnRunner, add("r", ["Divide", ["Multiply", k, subtract(beadsOnRunner, 1)], 2])],
    "r",
  );
  return ["Divide", subtract(total, subtract(coreBeadSum, choose2(length()))), k];
};
/** Part `i` of the highest weight (0 past the end) plus its Weyl shift for Sp(2r): the rho entry is r + 1 - i. */
const symplecticWeight = (i: number, r: number): MathJSON =>
  add(["If", atLeastValue(length(), i), at(i), 0], r + 1 - i);

/** The parts shortest first: the order a Ferrers board is filled row by row. */
const rowsAscending: MathJSON = forEach(positions, at(add(subtract(length(), "i"), 1)));
/**
 * The rook numbers r_0 .. r_length of the Ferrers board, as a list (entry k + 1 is r_k): a row of b cells takes its rook
 * in one of the b - (k - 1) columns the earlier rows' k - 1 rooks leave free.
 */
const rookNumbers: MathJSON = fold(
  rowsAscending,
  forEach(upTo(add(length(), 1)), ["If", equals("i", 1), 1, 0]),
  forEach(upTo(add(length(), 1)), [
    "If",
    equals("i", 1),
    at(1, "a"),
    add(at("i", "a"), ["Multiply", subtract("b", subtract("i", 2)), at(subtract("i", 1), "a")]),
  ]),
);
/** The parts that start a run of equal parts, one per distinct part size. */
const startsOfRuns: MathJSON = ["Or", equals("i", length()), greater(here, at(add("i", 1)))];
/** Euler's totient of `d`: the numbers up to d with no common factor with it. */
const totientOf = (d: MathJSON): MathJSON =>
  count(upTo(d), equals(["Divide", ["Multiply", "k", d], ["LCM", "k", d]], 1), "k");
/**
 * The standard tableaux counted by their major index: entry k + 1 of the list is the number whose major index is k (k up to size
 * (size + 1) / 2, past the largest possible). The q-hook formula: q^n(λ) times the product of 1 - q^i for i up to the size, over that of
 * 1 - q^h for the hooks h; multiply out, then divide by each 1 - q^h as the sum along its arithmetic progression.
 */
const majorIndexCounts: MathJSON = withConjugate(
  fold(
    ["Flatten", forEach(positions, forEach(upTo(here), hookWith, "j"))],
    fold(
      upTo(total),
      forEach(upTo(add(["Divide", ["Multiply", total, add(total, 1)], 2], 1)), ["If", equals("i", 1), 1, 0]),
      forEach(upTo(add(["Divide", ["Multiply", total, add(total, 1)], 2], 1)), [
        "If",
        greater("i", "b"),
        subtract(at("i", "a"), at(subtract("i", "b"), "a")),
        at("i", "a"),
      ]),
    ),
    forEach(
      upTo(add(["Divide", ["Multiply", total, add(total, 1)], 2], 1)),
      sumOver(
        ["Range", 0, ["Divide", subtract(subtract("i", 1), ["Mod", subtract("i", 1), "b"]), "b"]],
        at(subtract("i", ["Multiply", "t", "b"]), "a"),
        "t",
      ),
    ),
  ),
);
/** The minimum major index of a standard tableau: the sum over the rows of (row - 1) times its length. */
const minimalMajorIndex: MathJSON = sumOver(positions, ["Multiply", subtract("i", 1), here]);
/** The standard tableaux whose major index leaves remainder `remainder` on division by the size. */
const tableauxWithMajorIndexRemainder = (remainder: number): MathJSON =>
  bind(
    "m",
    minimalMajorIndex,
    bind(
      "q",
      majorIndexCounts,
      sumOver(upTo(add(["Divide", ["Multiply", total, add(total, 1)], 2], 1)), [
        "If",
        equals(["Mod", add(subtract("i", 1), "m"), total], remainder),
        at("i", "q"),
        0,
      ]),
      "list<integer>",
    ),
    "number",
  );
/**
 * The partitions that cover `partition` in dominance order, counted: Brylawski's covers move a cell from row j up to row i < j,
 * when the result is still a partition and the rows are adjacent or equal. `partition` is bound to `u`.
 */
const upperCoversIn = (partition: MathJSON): MathJSON => {
  const part = (k: MathJSON): MathJSON => at(k, "u");
  const rows: MathJSON = ["Length", "u"];
  return bind(
    "u",
    partition,
    sumOver(
      upTo(rows),
      count(
        upTo(rows),
        and(
          greater("j", "i"),
          and(
            or(equals("i", 1), greater(part(subtract("i", 1)), part("i"))),
            and(
              or(equals("j", rows), greater(part("j"), part(add("j", 1)))),
              or(equals("j", add("i", 1)), equals(part("i"), part("j"))),
            ),
          ),
        ),
        "j",
      ),
    ),
    "list<integer>",
  );
};
/** The number of odd parts. */
const oddParts: MathJSON = count(positions, equals(["Mod", here, 2], 1));
/** The product of the factorials of the halves of the parts, rounded down. */
const halfPartFactorials: MathJSON = [
  "Product",
  forEach(positions, factorialOf(["Divide", subtract(here, ["Mod", here, 2]), 2])),
];
/** The sum over the rotations of the cyclic group of the colorings each fixes: the d-th power of a rotation has d cycles of equal length. */
const rotationFixedColorings: MathJSON = bind(
  "g",
  greatestCommonDivisor,
  sumOver(
    upTo("g"),
    [
      "If",
      equals(["Mod", "g", "d"], 0),
      [
        "Divide",
        ["Multiply", totientOf("d"), factorialOf(["Divide", total, "d"])],
        ["Product", forEach(positions, factorialOf(["Divide", here, "d"]))],
      ],
      0,
    ],
    "d",
  ),
  "number",
);

/** The bitwise exclusive or of two nonnegative integers below 2^(size + 1): u + v - 2 (u and v), the common bits summed place by place. */
const bitwiseXor = (u: MathJSON, v: MathJSON): MathJSON => {
  const bitOf = (value: MathJSON): MathJSON => [
    "Mod",
    ["Divide", subtract(value, ["Mod", value, ["Power", 2, "k"]]), ["Power", 2, "k"]],
    2,
  ];
  return subtract(add(u, v), [
    "Multiply",
    2,
    sumOver(["Range", 0, total], ["Multiply", ["Power", 2, "k"], bitOf(u), bitOf(v)], "k"),
  ]);
};
/** The nim-sum of a list of nonnegative integers. */
const nimSum = (values: MathJSON): MathJSON => fold(values, 0, bitwiseXor("a", "b"));

/**
 * The Grundy values g(1) .. g(size) of "Couples are forever" on one part: a part above 2 splits into two parts,
 * a position is worth the nim-sum of its parts, so g(m) is the least value missing from the nim-sums g(s) + g(m - s).
 */
const couplesGrundyTable: MathJSON = fold(
  upTo(total),
  forEach(upTo(total), 0),
  forEach(upTo(total), [
    "If",
    equals("i", "b"),
    [
      "If",
      less("b", 3),
      0,
      bind(
        "s",
        forEach(["Range", 1, subtract("b", 1)], bitwiseXor(at("j", "a"), at(subtract("b", "j"), "a")), "j"),
        [
          "Min",
          forEach(
            ["Range", 0, subtract("b", 1)],
            ["If", equals(sumOver("s", ["If", equals("m", "k"), 1, 0], "m"), 0), "k", "b"],
            "k",
          ),
        ],
        "list<integer>",
      ),
    ],
    at("i", "a"),
  ]),
);

/** Staircase nim on the rows: a row loses cells down to the next row's length, so the differences are heaps whose coins fall one step; the nim-sum of the odd-numbered heaps is the Grundy value. */
const oddStepHeaps: MathJSON = forEach(positions, [
  "If",
  equals(["Mod", "i", 2], 1),
  ["If", equals("i", length()), here, subtract(here, at(add("i", 1)))],
  0,
]);

/**
 * The refinement, coarsening and chain counts walk the partitions reached from this one by single moves (a split of a
 * part in two, or a merge of two parts), a level at a time: a move changes the number of parts by one, so a level holds
 * the partitions with that many parts and none is in two levels. A partition is its multiplicities, place j holding
 * how many parts equal j (1 .. size); a level is its partitions' multiplicities end to end, size places each.
 */
const multiplicities: MathJSON = forEach(upTo(total), count(positions, equals(here, "k")), "k");
/** Whole division of the nonnegative integer m by d. */
const quotientOf = (m: MathJSON, d: MathJSON): MathJSON => ["Divide", subtract(m, ["Mod", m, d]), d];
const isPlace = (k: MathJSON, j: MathJSON): MathJSON => ["If", equals(k, j), 1, 0];
/** The splits of a part j >= 2 into a and j - a with a <= j - a: the parts j, then the parts a, in step. */
const splitBigs: MathJSON = [
  "Flatten",
  forEach(["Range", 2, total], forEach(["Range", 1, quotientOf("pj", 2)], "pj", "pa"), "pj"),
  1,
];
const splitSmalls: MathJSON = [
  "Flatten",
  forEach(["Range", 2, total], forEach(["Range", 1, quotientOf("pj", 2)], "pa", "pa"), "pj"),
  1,
];
/** The merges of two parts a <= b into a + b with a + b <= size: the parts a, then the parts b, in step. */
const mergeFirsts: MathJSON = [
  "Flatten",
  forEach(["Range", 1, quotientOf(total, 2)], forEach(["Range", "pa", subtract(total, "pa")], "pa", "pb"), "pa"),
  1,
];
const mergeSeconds: MathJSON = [
  "Flatten",
  forEach(["Range", 1, quotientOf(total, 2)], forEach(["Range", "pa", subtract(total, "pa")], "pb", "pb"), "pa"),
  1,
];
/** The bound level `fl`'s place `k` of partition `e`. */
const placeOf = (e: MathJSON, k: MathJSON): MathJSON => at(add(["Multiply", subtract(e, 1), total], k), "fl");
/** `body` with `e` the partition of the level and `q` the move that candidate `t` (from 1) stands for. */
const candidate = (t: MathJSON, body: MathJSON): MathJSON =>
  bind(
    "e",
    add(1, quotientOf(subtract(t, 1), length("mj"))),
    bind("q", add(1, ["Mod", subtract(t, 1), length("mj")]), body, "integer"),
    "integer",
  );
const firstPart: MathJSON = at("q", "mj");
const secondPart: MathJSON = at("q", "ma");
const splitApplies: MathJSON = atLeastValue(placeOf("e", firstPart), 1);
/** Place k after splitting firstPart into secondPart and the rest. */
const splitCell = (k: MathJSON): MathJSON =>
  add(
    add(subtract(placeOf("e", k), isPlace(k, firstPart)), isPlace(k, secondPart)),
    isPlace(k, subtract(firstPart, secondPart)),
  );
/** A merge needs two parts, or two of one size when they are equal. */
const mergeNeeds: MathJSON = add(1, isPlace(firstPart, secondPart));
const mergeApplies: MathJSON = and(
  atLeastValue(placeOf("e", firstPart), mergeNeeds),
  atLeastValue(placeOf("e", secondPart), mergeNeeds),
);
/** Place k after merging firstPart and secondPart. */
const mergeCell = (k: MathJSON): MathJSON =>
  add(
    subtract(subtract(placeOf("e", k), isPlace(k, firstPart)), isPlace(k, secondPart)),
    isPlace(k, add(firstPart, secondPart)),
  );
/**
 * One level on from the bound level `fl` (end to end).
 * The candidates `ap` are the moves that apply, `cm` their partitions end to end; `sg` is a quick key that tells most
 * unequal candidates apart, and equal candidates are then confirmed place by place. `kp` keeps the first of each.
 */
const levelStep = (applies: MathJSON, cell: (k: MathJSON) => MathJSON): MathJSON => {
  const candidates = length("ap");
  const cellOf = (s: MathJSON, k: MathJSON): MathJSON => at(add(["Multiply", subtract(s, 1), total], k), "cm");
  const same = (s: MathJSON, u: MathJSON): MathJSON => [
    "If",
    equals(at(s, "sg"), at(u, "sg")),
    equals(sumOver(upTo(total), ["Abs", subtract(cellOf(s, "k"), cellOf(u, "k"))], "k"), 0),
    ["Equal", 1, 0],
  ];
  const kept = length("kp");
  return bind(
    "ap",
    where(["Range", 1, ["Multiply", quotientOf(length("fl"), total), length("mj")]], candidate("t", applies), "t"),
    bind(
      "cm",
      forEach(
        ["Range", 1, ["Multiply", candidates, total]],
        bind(
          "s",
          add(1, quotientOf(subtract("g", 1), total)),
          bind("c", add(1, ["Mod", subtract("g", 1), total]), candidate(at("s", "ap"), cell("c")), "integer"),
          "integer",
        ),
        "g",
      ),
      bind(
        "sg",
        forEach(
          ["Range", 1, candidates],
          sumOver(upTo(total), ["Multiply", cellOf("s", "k"), add(["Multiply", "k", "k"], 1)], "k"),
          "s",
        ),
        bind(
          "kp",
          where(
            ["Range", 1, candidates],
            equals(count(["Range", 1, candidates], and(less("u", "s"), same("s", "u")), "u"), 0),
            "s",
          ),
          [
            "List",
            forEach(
              ["Range", 1, ["Multiply", kept, total]],
              bind(
                "r",
                add(1, quotientOf(subtract("g", 1), total)),
                bind("c", add(1, ["Mod", subtract("g", 1), total]), cellOf(at("r", "kp"), "c"), "integer"),
                "integer",
              ),
              "g",
            ),
            ["List", 1],
            ["List", add(at(1, at(3, "a")), kept)],
          ],
          listOfIntegers,
        ),
        listOfIntegers,
      ),
      listOfIntegers,
    ),
    listOfIntegers,
  );
};
const listOfIntegers = "list<integer>";
/** The walk of `steps` levels from this partition with the moves `firsts`, `seconds`: [last level, [1], [partitions so far]]. */
const levelWalk = (
  steps: MathJSON,
  firsts: MathJSON,
  seconds: MathJSON,
  applies: MathJSON,
  cell: (k: MathJSON) => MathJSON,
): MathJSON =>
  bind(
    "mj",
    firsts,
    bind(
      "ma",
      seconds,
      fold(
        ["Range", 1, steps, 1],
        ["List", multiplicities, ["List", 1], ["List", 1]],
        bind("fl", at(1, "a"), bind("ways", at(2, "a"), levelStep(applies, cell), listOfIntegers), listOfIntegers),
      ),
      listOfIntegers,
    ),
    listOfIntegers,
  );
/** The partitions that refine this one (itself included): the splits of parts, one more part each level. */
const refinementCount: MathJSON = at(
  1,
  at(3, levelWalk(subtract(total, length()), splitBigs, splitSmalls, splitApplies, splitCell)),
);
/** The partitions this one refines (itself included): the merges of two parts, one fewer part each level. */
const coarseningCount: MathJSON = at(
  1,
  at(3, levelWalk(subtract(length(), 1), mergeFirsts, mergeSeconds, mergeApplies, mergeCell)),
);
/**
 * A partition of the size as one integer: place k (1 .. size) is a digit of radix size/k + 1, the most parts equal to k.
 * `pw` holds the place values; the code is exact below 2^53, which holds to size 30 (the chain counts pass 2^53 first).
 */
const radixPowers: MathJSON = fold(
  ["Range", 1, subtract(total, 1), 1],
  ["List", 1],
  ["Join", "a", ["List", ["Multiply", at(length("a"), "a"), add(quotientOf(total, "b"), 1)]]],
);
/** How many parts equal k in the partition with code c. */
const digitOf = (c: MathJSON, k: MathJSON): MathJSON => [
  "Mod",
  quotientOf(c, at(k, "pw")),
  add(quotientOf(total, k), 1),
];
/**
 * The chains of single splits from this partition to all ones, a level (one more part each) at a time. A level is its
 * partitions' codes `fl` with their chain counts `ways`; a split of a part j into a and j - a (`mj`, `ma`) moves a
 * code by a fixed amount `dl`, so no partition is ever spelled out. The new codes are sorted (`od`) to bring equal ones
 * together: `st` marks where each distinct code starts, and its run's chain counts are summed. Code 0, which is no
 * partition, stands for a split that does not apply and sorts first.
 */
const refinementChains: MathJSON = bind(
  "pw",
  radixPowers,
  bind(
    "mj",
    splitBigs,
    bind(
      "ma",
      splitSmalls,
      bind(
        "dl",
        forEach(
          ["Range", 1, length("mj")],
          subtract(
            add(at(at("i", "ma"), "pw"), at(subtract(at("i", "mj"), at("i", "ma")), "pw")),
            at(at("i", "mj"), "pw"),
          ),
        ),
        bind(
          "levels",
          fold(
            ["Range", 1, subtract(total, length()), 1],
            ["List", ["List", sumOver(positions, at(here, "pw"))], ["List", 1]],
            bind(
              "fl",
              at(1, "a"),
              bind(
                "ways",
                at(2, "a"),
                bind(
                  "moves",
                  length("mj"),
                  bind(
                    "nc",
                    forEach(
                      ["Range", 1, ["Multiply", length("fl"), "moves"]],
                      bind(
                        "e",
                        add(1, quotientOf(subtract("t", 1), "moves")),
                        bind(
                          "q",
                          add(1, ["Mod", subtract("t", 1), "moves"]),
                          [
                            "If",
                            atLeastValue(digitOf(at("e", "fl"), at("q", "mj")), 1),
                            add(at("e", "fl"), at("q", "dl")),
                            0,
                          ],
                          "integer",
                        ),
                        "integer",
                      ),
                      "t",
                    ),
                    bind(
                      "od",
                      ["Ordering", "nc"],
                      bind(
                        "sc",
                        forEach(["Range", 1, length("nc")], at(at("o", "od"), "nc"), "o"),
                        bind(
                          "st",
                          where(
                            ["Range", 1, length("nc")],
                            [
                              "If",
                              equals("o", 1),
                              greater(at(1, "sc"), 0),
                              and(greater(at("o", "sc"), 0), less(at(subtract("o", 1), "sc"), at("o", "sc"))),
                            ],
                            "o",
                          ),
                          [
                            "List",
                            forEach(["Range", 1, length("st")], at(at("r", "st"), "sc"), "r"),
                            forEach(
                              ["Range", 1, length("st")],
                              sumOver(
                                [
                                  "Range",
                                  at("r", "st"),
                                  ["If", equals("r", length("st")), length("nc"), subtract(at(add("r", 1), "st"), 1)],
                                ],
                                at(add(1, quotientOf(subtract(at("o", "od"), 1), "moves")), "ways"),
                                "o",
                              ),
                              "r",
                            ),
                          ],
                          listOfIntegers,
                        ),
                        listOfIntegers,
                      ),
                      listOfIntegers,
                    ),
                    listOfIntegers,
                  ),
                  "integer",
                ),
                listOfIntegers,
              ),
              listOfIntegers,
            ),
          ),
          ["Sum", at(2, "levels")],
          "list<list<integer>>",
        ),
        listOfIntegers,
      ),
      listOfIntegers,
    ),
    listOfIntegers,
  ),
  listOfIntegers,
);

/**
 * The ordered refinements, by a table over the totals t = 0 .. size. Entry (t, m) counts the weakly decreasing sequences of
 * parts summing to t and ending in m; a part m closes the total t from t - m, but only if no partial sum of this partition
 * falls strictly between (the sequence cuts into blocks summing to the parts). Row 0 stands for "no part yet", a part of any size.
 */
const orderedRefinementTable: MathJSON = bind(
  "pre",
  forEach(positions, sumOver(["Range", 1, "i"], at("q"), "q")),
  bind(
    "w",
    at(
      add(total, 1),
      fold(
        upTo(total),
        forEach(
          upTo(add(total, 1)),
          forEach(upTo(total), ["If", and(equals("r", 1), equals("c", total)), 1, 0], "c"),
          "r",
        ),
        forEach(
          upTo(add(total, 1)),
          [
            "If",
            equals("r", add("b", 1)),
            forEach(
              upTo(total),
              [
                "If",
                and(
                  atMostValue("c", "b"),
                  equals(sumOver("pre", ["If", and(greater("s", subtract("b", "c")), less("s", "b")), 1, 0], "s"), 0),
                ),
                sumOver(["Range", "c", total], at("m", at(add(subtract("b", "c"), 1), "a")), "m"),
                0,
              ],
              "c",
            ),
            at("r", "a"),
          ],
          "r",
        ),
      ),
    ),
    ["Sum", "w"],
    "list<integer>",
  ),
  "list<integer>",
);

/**
 * The cycle lengths of the square of a permutation of this cycle type, as the count of cycles of each length d = 1 .. largest part:
 * an odd cycle stays, an even cycle of length 2d splits into two of length d.
 */
const squareCycleCounts: MathJSON = forEach(
  upTo(largest),
  add(
    ["If", equals(["Mod", "d", 2], 1), count(positions, equals(here, "d")), 0],
    ["Multiply", 2, count(positions, equals(here, ["Multiply", 2, "d"]))],
  ),
  "d",
);
/**
 * The square roots of a permutation with `m` cycles of length `d`: s pairs of cycles each have d roots (a cycle of length 2d), and the
 * other m - 2s cycles are each the square of one cycle of length d, which exists only for odd d.
 */
const squareRoots = (d: MathJSON, m: MathJSON): MathJSON =>
  sumOver(
    ["Range", 0, ["Divide", subtract(m, ["Mod", m, 2]), 2], 1],
    [
      "If",
      or(equals(["Mod", d, 2], 1), equals(m, ["Multiply", 2, "s"])),
      [
        "Multiply",
        [
          "Divide",
          factorialOf(m),
          ["Multiply", factorialOf(subtract(m, ["Multiply", 2, "s"])), factorialOf("s"), ["Power", 2, "s"]],
        ],
        ["Power", d, "s"],
      ],
      0,
    ],
    "s",
  );
/** The beta-numbers of the shape: part i plus the number of parts after it. */
const betaNumbers: MathJSON = forEach(positions, add(here, subtract(length(), "i")));
/** Half of beta number `b`, rounded down: the position within its parity class, on the 2-quotient. */
const halfBeta = (b: MathJSON): MathJSON => ["Divide", subtract(b, ["Mod", b, 2]), 2];
/** The cells of the two partitions of the 2-quotient: the sum of the halved beta numbers less the staircases of the even and the odd classes. */
const twoQuotientSize: MathJSON = subtract(
  ["Sum", forEach("t", halfBeta("j"), "j")],
  add(choose2(count("t", equals(["Mod", "j", 2], 0), "j")), choose2(count("t", equals(["Mod", "j", 2], 1), "j"))),
);
/**
 * The self-evacuating standard tableaux, which are the standard domino tableaux: the shape has 2-core of at most one cell, and then the
 * pairs of standard tableaux of its 2-quotient, interleaved: (n div 2)! over the hook-length products, which on beta numbers are the
 * products of the factorials of the halved numbers over the differences of halved numbers in the same parity class.
 */
const selfEvacuatingTableauxCount: MathJSON = bind(
  "t",
  betaNumbers,
  [
    "If",
    equals(twoQuotientSize, halfBeta(total)),
    [
      "Divide",
      [
        "Multiply",
        factorialOf(halfBeta(total)),
        [
          "Product",
          forEach(upTo(length("t")), [
            "Product",
            forEach(
              upTo(length("t")),
              [
                "If",
                and(less("j", "i"), equals(["Mod", subtract(at("j", "t"), at("i", "t")), 2], 0)),
                ["Divide", subtract(at("j", "t"), at("i", "t")), 2],
                1,
              ],
              "j",
            ),
          ]),
        ],
      ],
      ["Product", forEach("t", factorialOf(halfBeta("j")), "j")],
    ],
    0,
  ],
  "list<integer>",
);

/**
 * The standard tableaux of `shape` by the parity of the entry that first descends, as alternating sums of the standard tableaux of the
 * skew shape `shape / (d)` (those with 1 .. d in the first row), each counted by Aitken's determinant expanded along its first-row
 * column: row i of the beta numbers t contributes (-1)^(i-1) times the Vandermonde product of the other beta numbers, times t_i!
 * and (n - d)!/(t_i - length + 1 - d)!, all over the product of every t_i!: the one division comes last, so every term is an integer.
 * `start` is the first d summed, and the d = start term is positive for 0 and negative for 1.
 * The first descent of a tableau is d when 1 .. d lie in the first row and d + 1 does not: that is the difference of two counts.
 */
const firstRowSkewSum = (shape: MathJSON, start: 0 | 1): MathJSON => {
  const t = (k: MathJSON): MathJSON => at(k, "t");
  const rows: MathJSON = length("t");
  const otherPairs = (row: MathJSON): MathJSON => [
    "Product",
    forEach(
      upTo(rows),
      [
        "Product",
        forEach(
          upTo(rows),
          ["If", and(and(less("r", "s"), ["NotEqual", "r", row]), ["NotEqual", "s", row]), subtract(t("r"), t("s")), 1],
          "s",
        ),
      ],
      "r",
    ),
  ];
  const reach = subtract(t("i"), subtract(rows, 1));
  return bind(
    "u",
    shape,
    bind(
      "t",
      forEach(upTo(length("u")), add(at("i", "u"), subtract(length("u"), "i"))),
      [
        "Divide",
        sumOver(upTo(rows), [
          "Multiply",
          ["If", equals(["Mod", "i", 2], 1), 1, -1],
          otherPairs("i"),
          factorialOf(t("i")),
          [
            "If",
            atLeastValue(reach, start),
            [
              "Sum",
              forEach(
                ["Range", start, reach],
                [
                  "Multiply",
                  ["If", equals(["Mod", add("d", start), 2], 0), 1, -1],
                  ["Divide", factorialOf(subtract(total, "d")), factorialOf(subtract(reach, "d"))],
                ],
                "d",
              ),
            ],
            0,
          ],
        ]),
        ["Product", forEach("t", factorialOf("j"), "j")],
      ],
      "list<integer>",
    ),
    "list<integer>",
  );
};
/** The standard tableaux of `shape` whose first descent (or n, when none) is even. */
const evenFirstDescentTableaux = (shape: MathJSON): MathJSON => firstRowSkewSum(shape, 0);

/** The value the fold over `upTo(largest)` is placing at its step b: the largest part, then each smaller. */
const distinctWeightValue: MathJSON = subtract(add(largest, 1), "b");
/**
 * The distinct weights (contents) of the semistandard tableaux of the shape with entries up to its length: the compositions of the size
 * into that many nonnegative parts whose sorted rearrangement the shape dominates, since the Kostka number is positive exactly then.
 * A table over the values from the largest part down, entry (r, s) counting the ways to give r of the positions, summing to s, values
 * so far: value v goes to k of the rest, in C(length - r, k) ways, and the sorted prefix sums stay within the shape's. They are
 * concave in the row count and the prefix sums of equal values linear, so only the first and last of the k rows need checking.
 * The rest of the positions take 0. Indexed from 1: row r + 1, column s + 1.
 */
const distinctWeightTable: MathJSON = bind(
  "p",
  forEach(positions, sumOver(upTo("i"), at("j"), "j")),
  fold(
    upTo(largest),
    forEach(
      ["Range", 0, length(), 1],
      forEach(["Range", 0, total, 1], ["If", and(equals("r", 0), equals("s", 0)), 1, 0], "s"),
      "r",
    ),
    forEach(
      ["Range", 0, length(), 1],
      forEach(
        ["Range", 0, total, 1],
        floored([
          "Sum",
          forEach(
            ["Range", 0, "r", 1],
            [
              "If",
              atMostValue(["Multiply", "k", distinctWeightValue], "s"),
              [
                "Multiply",
                at(add(subtract("s", ["Multiply", "k", distinctWeightValue]), 1), at(add(subtract("r", "k"), 1), "a")),
                binomialOf(subtract(length(), subtract("r", "k")), "k"),
                [
                  "If",
                  equals("k", 0),
                  1,
                  [
                    "If",
                    atMostValue("s", at("r", "p")),
                    [
                      "If",
                      atMostValue(
                        add(subtract("s", ["Multiply", "k", distinctWeightValue]), distinctWeightValue),
                        at(add(subtract("r", "k"), 1), "p"),
                      ),
                      1,
                      0,
                    ],
                    0,
                  ],
                ],
              ],
              0,
            ],
            "k",
          ),
        ]),
        "s",
      ),
      "r",
    ),
  ),
  "list<integer>",
);

/** The longer side of the diagram: the fewest colors a proper coloring of its cells can use, and the most that are allowed. */
const longerSide: MathJSON = ["Max", largest, length()];
/**
 * The most cells that j sets of cells, no two in a row or column, can cover: the list over j = 0 .. longer side (entry j + 1),
 * the cells kept with at most j in a row and in a column. By the min-cut of that flow it is the least, over the first a rows
 * and first b columns taken whole, of j (a + b) plus the cells outside them.
 */
const rookCoverage: MathJSON = forEach(
  ["Range", 0, longerSide, 1],
  [
    "Min",
    forEach(
      ["Range", 0, length(), 1],
      [
        "Min",
        forEach(
          ["Range", 0, largest, 1],
          add(
            ["Multiply", "jj", add("aa", "bb")],
            sumOver(positions, ["If", greater("i", "aa"), ["Max", subtract(here, "bb"), 0], 0]),
          ),
          "bb",
        ),
      ],
      "aa",
    ),
  ],
  "jj",
);
/**
 * The class sizes of a proper coloring with the fewest colors, as a partition with that many parts: by Folkman and Fulkerson
 * (the edges of a bipartite graph split into matchings of given sizes) they are those dominated by the gains of the coverage.
 */
const coloringProfile: MathJSON = forEach(upTo(longerSide), subtract(at(add("i", 1), "m"), at("i", "m")));

/** The digit of `value` at part i in the mixed radix whose digit i runs 0 .. part i; reads the bound place values `pl` and radices `rd`. */
const radixDigit = (value: MathJSON, i: MathJSON): MathJSON => [
  "Mod",
  ["Divide", subtract(value, ["Mod", value, at(i, "pl")]), at(i, "pl")],
  at(i, "rd"),
];
/** The vectors below the multiplicities, each a number in that mixed radix. */
const multisetVectors: MathJSON = ["Product", "rd"];
/** The axes of the box: one per radix. */
const axes: MathJSON = upTo(length("rd"));
/** The radices of the box of a partition's own parts: one more than each part, so each digit runs 0 .. part. */
const partRadices: MathJSON = forEach(positions, add(at("i"), 1));
/** The digit of vector `value` at part i, from the bound table of digits `dg` (entry value + 1). */
const vectorDigit = (value: MathJSON, i: MathJSON): MathJSON => at(i, at(add(value, 1), "dg"));
/** The sum of the digits of vector `value`: the number of elements it holds. */
const vectorSize = (value: MathJSON): MathJSON => ["Sum", at(add(value, 1), "dg")];
/** 1 when the vector `value` has every digit divisible by `k`, else 0 (the zero vector is divisible by all). */
const divisibleBy = (value: MathJSON, k: MathJSON): MathJSON => [
  "If",
  equals(floored(["Sum", forEach(axes, ["Mod", vectorDigit(value, "i"), k])]), 0),
  1,
  0,
];
/**
 * `body` over the vectors below the multiplicities `radices` less one: each is a number in a mixed radix whose digit i runs
 * 0 .. radix i - 1, so that adding or subtracting vectors is doing so to numbers while no digit leaves its range, and dividing a
 * vector whose digits are all multiples of k is dividing the number by k. The bound lists are the radices `rd`, the place values
 * `pl` and the digits `dg` of each vector (entry w + 1 for the vector numbered w).
 */
const overVectors = (radices: MathJSON, body: MathJSON): MathJSON =>
  bind(
    "rd",
    radices,
    bind(
      "pl",
      forEach(axes, ["Product", forEach(axes, ["If", less("j", "i"), at("j", "rd"), 1], "j")]),
      bind(
        "dg",
        forEach(["Range", 0, subtract(multisetVectors, 1), 1], forEach(axes, radixDigit("w", "i")), "w"),
        body,
        "list<list<integer>>",
      ),
      "list<integer>",
    ),
    "list<integer>",
  );
/**
 * The count p(w) of the unordered sums of nonzero vectors, each kind of vector v used as often as one of r(v) colors allows, that
 * give the vector w, for the vector of multiplicities, by the Euler transform: |w| p(w) = sum over the vectors u in 1 .. w of
 * c(u) p(w - u), where c(u) = sum over the k dividing every digit of u of |u / k| r(u / k), the log-derivative of the product
 * of (1 - x^v)^(-r(v)). `weights` is the list of c(u) over the vectors u (entry u + 1).
 */
const eulerTransformCount = (weights: MathJSON): MathJSON =>
  bind(
    "cu",
    weights,
    bind(
      "t",
      typedFold(
        [
          "Join",
          "a",
          [
            "List",
            [
              "Divide",
              floored([
                "Sum",
                forEach(
                  upTo("w"),
                  [
                    "If",
                    equals(
                      floored([
                        "Sum",
                        forEach(axes, ["If", greater(vectorDigit("u", "i"), vectorDigit("w", "i")), 1, 0]),
                      ]),
                      0,
                    ),
                    ["Multiply", at(add("u", 1), "cu"), at(add(subtract("w", "u"), 1), "a")],
                    0,
                  ],
                  "u",
                ),
              ]),
              vectorSize("w"),
            ],
          ],
        ],
        "a",
        "w",
        ["List", 1],
        upTo(subtract(multisetVectors, 1)),
        "list<integer>",
      ),
      at(multisetVectors, "t"),
      "list<integer>",
    ),
    "list<integer>",
  );
/** The weights c(u) of the multisets of vectors: one color of each vector, so c(u) is the sum of |u| / k over the k dividing every digit. */
const multisetWeights: MathJSON = forEach(
  ["Range", 0, subtract(multisetVectors, 1), 1],
  [
    "If",
    equals("u", 0),
    0,
    floored([
      "Sum",
      forEach(upTo(total), ["If", equals(divisibleBy("u", "k"), 1), ["Divide", vectorSize("u"), "k"], 0], "k"),
    ]),
  ],
  "u",
);
/**
 * The weights c(u) of the multisets of cycles: a vector v has |v|-fold-rotated words, so r(v) |v| is the sum over the k dividing every
 * digit of k times the multinomial of v / k, and c(u) is that sum over the k dividing every digit of u of the multinomials of u / m,
 * each m counted m times (the sum of phi(d) over d dividing m).
 */
const cycleMultisetWeights: MathJSON = forEach(
  ["Range", 0, subtract(multisetVectors, 1), 1],
  [
    "If",
    equals("u", 0),
    0,
    floored([
      "Sum",
      forEach(
        upTo(total),
        [
          "If",
          equals(divisibleBy("u", "k"), 1),
          [
            "Multiply",
            "k",
            [
              "Divide",
              factorialOf(["Divide", vectorSize("u"), "k"]),
              ["Product", forEach(axes, factorialOf(["Divide", vectorDigit("u", "i"), "k"]))],
            ],
          ],
          0,
        ],
        "k",
      ),
    ]),
  ],
  "u",
);

/**
 * The weights c(u) of the symmetric matrices of nonnegative integers with these row sums, which are the multisets of the vectors e_i (a
 * diagonal entry, counted once) and e_i + e_j (a pair of entries, i < j): c(u) is the sum of |u| / k over the k dividing every digit of u
 * for which u / k is one of those vectors, a vector of 1 or 2 elements with no digit above 1.
 */
const symmetricMatrixWeights: MathJSON = forEach(
  ["Range", 0, subtract(multisetVectors, 1), 1],
  [
    "If",
    equals("u", 0),
    0,
    floored([
      "Sum",
      forEach(
        upTo(total),
        [
          "If",
          equals(divisibleBy("u", "k"), 1),
          [
            "If",
            equals(vectorSize(["Divide", "u", "k"]), 1),
            ["Divide", vectorSize("u"), "k"],
            [
              "If",
              equals(vectorSize(["Divide", "u", "k"]), 2),
              [
                "If",
                equals(
                  floored(["Sum", forEach(axes, ["If", greater(vectorDigit(["Divide", "u", "k"], "i"), 1), 1, 0])]),
                  0,
                ),
                ["Divide", vectorSize("u"), "k"],
                0,
              ],
              0,
            ],
          ],
          0,
        ],
        "k",
      ),
    ]),
  ],
  "u",
);
/** The distinct part sizes, largest first. */
const distinctSizes: MathJSON = forEach(where(positions, startsOfRuns), at("i"));
/** The radices of the box of the distinct sizes: one more than how many parts have each. */
const sizeRadices: MathJSON = forEach("ds", add(sumOver(positions, ["If", equals(at("j"), "d"), 1, 0], "j"), 1), "d");
/**
 * The set partitions of the points that a permutation of this cycle type maps to themselves. They are the ways to group the
 * cycles of the permutation into clusters, each cluster the cycles that meet one orbit of k blocks, with k dividing every cycle
 * length in it, in k^(m - 1) ways for m cycles. The table is over the vectors of cycle counts by length, below those of this partition,
 * numbered in a mixed radix: a(c) sums, over the cluster t that holds the first cycle of c, the choices of its cycles from each
 * length, the weight of the cluster, and a(c - t). Entry c + 1 is a(c).
 */
const invariantSetPartitionCount: MathJSON = bind(
  "ds",
  distinctSizes,
  overVectors(
    sizeRadices,
    bind(
      "t",
      typedFold(
        bind(
          "f",
          ["Min", forEach(axes, ["If", greater(vectorDigit("c", "i"), 0), "i", add(length("rd"), 1)])],
          [
            "Join",
            "a",
            [
              "List",
              floored([
                "Sum",
                forEach(
                  upTo("c"),
                  [
                    "If",
                    equals(
                      floored([
                        "Sum",
                        forEach(axes, ["If", greater(vectorDigit("u", "i"), vectorDigit("c", "i")), 1, 0]),
                      ]),
                      0,
                    ),
                    [
                      "If",
                      atLeastValue(vectorDigit("u", "f"), 1),
                      [
                        "Multiply",
                        [
                          "Product",
                          forEach(axes, [
                            "If",
                            equals("i", "f"),
                            binomialOf(subtract(vectorDigit("c", "i"), 1), subtract(vectorDigit("u", "i"), 1)),
                            binomialOf(vectorDigit("c", "i"), vectorDigit("u", "i")),
                          ]),
                        ],
                        floored([
                          "Sum",
                          forEach(
                            upTo(total),
                            [
                              "If",
                              equals(
                                floored([
                                  "Sum",
                                  forEach(axes, [
                                    "If",
                                    greater(vectorDigit("u", "i"), 0),
                                    ["Mod", at("i", "ds"), "k"],
                                    0,
                                  ]),
                                ]),
                                0,
                              ),
                              ["Power", "k", subtract(vectorSize("u"), 1)],
                              0,
                            ],
                            "k",
                          ),
                        ]),
                        at(add(subtract("c", "u"), 1), "a"),
                      ],
                      0,
                    ],
                    0,
                  ],
                  "u",
                ),
              ]),
            ],
          ],
          "integer",
        ),
        "a",
        "c",
        ["List", 1],
        upTo(subtract(multisetVectors, 1)),
        "list<integer>",
      ),
      at(multisetVectors, "t"),
      "list<integer>",
    ),
  ),
  "list<integer>",
);
/**
 * The colored rooted trees by their colors' multiplicities, over the vectors below those of this partition (three entries per vector
 * w, from entry 3 w + 1: the trees r(w), the weight c(w) and the multisets of trees m(w)). A tree is a root of color i over a multiset of
 * trees: r(w) is the sum of m(w - e_i) over the colors i in w; the multisets of trees are the Euler transform of the r, with c(w) the sum of
 * |w / k| r(w / k) over the k dividing every digit of w, and |w| m(w) the sum of c(u) m(w - u) over the vectors u in 1 .. w.
 */
const rootedTreeTable: MathJSON = typedFold(
  bind(
    "rw",
    floored([
      "Sum",
      forEach(axes, [
        "If",
        atLeastValue(vectorDigit("w", "i"), 1),
        at(add(["Multiply", 3, subtract("w", at("i", "pl"))], 3), "a"),
        0,
      ]),
    ]),
    bind(
      "cw",
      floored([
        "Sum",
        forEach(
          upTo(total),
          [
            "If",
            equals(divisibleBy("w", "k"), 1),
            [
              "Multiply",
              ["Divide", vectorSize("w"), "k"],
              ["If", equals("k", 1), "rw", at(add(["Multiply", 3, ["Divide", "w", "k"]], 1), "a")],
            ],
            0,
          ],
          "k",
        ),
      ]),
      [
        "Join",
        "a",
        [
          "List",
          "rw",
          "cw",
          [
            "Divide",
            floored([
              "Sum",
              forEach(
                upTo("w"),
                [
                  "If",
                  equals(
                    floored([
                      "Sum",
                      forEach(axes, ["If", greater(vectorDigit("u", "i"), vectorDigit("w", "i")), 1, 0]),
                    ]),
                    0,
                  ),
                  [
                    "Multiply",
                    ["If", equals("u", "w"), "cw", at(add(["Multiply", 3, "u"], 2), "a")],
                    at(add(["Multiply", 3, subtract("w", "u")], 3), "a"),
                  ],
                  0,
                ],
                "u",
              ),
            ]),
            vectorSize("w"),
          ],
        ],
      ],
      "integer",
    ),
    "integer",
  ),
  "a",
  "w",
  ["List", 0, 0, 1],
  upTo(subtract(multisetVectors, 1)),
  "list<integer>",
);
/** The colored rooted trees whose color multiplicities are the whole vector. */
const rootedTreeCount: MathJSON = bind(
  "t",
  rootedTreeTable,
  at(subtract(["Multiply", 3, multisetVectors], 2), "t"),
  "list<integer>",
);

/** The colored rooted trees whose colors have the multiplicities of the vector `w`, from the bound table `t` of `rootedTreeTable`. */
const rootedTreesOn = (w: MathJSON, table = "t"): MathJSON => at(add(["Multiply", 3, w], 1), table);
/**
 * The colored trees by the dissymmetry theorem: the trees rooted at a vertex, minus those rooted at an edge or at a vertex and an edge
 * that are not rooted at an edge alone, the pairs of rooted trees (a root's tree beside the rest) counted twice unless equal:
 * r - (r^2 - r(x^2)) / 2, where r^2 sums r(a) r(w - a) over the vectors a and r(x^2) is r(w / 2) when every digit of w is even.
 */
const treeCount: MathJSON = bind(
  "t",
  rootedTreeTable,
  subtract(rootedTreesOn(subtract(multisetVectors, 1)), [
    "Divide",
    subtract(
      floored([
        "Sum",
        forEach(
          upTo(subtract(multisetVectors, 1)),
          ["Multiply", rootedTreesOn("a"), rootedTreesOn(subtract(subtract(multisetVectors, 1), "a"))],
          "a",
        ),
      ]),
      [
        "If",
        equals(divisibleBy(subtract(multisetVectors, 1), 2), 1),
        rootedTreesOn(["Divide", subtract(multisetVectors, 1), 2]),
        0,
      ],
    ),
    2,
  ]),
  "list<integer>",
);

/** 1 when vector `u` is at most vector `w` in every digit. */
const belowVector = (u: MathJSON, w: MathJSON): MathJSON => [
  "If",
  equals(floored(["Sum", forEach(axes, ["If", greater(vectorDigit(u, "i"), vectorDigit(w, "i")), 1, 0])]), 0),
  1,
  0,
];
/**
 * The sequences of nonzero vectors, each weighted `weightOf(u)`, that sum to each vector w, as the table over the vectors in the
 * mixed radix (entry w + 1): s(0) = 1 and s(w) is the sum of the weight of u times s(w - u) over the vectors u in 1 .. w.
 */
const sequenceTable = (weightOf: (u: MathJSON) => MathJSON): MathJSON =>
  typedFold(
    [
      "Join",
      "a",
      [
        "List",
        floored([
          "Sum",
          forEach(
            upTo("w"),
            [
              "If",
              equals(belowVector("u", "w"), 1),
              ["Multiply", weightOf("u"), at(add(subtract("w", "u"), 1), "a")],
              0,
            ],
            "u",
          ),
        ]),
      ],
    ],
    "a",
    "w",
    ["List", 1],
    upTo(subtract(multisetVectors, 1)),
    "list<integer>",
  );
/**
 * The colored endofunctions, unordered and unlabeled: a multiset of connected components, each a cycle of rooted trees, so by the
 * Euler transform with weight c(u), the sum of m times L(u / m) over the m dividing every digit of u. L(v) is |v| times the count of
 * cycles of rooted trees with colors v, summed over the rotations that fix them (phi), so L = |v| [x^v] log 1 / (1 - r): the sequences of
 * rooted trees s(w), by s(w) the sum of r(a) s(w - a) over the vectors a in 1 .. w, give L(w) as the sum of |a| r(a) s(w - a).
 */
const endofunctionCount: MathJSON = bind(
  "rt",
  rootedTreeTable,
  bind(
    "sq",
    sequenceTable((u) => rootedTreesOn(u, "rt")),
    bind(
      "lm",
      forEach(
        ["Range", 0, subtract(multisetVectors, 1), 1],
        [
          "If",
          equals("w", 0),
          0,
          floored([
            "Sum",
            forEach(
              upTo("w"),
              [
                "If",
                equals(belowVector("u", "w"), 1),
                ["Multiply", vectorSize("u"), rootedTreesOn("u", "rt"), at(add(subtract("w", "u"), 1), "sq")],
                0,
              ],
              "u",
            ),
          ]),
        ],
        "w",
      ),
      eulerTransformCount(
        forEach(
          ["Range", 0, subtract(multisetVectors, 1), 1],
          [
            "If",
            equals("u", 0),
            0,
            floored([
              "Sum",
              forEach(
                upTo(total),
                ["If", equals(divisibleBy("u", "k"), 1), ["Multiply", "k", at(add(["Divide", "u", "k"], 1), "lm")], 0],
                "k",
              ),
            ]),
          ],
          "u",
        ),
      ),
      "list<integer>",
    ),
    "list<integer>",
  ),
  "list<integer>",
);

/**
 * The words with these multiplicities of letters that have no three consecutive increasing letters, by the cluster method of Goulden
 * and Jackson: they are the sequences of the vectors b with weight B(b), 1/(1 - B), where B is the elementary symmetric
 * functions e_1 + sum over m >= 3 of W(m) e_m, so only a vector of 0s and 1s counts, with weight 1 for one letter, and for m >= 3 letters
 * the signed number of ways to cover a run of m by windows of 3 that overlap: -1, 1, 0 as m - 2 is 1, 2, 0 modulo 3.
 */
const clusterWeights: MathJSON = forEach(
  ["Range", 0, subtract(multisetVectors, 1), 1],
  [
    "If",
    equals("u", 0),
    0,
    [
      "If",
      equals(floored(["Sum", forEach(axes, ["If", greater(vectorDigit("u", "i"), 1), 1, 0])]), 0),
      [
        "If",
        equals(vectorSize("u"), 1),
        1,
        [
          "If",
          equals(vectorSize("u"), 2),
          0,
          [
            "If",
            equals(["Mod", subtract(vectorSize("u"), 2), 3], 1),
            -1,
            ["If", equals(["Mod", subtract(vectorSize("u"), 2), 3], 2), 1, 0],
          ],
        ],
      ],
      0,
    ],
  ],
  "u",
);
const avoidingWordCount: MathJSON = bind(
  "bw",
  clusterWeights,
  bind(
    "t",
    sequenceTable((u) => at(add(u, 1), "bw")),
    at(multisetVectors, "t"),
    "list<integer>",
  ),
  "list<integer>",
);
/**
 * The vectors of the box made into a sequence of layers by size, the sequences that fill the whole vector with the sizes of the
 * vectors weakly decreasing, ties in any order: a product over the sizes s of the sequences of vectors of size s, 1 / (1 - B_s). With
 * P_s the count using sizes up to s, P_s(w) = P_(s-1)(w) + the sum, over the allowed vectors u of size s in 1 .. w, of P_s(w - u).
 * `allowed(u)` is 1 for a vector that is an item and `sizeOf(u)` its size, up to `layers`.
 */
const layeredSequenceCount = (
  allowed: (u: MathJSON) => MathJSON,
  sizeOf: (u: MathJSON) => MathJSON,
  layers: MathJSON,
): MathJSON =>
  bind(
    "t",
    typedFold(
      typedFold(
        [
          "Join",
          "c",
          [
            "List",
            add(
              at(add("w", 1), "a"),
              floored([
                "Sum",
                forEach(
                  upTo("w"),
                  [
                    "If",
                    equals(sizeOf("u"), "s"),
                    [
                      "If",
                      equals(allowed("u"), 1),
                      ["If", equals(belowVector("u", "w"), 1), at(add(subtract("w", "u"), 1), "c"), 0],
                      0,
                    ],
                    0,
                  ],
                  "u",
                ),
              ]),
            ),
          ],
        ],
        "c",
        "w",
        ["List", at(1, "a")],
        upTo(subtract(multisetVectors, 1)),
        "list<integer>",
      ),
      "a",
      "s",
      forEach(upTo(multisetVectors), ["If", equals("i", 1), 1, 0]),
      upTo(layers),
      "list<integer>",
    ),
    at(multisetVectors, "t"),
    "list<integer>",
  );
/** 1 when vector `u` has no digit above 1: a 0-1 vector. */
const isZeroOneVector = (u: MathJSON): MathJSON => [
  "If",
  equals(floored(["Sum", forEach(axes, ["If", greater(vectorDigit(u, "i"), 1), 1, 0])]), 0),
  1,
  0,
];
/** The radices of a box of 0-1 vectors, one axis per part. */
const binaryRadices: MathJSON = forEach(positions, 2);
/** The parts a 0-1 vector `u` picks, added up. */
const pickedPartSum = (u: MathJSON): MathJSON =>
  floored(["Sum", forEach(positions, ["Multiply", at("i"), vectorDigit(u, "i")])]);
/** The sum of `term` over `over`, which may be negative: its positive and negative parts are each floored, so the compiler types each real. */
const signedSumOver = (over: MathJSON, term: MathJSON, variable: string): MathJSON =>
  subtract(
    floored(["Sum", forEach(over, ["Max", term, 0], variable)]),
    floored(["Sum", forEach(over, ["Max", ["Negate", term], 0], variable)]),
  );
/**
 * The trees counted by a formal group law, whose generating function f has the inverse phi: the sum over n of the coefficient of t^n in the
 * product, over the parts k, of k! [x^k] exp(t phi(x)), times n! [x^n] f. Written a(m) = m! [x^m] phi and g(n) = n! [x^n] f, the first factors
 * are the partial exponential Bell polynomials of a, whose coefficient of t^j in row k obeys B(k, j) = the sum over m in 1 .. k of
 * C(k - 1, m - 1) a(m) B(k - m, j - 1); the table has one row per size 0 .. largest part, entry j + 1 for t^j. `gOf(d)` reads g(d), after
 * `tables` binds what it needs; both come from the first line of FindStat's own code.
 */
const formalGroupLawCoefficient = (
  a: (m: MathJSON) => MathJSON,
  gOf: (d: MathJSON) => MathJSON,
  tables: (body: MathJSON) => MathJSON = (body) => body,
): MathJSON =>
  tables(
    bind(
      "bt",
      typedFold(
        [
          "Join",
          "a",
          [
            "List",
            forEach(
              ["Range", 0, largest, 1],
              [
                "If",
                equals("j", 0),
                0,
                signedSumOver(
                  upTo("k"),
                  [
                    "Multiply",
                    ["Binomial", subtract("k", 1), subtract("m", 1)],
                    a("m"),
                    at("j", at(add(subtract("k", "m"), 1), "a")),
                  ],
                  "m",
                ),
              ],
              "j",
            ),
          ],
        ],
        "a",
        "k",
        ["List", forEach(["Range", 0, largest, 1], ["If", equals("j", 0), 1, 0], "j")],
        upTo(largest),
        "list<list<integer>>",
      ),
      bind(
        "pl",
        typedFold(
          forEach(
            ["Range", 0, total, 1],
            signedSumOver(
              ["Range", 0, "b", 1],
              [
                "If",
                atMostValue("j", "d"),
                ["Multiply", at(add(subtract("d", "j"), 1), "a"), at(add("j", 1), at(add("b", 1), "bt"))],
                0,
              ],
              "j",
            ),
            "d",
          ),
          "a",
          "b",
          forEach(["Range", 0, total, 1], ["If", equals("d", 0), 1, 0], "d"),
          x,
          "list<integer>",
        ),
        floored(["Sum", forEach(["Range", 0, total, 1], ["Multiply", at(add("d", 1), "pl"), gOf("d")], "d")]),
        "list<integer>",
      ),
      "list<list<integer>>",
    ),
  );
/** 1 when the digits of vector `w` weakly decrease: the vector is a partition. */
const isPartitionVector = (w: MathJSON): MathJSON => [
  "If",
  equals(
    floored([
      "Sum",
      forEach(axes, [
        "If",
        less("i", length("rd")),
        ["If", less(vectorDigit(w, "i"), vectorDigit(w, add("i", 1))), 1, 0],
        0,
      ]),
    ]),
    0,
  ),
  1,
  0,
];
/**
 * The standard tableaux with no two consecutive entries in one row, by inclusion and exclusion over the entries i that share a row
 * with i + 1: a chain of the shapes inside this one, each step a run of m cells added to one row, signed (-1)^(m - 1). The table is
 * over the vectors of row lengths, in a mixed radix with digit i running 0 .. part i (entry w + 1 for the vector numbered w), a vector that
 * is not a partition counting 0.
 */
const tableauxWithoutRowRuns: MathJSON = typedFold(
  [
    "Join",
    "a",
    [
      "List",
      [
        "If",
        equals(isPartitionVector("w"), 1),
        signedSumOver(
          axes,
          signedSumOver(
            upTo(total),
            [
              "If",
              atMostValue("m", vectorDigit("w", "i")),
              [
                "Multiply",
                ["If", equals(["Mod", "m", 2], 1), 1, -1],
                at(add(subtract("w", ["Multiply", "m", at("i", "pl")]), 1), "a"),
              ],
              0,
            ],
            "m",
          ),
          "i",
        ),
        0,
      ],
    ],
  ],
  "a",
  "w",
  ["List", 1],
  upTo(subtract(multisetVectors, 1)),
  "list<integer>",
);
/**
 * The permutations whose Lehmer code, n entries with entry i at most n - i, takes its values with these multiplicities (the nonzero
 * ones, as a multiset, are the parts). A table over the values from n - 1 down to 0, in the state the vector of how many parts of each
 * size are used, in the mixed radix of the distinct sizes (entry w + 1 for the vector numbered w). The value with u = n - value
 * entries allowed to take it has, less those taken by larger values (the sum of the sizes used), that many entries free, and
 * takes a part of size k in C(free, k) ways.
 */
const lehmerCodeMultiplicityCount: MathJSON = bind(
  "ds",
  distinctSizes,
  overVectors(
    sizeRadices,
    bind(
      "t",
      typedFold(
        forEach(
          ["Range", 0, subtract(multisetVectors, 1), 1],
          [
            "Sum",
            [
              "List",
              at(add("w", 1), "a"),
              floored([
                "Sum",
                forEach(axes, [
                  "If",
                  atLeastValue(vectorDigit("w", "i"), 1),
                  [
                    "Multiply",
                    binomialOf(
                      subtract(
                        add("u", at("i", "ds")),
                        floored(["Sum", forEach(axes, ["Multiply", vectorDigit("w", "j"), at("j", "ds")], "j")]),
                      ),
                      at("i", "ds"),
                    ),
                    at(add(subtract("w", at("i", "pl")), 1), "a"),
                  ],
                  0,
                ]),
              ]),
            ],
          ],
          "w",
        ),
        "a",
        "u",
        forEach(upTo(multisetVectors), ["If", equals("i", 1), 1, 0]),
        upTo(total),
        "list<integer>",
      ),
      at(multisetVectors, "t"),
      "list<integer>",
    ),
  ),
  "list<integer>",
);
/**
 * The linear extensions of the poset on a partition (Speyer's construction, from Fayers' question), over the regions of the diagram:
 * those of rows a .. length past the first b columns, a partition again. A region has its cell (r, c) on the longest antidiagonal
 * r + c, the lowest such, and splits there into the rows below r and the columns past c, with C(r + c - a - b + 1, r - a + 1) ways to
 * interleave their orders: V(a, b) = C(r + c - a - b + 1, r - a + 1) V(r + 1, b) V(a, c), and 1 for an empty region. The table lists
 * the regions from the last: region (a, b), numbered (a - 1)(largest part + 1) + b from 0, is entry (length + 1)(largest part + 1)
 * minus that number.
 */
const regionWidth: MathJSON = add(largest, 1);
const regionCount: MathJSON = ["Multiply", add(length(), 1), regionWidth];
/** The region of the table's step q, numbered from 0. */
const stepRegion: MathJSON = subtract(subtract(regionCount, 1), "q");
const regionValue = (row: MathJSON, column: MathJSON): MathJSON =>
  at(subtract(regionCount, add(["Multiply", subtract(row, 1), regionWidth], column)), "a");
/** The cell r + c is largest in the region (rows from `ia`, columns past `ib`), the lowest of them: its row, as a key of the sum then the row. */
const lowestLongestAntidiagonalKey: MathJSON = [
  "Max",
  forEach(positions, [
    "If",
    atLeastValue("i", "ia"),
    ["If", greater(at("i"), "ib"), add(["Multiply", add("i", at("i")), add(length(), 1)], "i"), 0],
    0,
  ]),
];
const diagramLinearExtensionCount: MathJSON = bind(
  "t",
  typedFold(
    bind(
      "ia",
      add(["Divide", subtract(stepRegion, ["Mod", stepRegion, regionWidth]), regionWidth], 1),
      bind(
        "ib",
        ["Mod", stepRegion, regionWidth],
        [
          "Join",
          "a",
          [
            "List",
            [
              "If",
              greater("ia", length()),
              1,
              [
                "If",
                atMostValue(at("ia"), "ib"),
                1,
                bind(
                  "rs",
                  ["Mod", lowestLongestAntidiagonalKey, add(length(), 1)],
                  [
                    "Multiply",
                    ["Binomial", add(subtract(add("rs", at("rs")), add("ia", "ib")), 1), add(subtract("rs", "ia"), 1)],
                    regionValue(add("rs", 1), "ib"),
                    regionValue("ia", at("rs")),
                  ],
                  "integer",
                ),
              ],
            ],
          ],
        ],
        "integer",
      ),
      "integer",
    ),
    "a",
    "q",
    ["List", 1],
    upTo(subtract(regionCount, 1)),
    "list<integer>",
  ),
  at(regionCount, "t"),
  "list<integer>",
);
/** The least value from 0 that no option takes: `occurrences(k)` counts the options of value k, and the values stay below the size. */
const leastMissingValue = (occurrences: (k: MathJSON) => MathJSON): MathJSON => [
  "Min",
  forEach(["Range", 0, total, 1], ["If", equals(floored(occurrences("k")), 0), "k", add(total, 1)], "k"),
];
/**
 * The Grundy values of the positions inside this diagram, a position being a vector of row lengths (a partition) in the mixed radix with digit i
 * running 0 .. part i: the table has entry w + 1 for the vector numbered w, the least value missing from those of the positions one move
 * reaches (0 for a vector that is not a partition, which no move reaches). `occurrences(w, k)` counts the moves from w to a position
 * whose value is k, reading the table so far as `a`.
 */
const grundyTable = (occurrences: (w: MathJSON, k: MathJSON) => MathJSON): MathJSON =>
  typedFold(
    [
      "Join",
      "a",
      ["List", ["If", equals(isPartitionVector("w"), 1), leastMissingValue((k) => occurrences("w", k)), 0]],
    ],
    "a",
    "w",
    ["List", 0],
    upTo(subtract(multisetVectors, 1)),
    "list<integer>",
  );
/** The value, in the table so far, of the position numbered `index`. */
const positionValue = (index: MathJSON): MathJSON => at(add(index, 1), "a");
/**
 * Chomp: a move picks a cell other than the first and cuts the cells below and right of it, so rows from i on shrink to at most c, where the
 * cell is in column c (counting from 0) of row i.
 */
const chompMoveCount = (w: MathJSON, k: MathJSON): MathJSON =>
  sumOver(
    axes,
    [
      "Sum",
      forEach(
        ["Range", 0, total, 1],
        [
          "If",
          less("c", vectorDigit(w, "i")),
          [
            "If",
            and(equals("i", 1), equals("c", 0)),
            0,
            [
              "If",
              equals(
                positionValue(
                  floored([
                    "Sum",
                    forEach(
                      axes,
                      [
                        "Multiply",
                        ["If", atLeastValue("j", "i"), ["Min", vectorDigit(w, "j"), "c"], vectorDigit(w, "j")],
                        at("j", "pl"),
                      ],
                      "j",
                    ),
                  ]),
                ),
                k,
              ),
              1,
              0,
            ],
          ],
          0,
        ],
        "c",
      ),
    ],
    "i",
  );
/**
 * The game that removes one cell or a 2 x 2 square of cells, the diagram staying a partition: a cell can go when it ends a row and the row
 * below is shorter; a square can go when two rows of one length c >= 2 are followed by a row of at most c - 2.
 */
const squareGameMoveCount = (w: MathJSON, k: MathJSON): MathJSON =>
  add(
    sumOver(axes, [
      "If",
      atLeastValue(vectorDigit(w, "i"), 1),
      [
        "If",
        less("i", length("rd")),
        [
          "If",
          less(vectorDigit(w, add("i", 1)), vectorDigit(w, "i")),
          ["If", equals(positionValue(subtract(w, at("i", "pl"))), k), 1, 0],
          0,
        ],
        ["If", equals(positionValue(subtract(w, at("i", "pl"))), k), 1, 0],
      ],
      0,
    ]),
    sumOver(axes, [
      "If",
      less("i", length("rd")),
      [
        "If",
        equals(vectorDigit(w, "i"), vectorDigit(w, add("i", 1))),
        [
          "If",
          atLeastValue(vectorDigit(w, "i"), 2),
          [
            "If",
            or(equals(add("i", 1), length("rd")), [
              "If",
              less(add("i", 1), length("rd")),
              atMostValue(vectorDigit(w, add("i", 2)), subtract(vectorDigit(w, "i"), 2)),
              "False",
            ]),
            [
              "If",
              equals(
                positionValue(
                  subtract(subtract(w, ["Multiply", 2, at("i", "pl")]), ["Multiply", 2, at(add("i", 1), "pl")]),
                ),
                k,
              ),
              1,
              0,
            ],
            0,
          ],
          0,
        ],
        0,
      ],
      0,
    ]),
  );
/** The exponent of 2 in m!, by Legendre's formula: the sum of floor(m / 2^k), for the k with 2^k at most the size. */
const twoAdicFactorial = (m: MathJSON): MathJSON =>
  floored([
    "Sum",
    forEach(
      upTo(["Floor", ["Log", add(total, 1), 2]]),
      ["Divide", subtract(m, ["Mod", m, ["Power", 2, "k"]]), ["Power", 2, "k"]],
      "k",
    ),
  ]);
/** The exponent of 2 in the number h: the count of powers 2^k, k from 1 up to the size's bits, that divide it. */
const twoAdicValuation = (h: MathJSON): MathJSON =>
  floored([
    "Sum",
    forEach(upTo(["Floor", ["Log", add(total, 1), 2]]), ["If", equals(["Mod", h, ["Power", 2, "k"]], 0), 1, 0], "k"),
  ]);
/** The exponent of 2 in the product of the hook lengths of the diagram whose row lengths are the digits of vector w. */
const hookProductTwoAdicValuation = (w: MathJSON): MathJSON =>
  floored([
    "Sum",
    forEach(
      axes,
      [
        "Sum",
        forEach(
          upTo(total),
          [
            "If",
            atMostValue("c", vectorDigit(w, "i")),
            twoAdicValuation(
              add(
                subtract(
                  add(
                    subtract(vectorDigit(w, "i"), "c"),
                    floored(["Sum", forEach(axes, ["If", atLeastValue(vectorDigit(w, "r"), "c"), 1, 0], "r")]),
                  ),
                  "i",
                ),
                1,
              ),
            ),
            0,
          ],
          "c",
        ),
      ],
      "i",
    ),
  ]);
/**
 * The fewest cells to remove for a partition inside this one to have an odd number of standard tableaux, which is when the hook lengths
 * hold exactly the powers of 2 that its size factorial does. The restriction to the symmetric group on fewer points holds each partition
 * inside, so this is the size less the largest size of such a partition.
 */
const smallestOddRestrictionDepth: MathJSON = [
  "Min",
  forEach(
    ["Range", 0, subtract(multisetVectors, 1), 1],
    [
      "If",
      equals(isPartitionVector("w"), 1),
      [
        "If",
        equals(twoAdicFactorial(vectorSize("w")), hookProductTwoAdicValuation("w")),
        subtract(total, vectorSize("w")),
        total,
      ],
      total,
    ],
    "w",
  ),
];
/** The bit k of the number `t`, 1 or 0. */
const bitOf = (t: MathJSON, k: MathJSON): MathJSON => [
  "Mod",
  ["Divide", subtract(t, ["Mod", t, ["Power", 2, k]]), ["Power", 2, k]],
  2,
];
/**
 * The tilings of the diagram by single cells and dominoes, by the transfer table over the cells row by row, the diagram turned to have no more
 * columns than rows. The state at a cell is a number whose bit k says that the cell k places on in reading order is already covered, by
 * a vertical domino from above; the table has entry t + 1 for the state t, the states past the width of a row never set. At a cell
 * already covered the state shifts; at a free one it takes a single cell (shift), a horizontal domino with the free cell to its right
 * (shift, set bit 0), or a vertical domino with the cell below, which lies the row's length on in reading order (shift, set bit
 * length - 1). A tiling is the state 0 after the last cell.
 */
const dominoTilingCount: MathJSON = bind(
  "u",
  ["If", greater(largest, length()), conjugate, x],
  bind(
    "t",
    typedFold(
      typedFold(
        forEach(
          ["Range", 0, subtract(["Power", 2, at(1, "u")], 1), 1],
          add(
            add(
              [
                "If",
                atMostValue(add(["Multiply", 2, "m"], 1), subtract(["Power", 2, at(1, "u")], 1)),
                at(add(["Multiply", 2, "m"], 2), "c"),
                0,
              ],
              [
                "If",
                atMostValue(["Multiply", 2, "m"], subtract(["Power", 2, at(1, "u")], 1)),
                at(add(["Multiply", 2, "m"], 1), "c"),
                0,
              ],
            ),
            add(
              [
                "If",
                less("j", at("r", "u")),
                [
                  "If",
                  equals(["Mod", "m", 2], 1),
                  [
                    "If",
                    atMostValue(["Multiply", 2, subtract("m", 1)], subtract(["Power", 2, at(1, "u")], 1)),
                    at(subtract(["Multiply", 2, "m"], 1), "c"),
                    0,
                  ],
                  0,
                ],
                0,
              ],
              [
                "If",
                less("r", length("u")),
                [
                  "If",
                  atMostValue("j", at(add("r", 1), "u")),
                  [
                    "If",
                    equals(bitOf("m", subtract(at("r", "u"), 1)), 1),
                    [
                      "If",
                      atMostValue(
                        ["Multiply", 2, subtract("m", ["Power", 2, subtract(at("r", "u"), 1)])],
                        subtract(["Power", 2, at(1, "u")], 1),
                      ),
                      at(add(["Multiply", 2, subtract("m", ["Power", 2, subtract(at("r", "u"), 1)])], 1), "c"),
                      0,
                    ],
                    0,
                  ],
                  0,
                ],
                0,
              ],
            ),
          ),
          "m",
        ),
        "c",
        "j",
        "a",
        upTo(at("r", "u")),
        "list<integer>",
      ),
      "a",
      "r",
      forEach(["Range", 0, subtract(["Power", 2, at(1, "u")], 1), 1], ["If", equals("m", 0), 1, 0], "m"),
      upTo(length("u")),
      "list<integer>",
    ),
    at(1, "t"),
    "list<integer>",
  ),
  "list<integer>",
);
export const PARTITION_STATISTICS: readonly Definition[] = [
  stat("LargestPart", "The largest part.", nonEmpty(largest)),
  stat(
    "MultiplicityOfLargestPart",
    "How many parts equal the largest.",
    nonEmpty(count(positions, equals(here, largest))),
  ),
  stat(
    "DistinctParts",
    "How many distinct part sizes occur.",
    nonEmpty(count(upTo(largest), greater(count(positions, equals(here, "j")), 0), "j")),
  ),
  stat("EvenParts", "Parts that are even.", nonEmpty(count(positions, equals(["Mod", here, 2], 0)))),
  stat("OddParts", "Parts that are odd.", nonEmpty(count(positions, equals(["Mod", here, 2], 1)))),
  stat("PartsEqualOne", "Parts equal to 1.", nonEmpty(count(positions, equals(here, 1)))),
  stat("PartsAtLeastTwo", "Parts of size at least 2.", nonEmpty(count(positions, atLeastValue(here, 2)))),

  // Inside a Filter the bound name is the VALUE, not the index — so these read the
  // conjugate's entries directly rather than indexing into it.
  stat(
    "ConjugateOddParts",
    "Odd parts of the conjugate — equivalently, the distinct part sizes of λ.",
    nonEmpty(count(conjugate, equals(["Mod", "i", 2], 1))),
  ),
  stat(
    "ConjugateDistinctParts",
    "Distinct part sizes of the conjugate.",
    nonEmpty(count(upTo(length()), greater(count(conjugate, equals("i", "j")), 0), "j")),
  ),

  stat(
    "DurfeeSquare",
    "The side of the Durfee square: the largest d with at least d parts of size at least d.",
    nonEmpty(durfee),
  ),
  stat("ArmOfFirstCell", "The arm of cell (1,1): the first part minus one.", nonEmpty(armAt(1))),
  stat("LegOfFirstCell", "The leg of cell (1,1): the number of parts minus one.", nonEmpty(legAt(1))),

  stat(
    "Corners",
    "Corner cells — parts strictly larger than the next part (the last part always counts).",
    nonEmpty(count(positions, ["Or", equals("i", length()), greater(here, at(add("i", 1)))])),
  ),
  stat(
    "HalfPerimeter",
    "Half the perimeter of the bounding rectangle of the Young diagram: largest part plus number of parts.",
    nonEmpty(add(largest, length())),
    "FindStat's St000459 calls the hook length of the base cell the perimeter; that is `HookLengthOfFirstCell`, one less than this.",
  ),

  stat(
    "IsSelfConjugate",
    "1 when λ equals its conjugate, 0 otherwise.",
    nonEmpty(
      [
        "If",
        and(
          equals(["Length", conjugate], length()),
          equals(count(positions, equals(here, at("i", conjugate))), length()),
        ),
        1,
        0,
      ],
      1,
    ),
  ),

  stat(
    "SumOfHookLengths",
    "The total of all hook lengths.",
    nonEmpty(sumOver(positions, sumOver(upTo(here), hookAt, "j"))),
    "Hook of cell (i, j) is arm + leg + 1 = (λ_i - j) + (λ'_j - i) + 1.",
  ),
  stat(
    "HookProduct",
    "The product of all hook lengths — the denominator in the hook-length formula.",
    nonEmpty(hookProduct, 1),
  ),
  stat(
    "StandardTableauCount",
    "The number of standard Young tableaux of the shape: the size factorial over the hook product.",
    nonEmpty(standardTableauxCount, 1),
    "Defined by the hook-length formula; PlancherelCount is its square.",
  ),

  stat("DysonRank", "Largest part minus number of parts.", nonEmpty(subtract(largest, length()))),

  stat(
    "Crank",
    "The Andrews-Garvan crank: the largest part when λ has no 1s, else (parts larger than the number of 1s) minus (the number of 1s).",
    nonEmpty(["If", equals(ones, 0), largest, subtract(count(positions, greater(here, ones)), ones)]),
  ),
  // ── FindStat's integer-partition statistics, named after their descriptions ──────────────

  // Hooks, diagonals and the Durfee square.
  stat(
    "HookLengthOfFirstCell",
    "The hook length of cell (1,1): the largest part plus the number of parts, less one.",
    nonEmpty(subtract(add(largest, length()), 1)),
  ),
  stat(
    "HookLengthOfLastDiagonalCell",
    "The hook length of the last cell on the main diagonal: that of cell (d,d) for Durfee side d.",
    nonEmpty(
      withConjugate(
        bind("d", durfee, add(subtract(at("d"), "d"), subtract(columnLength("d"), subtract("d", 1))), "number"),
      ),
    ),
  ),
  stat(
    "DiagonalHookLengthProduct",
    "The product of the hook lengths of the cells on the main diagonal.",
    nonEmpty(
      withConjugate([
        "Product",
        forEach(
          where(positions, atLeastValue(here, "i")),
          add(subtract(here, "i"), subtract(columnLength("i"), subtract("i", 1))),
        ),
      ]),
      1,
    ),
  ),
  stat(
    "SymmetricDiagonalHooks",
    "Cells on the main diagonal whose arm and leg are equal.",
    nonEmpty(withConjugate(count(where(positions, atLeastValue(here, "i")), equals(here, columnLength("i"))))),
  ),
  stat(
    "CellsOutsideDurfeeSquare",
    "Cells of the diagram outside its Durfee square.",
    nonEmpty(subtract(total, ["Power", durfee, 2])),
  ),
  stat(
    "FirstRowHookLengthSum",
    "The sum of the hook lengths in the first row: the size plus the binomial of the largest part and 2.",
    nonEmpty(add(total, ["Divide", ["Multiply", largest, subtract(largest, 1)], 2])),
  ),
  stat("HookLengthSquareSum", "The sum of the squares of all hook lengths.", sumOverCells(["Power", hookWith, 2])),
  stat(
    "CohookLengthProduct",
    "The product of the cohook lengths i + j - 1 of the cells.",
    nonEmpty(["Product", forEach(positions, ["Product", forEach(upTo(here), subtract(add("i", "j"), 1), "j")])], 1),
  ),
  stat(
    "DiagonalInversions",
    "Cells whose arm minus leg is 0 or 1.",
    cellsWhere(or(equals(armMinusLeg, 0), equals(armMinusLeg, 1))),
  ),
  stat(
    "DiagonalInversionDefect",
    "Cells whose arm minus leg is neither 0 nor 1.",
    cellsWhere(or(less(armMinusLeg, 0), greater(armMinusLeg, 1))),
  ),
  stat("CellsWithEqualArmAndLeg", "Cells whose arm and leg are equal.", cellsWhere(equals(armMinusLeg, 0))),

  // Part multiplicities.
  stat(
    "LargestRepeatedPart",
    "The largest part that occurs at least twice; 0 if the parts are distinct.",
    nonEmpty(["Max", forEach(upTo(largest), ["If", atLeastValue(multiplicityOf("k"), 2), "k", 0], "k")]),
  ),
  stat(
    "MultiplicityOfSmallestPart",
    "How many parts equal the smallest.",
    nonEmpty(count(positions, equals(here, at(length())))),
  ),
  stat(
    "FlooredHalfMultiplicitySum",
    "The sum, over part sizes, of half the multiplicity rounded down.",
    nonEmpty(
      sumOver(upTo(largest), ["Divide", subtract(multiplicityOf("k"), ["Mod", multiplicityOf("k"), 2]), 2], "k"),
    ),
  ),
  stat(
    "DistinctRepeatedParts",
    "Distinct part sizes that occur at least twice.",
    nonEmpty(count(upTo(largest), atLeastValue(multiplicityOf("k"), 2), "k")),
  ),
  stat(
    "SingletonParts",
    "Parts that occur exactly once.",
    nonEmpty(count(upTo(largest), equals(multiplicityOf("k"), 1), "k")),
  ),
  stat(
    "DistinctMultiplicities",
    "How many different multiplicities the part sizes have.",
    nonEmpty(count(upTo(length()), greater(count(upTo(largest), equals(multiplicityOf("k"), "v"), "k"), 0), "v")),
  ),
  stat(
    "LargestMultiplicity",
    "The largest multiplicity of a part.",
    nonEmpty(["Max", forEach(upTo(largest), multiplicityOf("k"), "k")]),
  ),
  stat(
    "PartsEqualToMultiplicity",
    "Parts equal to their own multiplicity.",
    nonEmpty(count(positions, equals(count(positions, equals(at("m"), here), "m"), here))),
  ),
  stat(
    "DistinctPartsEqualToMultiplicity",
    "Distinct part sizes equal to their multiplicity.",
    nonEmpty(count(upTo(largest), equals(multiplicityOf("k"), "k"), "k")),
  ),

  // Sizes, staircases and the rest.
  stat(
    "WeightedSize",
    "The sum of the parts weighted by their row, counting rows from 0.",
    nonEmpty(sumOver(positions, ["Multiply", subtract("i", 1), here])),
  ),
  stat(
    "AddableCells",
    "Cells that can be added to the diagram and leave a partition: one more than the distinct parts.",
    nonEmpty(add(count(upTo(largest), greater(multiplicityOf("j"), 0), "j"), 1), 1),
  ),
  stat(
    "PartsExceedingOnes",
    "Parts larger than the number of parts equal to 1.",
    nonEmpty(count(positions, greater(here, ones))),
  ),
  stat(
    "ContentSum",
    "The sum of the contents j - i of the cells.",
    nonEmpty(sumOver(positions, subtract(["Divide", ["Multiply", here, add(here, 1)], 2], ["Multiply", "i", here]))),
  ),
  stat(
    "LargestStaircaseSide",
    "The side of the largest staircase (k, k-1, ..., 1) inside the diagram.",
    nonEmpty(staircaseSide),
  ),
  stat(
    "ContainingSquareSide",
    "The side of the smallest square that contains the diagram: the larger of the largest part and the number of parts.",
    nonEmpty(["Max", largest, length()]),
  ),
  stat(
    "CellsOutsideLargestStaircase",
    "Cells of the diagram outside the largest staircase it contains.",
    nonEmpty(subtract(total, ["Divide", ["Multiply", staircaseSide, add(staircaseSide, 1)], 2])),
  ),
  stat(
    "Aft",
    "The size minus the larger of the largest part and the number of parts.",
    nonEmpty(subtract(total, ["Max", largest, length()])),
  ),
  stat("SmallestMissingPart", "The smallest positive integer that is not a part.", [
    "If",
    equals(length(), 0),
    1,
    ["Min", where(upTo(add(length(), 1)), equals(multiplicityOf("k"), 0), "k")],
  ]),
  stat(
    "PairwiseProductSum",
    "The sum of the products of all pairs of parts.",
    nonEmpty(["Divide", subtract(["Power", total, 2], sumOver(positions, ["Power", here, 2])), 2]),
  ),

  // ── FindStat's integer-partition statistics, second round ────────────────────────────────

  // Extremes and shapes of the diagram.
  stat("PartRange", "The largest part minus the smallest.", nonEmpty(subtract(largest, ["Min", x]))),
  stat(
    "ContainingRectangleShortSide",
    "The shorter side of the smallest rectangle that contains the diagram: the smaller of the largest part and the number of parts.",
    nonEmpty(["Min", largest, length()]),
  ),
  stat(
    "MaximalRectangleHalfPerimeter",
    "Half the perimeter of the rectangle inside the diagram that has the greatest perimeter.",
    nonEmpty(["Max", forEach(positions, add(here, "i"))]),
    "One more than `LargestShiftedPart`, except that both are 0 on the empty partition.",
  ),
  stat(
    "LargestShiftedPart",
    "The largest part after adding i - 1 to the i-th part.",
    nonEmpty(["Max", forEach(positions, add(here, subtract("i", 1)))]),
    "One less than `MaximalRectangleHalfPerimeter`, except that both are 0 on the empty partition.",
  ),
  stat(
    "RemovableHorizontalDominoes",
    "Parts from which 2 can be subtracted and leave a partition: rows ending in a removable horizontal domino.",
    nonEmpty(
      count(positions, [
        "If",
        equals("i", length()),
        atLeastValue(here, 2),
        atLeastValue(subtract(here, 2), at(add("i", 1))),
      ]),
    ),
  ),
  stat(
    "CellsOutsideFirstRow",
    "Cells of the diagram below the first row: the size minus the largest part.",
    nonEmpty(subtract(total, largest)),
  ),
  stat(
    "CellsOutsideFirstHook",
    "Cells in neither the first row nor the first column: the size minus the hook length of cell (1,1).",
    nonEmpty(subtract(total, subtract(add(largest, length()), 1))),
  ),
  stat(
    "RowCellPairs",
    "Pairs of cells in the same row: the sum over parts of the binomial coefficient of the part and 2.",
    nonEmpty(sumOver(positions, ["Divide", ["Multiply", here, subtract(here, 1)], 2])),
  ),
  stat(
    "CellsWithZeroLegAndOddArm",
    "Cells with leg 0 and an odd arm.",
    cellsWhere(and(equals(subtract(columnLength("j"), "i"), 0), equals(["Mod", subtract(here, "j"), 2], 1))),
  ),
  stat(
    "CornerMajorIndex",
    "The sum, over the corners, of the step number along the boundary path from the bottom left: (number of parts - i) + the i-th part.",
    nonEmpty(
      sumOver(positions, [
        "If",
        or(equals("i", length()), greater(here, at(add("i", 1)))),
        add(subtract(length(), "i"), here),
        0,
      ]),
    ),
    "For (8, 6, 6, 4, 3, 3) the corners are at steps 3, 6, 9 and 13, so the value is 31 (FindStat's St000770 example).",
  ),

  // Sums and products of the parts.
  stat("PartProduct", "The product of the parts.", nonEmpty(["Product", x], 1)),
  stat("PartSquareSum", "The sum of the squares of the parts.", nonEmpty(sumOver(positions, ["Power", here, 2]))),
  stat(
    "PartFactorialProduct",
    "The product of the factorials of the parts.",
    nonEmpty(["Product", forEach(positions, ["Product", upTo(here)])], 1),
  ),
  stat(
    "MultiplicityFactorialProduct",
    "The product of the factorials of the multiplicities of the parts.",
    nonEmpty(["Product", forEach(positions, count(upTo("i"), equals(at("j"), here), "j"))], 1),
  ),
  stat(
    "SumOfEvenParts",
    "The sum of the even parts.",
    nonEmpty(sumOver(positions, ["If", equals(["Mod", here, 2], 0), here, 0])),
  ),
  stat(
    "SumOfOddParts",
    "The sum of the odd parts.",
    nonEmpty(sumOver(positions, ["If", equals(["Mod", here, 2], 1), here, 0])),
  ),
  stat(
    "SumOfPartsAtLeastTwo",
    "The sum of the parts that are at least 2.",
    nonEmpty(sumOver(positions, ["If", atLeastValue(here, 2), here, 0])),
  ),
  stat("GreatestCommonDivisorOfParts", "The greatest common divisor of the parts.", nonEmpty(greatestCommonDivisor)),
  stat("LeastCommonMultipleOfParts", "The least common multiple of the parts.", nonEmpty(leastCommonMultiple, 1)),
  stat(
    "PairwiseGreatestCommonDivisorSum",
    "The sum of the greatest common divisors of all pairs of parts.",
    nonEmpty(pairwiseGreatestCommonDivisorSum),
  ),

  // Parity of the parts.
  stat("LargestEvenPart", "The largest even part; 0 if there is none.", nonEmpty(largestEven)),
  stat(
    "EvenOddCrank",
    "The largest even part minus the number of odd parts.",
    nonEmpty(subtract(largestEven, count(positions, equals(["Mod", here, 2], 1)))),
    "Not the Andrews-Garvan `Crank`: this is the largest even part minus the number of odd parts.",
  ),
  stat(
    "OddPartsBelowLargestEvenPart",
    "Odd parts smaller than the largest even part.",
    nonEmpty(bind("e", largestEven, count(positions, and(less(here, "e"), equals(["Mod", here, 2], 1))), "number")),
  ),
  stat(
    "DistinctEvenParts",
    "Distinct even part sizes.",
    nonEmpty(count(upTo(largest), and(greater(multiplicityOf("k"), 0), equals(["Mod", "k", 2], 0)), "k")),
  ),
  stat(
    "BerkovichGarvanRank",
    "The sum of a checkerboard filling of the diagram, +1 on cells whose coordinates sum to an even number and -1 on the others.",
    nonEmpty(sumOver(positions, ["Multiply", ["If", equals(["Mod", "i", 2], 1), 1, -1], ["Mod", here, 2]])),
    "A row of even length cancels and one of odd length leaves a single cell, counted + in the first row, - in the second, and so on.",
  ),

  // Gaps, repeats and subset sums.
  stat(
    "PartsEqualToNextPart",
    "Parts whose next smaller part has the same size: the number of parts less the distinct parts.",
    nonEmpty(subtract(length(), count(upTo(largest), greater(multiplicityOf("k"), 0), "k"))),
  ),
  stat(
    "LargestMissingPart",
    "The largest integer below the largest part that is not a part; 0 if every smaller integer is.",
    nonEmpty(["Max", forEach(upTo(largest), ["If", equals(multiplicityOf("k"), 0), "k", 0], "k")]),
    "0 counts as a candidate, so the value is 0 when every smaller positive integer is a part.",
  ),
  stat(
    "SmallestNonRepeatedInteger",
    "The smallest positive integer that is not a part at least twice.",
    ["If", equals(length(), 0), 1, ["Min", where(upTo(add(length(), 1)), less(multiplicityOf("k"), 2), "k")]],
    "The integer need not be a part: it is the least k >= 1 with fewer than two parts equal to k.",
  ),
  stat(
    "DistinctSubsetSums",
    "Distinct sums of non-empty sub-multisets of the parts.",
    nonEmpty(bind("s", subsetSums, subtract(length("s"), 1))),
    'Follows FindStat\'s Sage code and its data, not its title: the "partial sums" it counts are the sums of arbitrary sub-multisets of the parts (the code runs over all subsets), not of the running prefixes.',
  ),
  stat(
    "DistinctEvenSubsetSums",
    "Distinct nonzero even sums of sub-multisets of the parts.",
    nonEmpty(bind("s", subsetSums, subtract(count("s", equals(["Mod", "i", 2], 0)), 1), "list<integer>")),
    'Follows FindStat\'s Sage code and its data, not its title: the "partial sums" it counts are the sums of arbitrary sub-multisets of the parts (the code runs over all subsets), not of the running prefixes. The empty sum, 0, is not counted.',
  ),
  stat(
    "DistinctOddSubsetSums",
    "Distinct odd sums of sub-multisets of the parts.",
    nonEmpty(bind("s", subsetSums, count("s", equals(["Mod", "i", 2], 1)), "list<integer>")),
    'Follows FindStat\'s Sage code and its data, not its title: the "partial sums" it counts are the sums of arbitrary sub-multisets of the parts (the code runs over all subsets), not of the running prefixes.',
  ),

  // ── FindStat's integer-partition statistics, third round ─────────────────────────────────

  // Parts by residue and parity.
  stat(
    "PartsNotCongruentToTwoModuloThree",
    "Parts that are not congruent to 2 modulo 3.",
    nonEmpty(count(positions, less(["Mod", here, 3], 2))),
  ),
  stat(
    "PartsNotCongruentToZeroModuloThree",
    "Parts that are not divisible by 3.",
    nonEmpty(count(positions, greater(["Mod", here, 3], 0))),
  ),
  stat(
    "PartsNotCongruentToOneModuloThree",
    "Parts that are not congruent to 1 modulo 3.",
    nonEmpty(count(positions, or(equals(["Mod", here, 3], 0), equals(["Mod", here, 3], 2)))),
  ),
  stat("PartsEqualTwo", "Parts equal to 2.", nonEmpty(partsEqualTo(2))),
  stat(
    "HalfSumOfEvenParts",
    "Half the sum of the even parts.",
    nonEmpty(["Divide", sumOver(positions, ["If", equals(["Mod", here, 2], 0), here, 0]), 2]),
  ),
  stat("HalfLargestEvenPart", "Half the largest even part; 0 if there is none.", nonEmpty(["Divide", largestEven, 2])),
  stat(
    "DistinctOddPartsBelowLargestEvenPart",
    "Distinct odd part sizes smaller than the largest even part.",
    nonEmpty(
      bind(
        "e",
        largestEven,
        count(
          upTo(largest),
          and(and(greater(multiplicityOf("k"), 0), equals(["Mod", "k", 2], 1)), less("k", "e")),
          "k",
        ),
        "number",
      ),
    ),
  ),

  // Products, quotients and counts built from the parts.
  stat(
    "PartSquareProduct",
    "The product of the squares of the parts.",
    nonEmpty(["Product", forEach(positions, ["Power", here, 2])], 1),
  ),
  stat(
    "MultinomialOfParts",
    "The multinomial coefficient of the size over the parts: the size factorial over the product of the factorials of the parts.",
    nonEmpty(["Divide", factorialOf(total), ["Product", forEach(positions, factorialOf(here))]], 1),
  ),
  stat(
    "ExponensConsonantiae",
    "The least common multiple of the parts over their greatest common divisor.",
    nonEmpty(["Divide", leastCommonMultiple, greatestCommonDivisor]),
  ),
  stat(
    "CyclicSievingPolynomialDegree",
    "(1 - 1/largest part) times the least common multiple of the parts: the degree of the cyclic sieving polynomial of a permutation with these cycle lengths.",
    nonEmpty(["Divide", ["Multiply", subtract(largest, 1), leastCommonMultiple], largest]),
    "FindStat leaves the empty partition undefined; it is 0 here.",
  ),
  stat(
    "GiniIndex",
    "The size plus 1 choose 2, less the sum over the columns of the column length plus 1 choose 2.",
    nonEmpty(
      subtract(
        ["Divide", ["Multiply", total, add(total, 1)], 2],
        sumOver(conjugate, ["Divide", ["Multiply", "i", add("i", 1)], 2]),
      ),
    ),
  ),
  stat(
    "InterlacingPartitionCount",
    "The number of partitions that interlace this one: the product over the parts of the gap to the next part (0 after the last) plus 1.",
    nonEmpty(
      ["Product", forEach(positions, add(subtract(here, ["If", equals("i", length()), 0, at(add("i", 1))]), 1))],
      1,
    ),
  ),
  stat(
    "MinimalSubpartitionSizeDifference",
    "The smallest difference in size between the two halves of a split of the parts into two sub-multisets.",
    nonEmpty(
      bind(
        "s",
        subsetSums,
        ["Min", forEach(where("s", atLeastValue(["Multiply", "i", 2], total)), subtract(["Multiply", "i", 2], total))],
        "list<integer>",
      ),
    ),
  ),
  stat(
    "AlladiWeight",
    "The last part times the product over consecutive parts of the gap less 1.",
    // The zero is spelled out: compiled, a -1 factor times a 0 one would leave -0.
    nonEmpty([
      "If",
      equals(length(), 1),
      at(length()),
      [
        "If",
        greater(count(adjacent, equals(subtract(here, at(add("i", 1))), 1)), 0),
        0,
        ["Multiply", at(length()), ["Product", forEach(adjacent, subtract(subtract(here, at(add("i", 1))), 1))]],
      ],
    ]),
  ),
  stat(
    "SecondAlladiWeight",
    "Half the last part (rounded up if odd), times the product over consecutive parts of half the gap less 1 for each even one of the two.",
    nonEmpty([
      "If",
      equals(length(), 1),
      lastFactor,
      [
        "If",
        greater(count(adjacent, equals(pairGap, 0)), 0),
        0,
        ["Multiply", lastFactor, ["Product", forEach(adjacent, ["Divide", pairGap, 2])]],
      ],
    ]),
    "Alladi's second weight: for each part, delta is 1 if it is even and 0 if odd; the factor for the last part is (last + 1 - delta)/2 and for each consecutive pair (gap - delta - delta')/2.",
  ),

  // Cycle types: a partition read as the cycle lengths of a permutation.
  stat(
    "CentralizerSize",
    "The size of the centralizer of a permutation with these cycle lengths: the product of the parts times the product of the factorials of the multiplicities.",
    nonEmpty(["Multiply", ["Product", x], multiplicityFactorials], 1),
  ),
  stat(
    "ConjugacyClassSize",
    "The number of permutations of the same cycle type: n! over the product of the cycle sizes and the factorials of the multiplicities.",
    nonEmpty(["Divide", factorialOf(total), ["Multiply", ["Product", x], multiplicityFactorials]], 1),
  ),
  stat(
    "SetPartitionsWithBlockSizesCount",
    "The number of set partitions whose block sizes are the parts: the size factorial over the product of the factorials of the parts and of the multiplicities.",
    nonEmpty(
      [
        "Divide",
        factorialOf(total),
        ["Multiply", ["Product", forEach(positions, factorialOf(here))], multiplicityFactorials],
      ],
      1,
    ),
  ),
  stat(
    "KrewerasNumber",
    "The number of noncrossing set partitions whose block sizes are the parts: the size factorial over the factorial of size + 1 - length and the factorials of the multiplicities.",
    nonEmpty(
      [
        "Divide",
        factorialOf(total),
        ["Multiply", factorialOf(subtract(add(total, 1), length())), multiplicityFactorials],
      ],
      1,
    ),
  ),
  stat(
    "InvariantSubsetCount",
    "Subsets of the points left invariant by a permutation with these cycle lengths: each cycle is in or out, 2 to the number of cycles.",
    nonEmpty(["Power", 2, length()], 1),
  ),
  stat(
    "InvariantTwoElementSubsetCount",
    "Invariant 2-element subsets: a pair of fixed points or a 2-cycle.",
    nonEmpty(add(choose2(ones), partsEqualTo(2))),
  ),
  stat(
    "InvariantThreeElementSubsetCount",
    "Invariant 3-element subsets: three fixed points, a fixed point and a 2-cycle, or a 3-cycle.",
    nonEmpty(add(add(choose3(ones), ["Multiply", ones, partsEqualTo(2)]), partsEqualTo(3))),
  ),
  stat(
    "EdgeOrbitCount",
    "Orbits of the complete graph's edges under a permutation with these cycle lengths: the sum of half the parts rounded down, plus the sum of gcd(part, part) over pairs.",
    nonEmpty(edgeOrbits),
  ),

  // Symmetric functions evaluated at k ones, k the number of parts.
  stat(
    "ElementarySymmetricFunctionAtOne",
    "The elementary symmetric function indexed by the partition, in as many variables as it has parts, all set to 1: the product of the binomial coefficients of the number of parts and each part.",
    nonEmpty(["Product", forEach(positions, binomialOf(length(), here))], 1),
  ),

  // Subsets.
  stat(
    "SubsetGreatestCommonDivisorSum",
    "The sum, over the non-empty subsets of the parts, of their greatest common divisor: the sum over d of phi(d) times one less than 2 to the number of parts divisible by d.",
    nonEmpty(
      sumOver(
        upTo(largest),
        [
          "Multiply",
          count(upTo("d"), equals(["Divide", ["Multiply", "k", "d"], ["LCM", "k", "d"]], 1), "k"),
          subtract(["Power", 2, count(positions, equals(["Mod", here, "d"], 0))], 1),
        ],
        "d",
      ),
    ),
  ),

  // ── FindStat's integer-partition statistics, fourth round ────────────────────────────────

  // Tableau counts by the hook-length and hook-content formulas.
  stat(
    "SemistandardTableauCountWithEntriesUpToTwo",
    "Semistandard tableaux of the shape with entries at most 2: the product of 2 + j - i over the cells, over the hook product.",
    nonEmpty(boundedSemistandardTableauxCount(2), 1),
  ),
  stat(
    "SemistandardTableauCountWithEntriesUpToThree",
    "Semistandard tableaux of the shape with entries at most 3.",
    nonEmpty(boundedSemistandardTableauxCount(3), 1),
  ),
  stat(
    "SemistandardTableauCountWithEntriesUpToFour",
    "Semistandard tableaux of the shape with entries at most 4.",
    nonEmpty(boundedSemistandardTableauxCount(4), 1),
  ),
  stat(
    "SemistandardTableauCountWithEntriesUpToLength",
    "Semistandard tableaux of the shape with entries at most the number of parts.",
    nonEmpty(semistandardTableauxCount(length()), 1),
  ),
  stat(
    "SemistandardTableauCountWithEntriesUpToSize",
    "Semistandard tableaux of the shape with entries at most the size of the partition.",
    nonEmpty(semistandardTableauxCount(total), 1),
  ),
  stat(
    "PlancherelCount",
    "The square of the number of standard tableaux: the permutations whose Robinson-Schensted shape is this partition.",
    nonEmpty(["Power", standardTableauxCount, 2], 1),
  ),
  stat(
    "CubedStandardTableauCount",
    "The cube of the number of standard tableaux.",
    nonEmpty(["Power", standardTableauxCount, 3], 1),
  ),
  stat(
    "ShiftedStandardTableauCount",
    "Standard tableaux of the shifted shape: the multinomial of the parts times, over pairs of parts, the difference over the sum. 0 when two parts are equal.",
    nonEmpty(
      [
        "Divide",
        [
          "Multiply",
          factorialOf(total),
          [
            "Product",
            forEach(positions, [
              "Product",
              forEach(positions, ["If", less("j", "i"), subtract(at("j"), here), 1], "j"),
            ]),
          ],
        ],
        [
          "Multiply",
          ["Product", forEach(positions, factorialOf(here))],
          [
            "Product",
            forEach(positions, ["Product", forEach(positions, ["If", less("j", "i"), add(at("j"), here), 1], "j")]),
          ],
        ],
      ],
      1,
    ),
  ),
  stat(
    "TwiceMeanMajorIndexOfStandardTableaux",
    "Twice the mean major index over the standard tableaux: n choose 2, less the sum of the row lengths choose 2, plus the sum of the column lengths choose 2.",
    nonEmpty(add(subtract(choose2(total), sumOver(x, choose2("i"))), sumOver(conjugate, choose2("i")))),
  ),
  stat(
    "TwelveTimesMajorIndexVarianceOfStandardTableaux",
    "Twelve times the variance of the major index over the standard tableaux: the sum of the first n squares, less the sum of the squared hook lengths.",
    nonEmpty(subtract(sumOver(upTo(total), ["Power", "i", 2]), hookSquareSum)),
    "Follows FindStat's description, whose Sage code does not parse; the values agree with it.",
  ),
  stat(
    "PairsOfDistinctParts",
    "Pairs of parts that differ in size: the degree of the polynomial counting semistandard tableaux of the stretched shape.",
    nonEmpty(sumOver(positions, largerPartsBefore)),
  ),
  stat(
    "DiagonalArmSum",
    "The sum of the arms of the cells on the main diagonal.",
    nonEmpty(sumOver(positions, ["If", atLeastValue(here, "i"), subtract(here, "i"), 0])),
    "FindStat's spin (St000319) counts the crossings of the border strips and its dinv adjustment (St000320) sums over their starting columns; each strip contributes its first part less 1, which is the arm of one diagonal cell, and the two agree on every row.",
  ),
  stat(
    "RimHooksRemovedToTwoCore",
    "The 2-rim hooks removed to reach the 2-core: the size less the core's, over 2, the core read off the abacus.",
    nonEmpty(rimHooksRemoved(2)),
  ),
  stat("RimHooksRemovedToThreeCore", "The 3-rim hooks removed to reach the 3-core.", nonEmpty(rimHooksRemoved(3))),
  stat(
    "MultipartitionCount",
    "Tuples of partitions whose sizes are the parts: the product of the partition numbers of the parts.",
    nonEmpty(
      bind("p", partitionNumberTable, ["Product", forEach(positions, at(add(here, 1), "p"))], "list<integer>"),
      1,
    ),
  ),

  // Counts from a formula on the parts.
  stat(
    "PartRearrangementCount",
    "Distinct rearrangements of the parts, the compositions that sort to this partition: the number of parts factorial over the factorials of the multiplicities.",
    nonEmpty(["Divide", factorialOf(length()), multiplicityFactorials], 1),
  ),
  stat(
    "LagrangeInversionCoefficient",
    "The coefficient of the monomial in the compositional-inverse series: n (n + 1) ... (n + length - 2) over the factorials of the multiplicities.",
    nonEmpty(
      [
        "Divide",
        ["If", equals(length(), 1), 1, ["Product", forEach(["Range", 0, subtract(length(), 2)], add(total, "k"), "k")]],
        multiplicityFactorials,
      ],
      1,
    ),
  ),
  stat(
    "LogarithmicDerivativeCoefficient",
    "The coefficient of the monomial in the logarithmic derivative of 1 - c_1 x - c_2 x^2/2! - ..., times a factorial: the set partitions with these block sizes, times (length - 1)! for arranging the blocks in a cycle.",
    nonEmpty(
      [
        "Divide",
        [
          "Multiply",
          ["Divide", factorialOf(total), ["Product", forEach(positions, factorialOf(here))]],
          ["Divide", factorialOf(length()), multiplicityFactorials],
        ],
        length(),
      ],
      1,
    ),
  ),
  stat(
    "StarTranspositionFactorizationCount",
    "Minimal transitive factorizations of a permutation of this cycle type into star transpositions: the product of the parts times (n + 1) ... (n + length - 2).",
    nonEmpty(
      [
        "If",
        equals(length(), 1),
        1,
        [
          "Multiply",
          ["Product", x],
          ["If", equals(length(), 2), 1, ["Product", ["Range", add(total, 1), subtract(add(total, length()), 2)]]],
        ],
      ],
      1,
    ),
  ),
  stat(
    "TransitiveMonotoneFactorizationCount",
    "Transitive monotone factorizations of genus zero of a permutation of this cycle type, into n + length - 2 transpositions.",
    nonEmpty(
      [
        "Divide",
        [
          "Multiply",
          ["Product", forEach(positions, centralBinomial(here))],
          ["Product", x],
          [
            "If",
            less(length(), 4),
            1,
            ["Product", ["Range", add(["Multiply", 2, total], 1), subtract(add(["Multiply", 2, total], length()), 3)]],
          ],
        ],
        [
          "If",
          equals(length(), 1),
          ["Multiply", subtract(["Multiply", 2, total], 1), ["Multiply", 2, total]],
          ["If", equals(length(), 2), ["Multiply", 2, total], 1],
        ],
      ],
      1,
    ),
  ),
  // Dimensions of irreducible representations of the symplectic groups, by the Weyl formula
  // in the orthogonal basis: the partition (padded with zeros) is the highest weight.
  stat(
    "SymplecticDimensionRankTwo",
    "The dimension of the irreducible representation of Sp(4) with this highest weight; 0 if the partition has more than 2 parts.",
    nonEmpty(
      [
        "If",
        greater(length(), 2),
        0,
        [
          "Divide",
          [
            "Multiply",
            symplecticWeight(1, 2),
            symplecticWeight(2, 2),
            subtract(["Power", symplecticWeight(1, 2), 2], ["Power", symplecticWeight(2, 2), 2]),
          ],
          6,
        ],
      ],
      1,
    ),
  ),
  stat(
    "SymplecticDimensionRankThree",
    "The dimension of the irreducible representation of Sp(6) with this highest weight; 0 if the partition has more than 3 parts.",
    nonEmpty(
      [
        "If",
        greater(length(), 3),
        0,
        [
          "Divide",
          [
            "Multiply",
            symplecticWeight(1, 3),
            symplecticWeight(2, 3),
            symplecticWeight(3, 3),
            subtract(["Power", symplecticWeight(1, 3), 2], ["Power", symplecticWeight(2, 3), 2]),
            subtract(["Power", symplecticWeight(1, 3), 2], ["Power", symplecticWeight(3, 3), 2]),
            subtract(["Power", symplecticWeight(2, 3), 2], ["Power", symplecticWeight(3, 3), 2]),
          ],
          720,
        ],
      ],
      1,
    ),
  ),

  // The partitions below this one in the containment order.
  stat(
    "BorderSkewStandardTableauCount",
    "Standard tableaux of the skew shape that adds a cell to every column of the diagram: the size factorial over the factorials of the cells added to each row (the size less the largest part, then the gaps between consecutive parts).",
    nonEmpty(
      [
        "Divide",
        factorialOf(total),
        [
          "Multiply",
          factorialOf(subtract(total, largest)),
          [
            "Product",
            forEach(positions, factorialOf(subtract(here, ["If", equals("i", length()), 0, at(add("i", 1))]))),
          ],
        ],
      ],
      1,
    ),
  ),
  // Tables over the rows. `Max(..., 0)` floors the sum so the compiler types it real (it types a fold's sum complex otherwise).
  stat(
    "SubpartitionCount",
    "The partitions contained in this one.",
    nonEmpty(["Max", ["Sum", subpartitionCounts(0)], 0], 1),
  ),
  stat(
    "SameLengthSubpartitionCount",
    "The partitions with as many parts contained in this one.",
    nonEmpty(["Max", ["Sum", subpartitionCounts(1)], 0], 1),
  ),
  stat(
    "YoungLatticeCoveringRelationCount",
    "The covering relations of Young's lattice among the partitions contained in this one: the sum of their corners.",
    nonEmpty(
      bind(
        "t",
        fold(
          ["Rest", x],
          ["List", forEach(upTo(add(largest, 1)), 1), forEach(upTo(add(largest, 1)), 0)],
          [
            "List",
            subpartitionRow(["At", "a", 1], 0, "b"),
            forEach(upTo(add(largest, 1)), [
              "If",
              atMostValue("i", add("b", 1)),
              sumOver(
                ["Range", "i", add(largest, 1)],
                add(at("k", ["At", "a", 2]), ["If", greater("k", "i"), at("k", ["At", "a", 1]), 0]),
                "k",
              ),
              0,
            ]),
          ],
        ),
        [
          "Max",
          add(["Sum", ["At", "t", 2]], ["Sum", forEach(["Range", 2, add(largest, 1)], at("i", ["At", "t", 1]))]),
          0,
        ],
        "list<list<integer>>",
      ),
      0,
    ),
  ),

  // Parts counted, and the crank as FindStat's code reads it.
  stat("PartCount", "The number of parts.", length()),
  stat(
    "LengthCrank",
    "The number of parts when λ has no 1s, else (parts larger than the number of 1s) minus (the number of 1s).",
    nonEmpty(["If", equals(ones, 0), length(), subtract(count(positions, greater(here, ones)), ones)]),
    "Crank has the largest part where this has the number of parts; FindStat's St000146 follows the code, which takes the length.",
  ),

  // The sixth batch.
  stat(
    "SeaweedAlgebraDimension",
    "The dimension of the maximal parabolic seaweed algebra: half the sum of the squares of the parts and of the size.",
    nonEmpty(["Divide", add(sumOver(positions, ["Power", here, 2]), ["Power", total, 2]), 2]),
  ),
  stat(
    "CartanDeterminant",
    "The determinant of the matrix of the minimums of the distinct parts: the least distinct part times the gaps between consecutive distinct parts.",
    nonEmpty(
      [
        "Product",
        forEach(where(positions, startsOfRuns), subtract(here, ["If", equals("i", length()), 0, at(add("i", 1))])),
      ],
      1,
    ),
  ),
  stat(
    "RookPlacementCount",
    "The rook placements, of any number of rooks, on the Ferrers board of the diagram.",
    nonEmpty(bind("r", rookNumbers, ["Sum", "r"], "list<integer>"), 1),
  ),
  stat(
    "MaximalRookPlacementCount",
    "The ways to place as many non-attacking rooks as possible on the Ferrers board of the diagram.",
    nonEmpty(
      bind(
        "r",
        rookNumbers,
        at(["Max", forEach(upTo(add(length(), 1)), ["If", greater(at("i", "r"), 0), "i", 0])], "r"),
        "list<integer>",
      ),
      1,
    ),
  ),
  stat(
    "ShorterSideRookPlacementCount",
    "The ways to place as many non-attacking rooks as the shorter side of the Ferrers board's bounding rectangle has cells, 0 when they do not fit.",
    nonEmpty(bind("r", rookNumbers, at(add(["Min", length(), largest], 1), "r"), "list<integer>"), 1),
    "FindStat's title calls this the leading coefficient of the rook polynomial, but its code takes the entry for the shorter side, which is 0 when no placement fills it; the name follows the code.",
  ),
  stat(
    "NecklaceCount",
    "The colorings of a cycle with these color multiplicities, up to rotation: the size's divisors d of the greatest common divisor of the parts, each contributing totient(d) multinomials, over the size.",
    nonEmpty(["Divide", rotationFixedColorings, total]),
    "FindStat's St001605 (the cyclic group); its title says colourings of a cycle.",
  ),
  stat(
    "BraceletCount",
    "The colorings of a polygon with these color multiplicities, up to rotation and reflection: the necklaces and the colorings fixed by the reflections, over twice the size.",
    nonEmpty(
      bind(
        "o",
        oddParts,
        [
          "Divide",
          add(rotationFixedColorings, [
            "If",
            greater("o", 2),
            0,
            ["Multiply", total, ["Divide", factorialOf(["Divide", subtract(total, "o"), 2]), halfPartFactorials]],
          ]),
          ["Multiply", 2, total],
        ],
        "number",
      ),
    ),
    "FindStat's St001603 (the dihedral group); its title says colourings of a polygon. It is only defined there for sizes of at least 3.",
  ),
  stat(
    "BulgarianSolitairePreimageCount",
    "The partitions of the same size that Bulgarian solitaire (remove the first column, insert it as a row) sends to this one: the distinct part sizes of at least the number of parts less one.",
    nonEmpty(count(positions, and(startsOfRuns, atLeastValue(here, subtract(length(), 1)))), 1),
  ),
  stat(
    "InvariantOrientedCycleCount",
    "The cyclic permutations that a permutation of this cycle type fixes under conjugation: none unless the parts are all equal to some d, in which case totient(d) d^(m-1) (m-1)! for m parts.",
    nonEmpty(
      [
        "If",
        equals(largest, at(length())),
        ["Multiply", totientOf(largest), ["Power", largest, subtract(length(), 1)], factorialOf(subtract(length(), 1))],
        0,
      ],
      0,
    ),
  ),
  stat(
    "SmirnovWordCount",
    "The words with each letter used this many times and no letter twice in a row: the Carlitz-Scoville-Vaughan sum over the numbers of runs of each letter, taken as a binomial convolution over the parts.",
    // `Max(..., 0)` floors the sum so the compiler types it real.
    nonEmpty(
      [
        "Max",
        [
          "Sum",
          fold(
            x,
            forEach(upTo(add(total, 1)), ["If", equals("i", 1), 1, 0]),
            forEach(
              upTo(add(total, 1)),
              sumOver(
                upTo("i"),
                [
                  "Multiply",
                  binomialOf(subtract("i", 1), subtract("j", 1)),
                  at(add(subtract("i", "j"), 1), "a"),
                  [
                    "If",
                    or(equals("j", 1), greater(subtract("j", 1), "b")),
                    0,
                    [
                      "Multiply",
                      ["Power", -1, subtract("b", subtract("j", 1))],
                      binomialOf(subtract("b", 1), subtract("j", 2)),
                    ],
                  ],
                ],
                "j",
              ),
            ),
          ),
        ],
        0,
      ],
      1,
    ),
    "FindStat's St001097 reads it as a coefficient of the formal group law for linear orders; its description gives the Smirnov words.",
    TABLE_CHECK_WEIGHT,
  ),
  stat(
    "StandardTableauCountWithMajorIndexCongruentToOneModuloSize",
    "The standard Young tableaux whose major index leaves remainder 1 on division by the size of the shape (never, when the size is 1).",
    nonEmpty(tableauxWithMajorIndexRemainder(1)),
    undefined,
    TABLE_CHECK_WEIGHT,
  ),
  stat(
    "UpperCoverCountInDominanceOrder",
    "The partitions of the same size that cover this one in dominance order.",
    nonEmpty(upperCoversIn(x)),
  ),
  stat(
    "LowerCoverCountInDominanceOrder",
    "The partitions of the same size that this one covers in dominance order: the upper covers of its conjugate.",
    nonEmpty(upperCoversIn(conjugate)),
  ),

  // ── FindStat's integer-partition statistics, batch 5 ────────────────────────────────────

  stat(
    "InvariantGraphCount",
    "The simple graphs on the points that a permutation of this cycle type maps to themselves: 2 to the number of edge orbits.",
    nonEmpty(["Power", 2, edgeOrbits], 1),
  ),
  stat(
    "CompleteHomogeneousSymmetricFunctionAtOne",
    "The complete homogeneous symmetric function indexed by the partition, in as many variables as it has parts, all set to 1: the product of the multiset coefficients of the number of parts and each part.",
    nonEmpty(["Product", forEach(positions, binomialOf(add(subtract(length(), 1), here), here))], 1),
  ),
  stat(
    "PowerSumSymmetricFunctionAtOne",
    "The power-sum symmetric function indexed by the partition, in as many variables as it has parts, all set to 1: the number of parts to its own power.",
    nonEmpty(["Power", length(), length()], 1),
  ),
  stat(
    "CubeRootCount",
    "The permutations whose cube is a fixed permutation of this cycle type: the product over part sizes d, with a parts of size d, of the number of ways to take the cube root of each part of size d alone or of three together as a cycle of length 3d.",
    nonEmpty(
      [
        "Product",
        forEach(positions, ["If", startsOfRuns, cubeRoots(here, count(positions, equals(at("j"), here), "j")), 1]),
      ],
      1,
    ),
  ),
  stat(
    "DominatedPartitionCount",
    "The partitions of the same size that this one dominates (partial sums of the parts at least those of the other), itself included.",
    nonEmpty(bind("w", at(add(total, 1), dominatedPartitionTable), ["Sum", "w"], "list<integer>"), 1),
    undefined,
    TABLE_CHECK_WEIGHT,
  ),
  stat(
    "BulgarianSolitaireOrbitSize",
    "The partitions that Bulgarian solitaire (remove the first column, insert it as a row) visits from this one, itself included.",
    nonEmpty(onSolitaireCycle(add(solitairePreperiod, solitairePeriod)), 1),
    undefined,
    TABLE_CHECK_WEIGHT,
  ),
  stat(
    "BulgarianSolitairePreperiod",
    "The steps of Bulgarian solitaire before this partition reaches the cycle it ends in.",
    nonEmpty(onSolitaireCycle(solitairePreperiod)),
    undefined,
    TABLE_CHECK_WEIGHT,
  ),

  // ── FindStat's integer-partition statistics, batch 7 ────────────────────────────────────

  stat("PartitionSize", "The sum of the parts.", nonEmpty(total)),
  stat(
    "CouplesAreForeverGrundyValue",
    "The Grundy value of the game that splits a part above 2 into two parts: the nim-sum of the values of the parts, each the least value missing from the nim-sums over its splits.",
    nonEmpty(bind("g", couplesGrundyTable, nimSum(forEach(positions, at(here, "g"))), "list<integer>")),
    undefined,
    TABLE_CHECK_WEIGHT,
  ),
  stat(
    "RowRemovalGrundyValue",
    "The Grundy value of the game that removes cells from the end of a row while the diagram stays a partition: staircase nim, the nim-sum of the differences of consecutive parts at odd positions.",
    nonEmpty(nimSum(oddStepHeaps)),
    undefined,
    TABLE_CHECK_WEIGHT,
  ),
  stat(
    "OrderedRefinementCount",
    "The partitions whose parts cut, in order, into consecutive blocks summing to the parts of this one.",
    nonEmpty(orderedRefinementTable, 1),
    undefined,
    TABLE_CHECK_WEIGHT,
  ),
  stat(
    "RefinementCount",
    "The partitions that refine this one, whose parts subdivide to give theirs. Itself included.",
    nonEmpty(["If", less(total, 2), 1, refinementCount], 1),
    undefined,
    TABLE_CHECK_WEIGHT,
  ),
  stat(
    "CoarseningCount",
    "The partitions that coarsen this one, whose parts subdivide to give its. Itself included.",
    nonEmpty(["If", less(total, 2), 1, coarseningCount], 1),
    undefined,
    TABLE_CHECK_WEIGHT,
  ),
  stat(
    "SingletonRefinementCount",
    "The chains of single splits (a part into two) from this partition down to all ones.",
    nonEmpty(["If", less(total, 2), 1, refinementChains], 1),
    undefined,
    TABLE_CHECK_WEIGHT,
  ),

  // ── FindStat's integer-partition statistics, batch 8 ────────────────────────────────────

  stat(
    "HurwitzNumber",
    "Hurwitz's number for the partition: (n + c - 2)! n^(c-3) times the product of p^p / (p-1)! over its c parts p, n being its size.",
    nonEmpty(hurwitzNumber),
  ),
  stat(
    "MonotoneHurwitzNumber",
    "The monotone factorizations of genus zero of a permutation of this cycle type into transpositions: the product of the Catalan numbers C(p - 1) over the parts p.",
    nonEmpty(bind("c", catalanTable, ["Product", forEach(positions, at(here, "c"))], "list<integer>"), 1),
    "The cycles factor independently, and the larger entries of the transpositions, weakly increasing, fix how the factors interleave.",
  ),
  stat(
    "NonDominatingSubmultisetCount",
    "The distinct sub-multisets of the parts that, read as partitions, do not dominate their own conjugate.",
    nonEmpty(nonDominatingSubmultisets),
    "FindStat calls the sub-multisets subpartitions. The partitions with none are the wide ones.",
    TABLE_CHECK_WEIGHT,
  ),

  // ── FindStat's integer-partition statistics, batch 9 ────────────────────────────────────

  stat(
    "CharacterPolynomialConstantTerm",
    "The constant term of the character polynomial: 1 for the partition of all ones (the empty one included), 0 otherwise.",
    nonEmpty(["If", equals(largest, 1), 1, 0], 1),
  ),
  stat(
    "InverseByConjugationCount",
    "The permutations that a fixed permutation of this cycle type conjugates to their inverse: the square roots of its square, a product over the cycle lengths d of the roots of the cycles of length d.",
    nonEmpty(
      bind(
        "m",
        squareCycleCounts,
        ["Product", forEach(upTo(largest), squareRoots("d", at("d", "m")), "d")],
        "list<integer>",
      ),
      1,
    ),
    "alpha pi alpha^-1 = pi^-1 exactly when (pi alpha)^2 = alpha^2.",
  ),
  stat(
    "StandardTableauCountWithMajorIndexDivisibleBySize",
    "The standard Young tableaux whose major index is divisible by the size of the shape.",
    nonEmpty(tableauxWithMajorIndexRemainder(0)),
    undefined,
    TABLE_CHECK_WEIGHT,
  ),
  stat(
    "SelfEvacuatingTableauCount",
    "The standard Young tableaux of the shape that evacuation fixes, equivalently its standard domino tableaux.",
    nonEmpty(selfEvacuatingTableauxCount),
  ),

  // ── FindStat's integer-partition statistics, batch 10 ───────────────────────────────────

  stat(
    "SquareRootCount",
    "The permutations whose square is a fixed permutation of this cycle type: a product over the cycle lengths d of the roots of the cycles of length d, which is also the sum of the irreducible character values at that class.",
    nonEmpty(["Product", forEach(upTo(largest), squareRoots("d", count(positions, equals(here, "d"))), "d")], 1),
  ),
  stat(
    "StandardTableauCountWithEvenFirstDescent",
    "The standard Young tableaux whose smallest descent, or the size when there is none, is even.",
    nonEmpty(evenFirstDescentTableaux(x), 1),
  ),
  stat(
    "StandardTableauCountWithOddFirstDescent",
    "The standard Young tableaux whose smallest descent, or the size when there is none, is odd.",
    nonEmpty(firstRowSkewSum(x, 1)),
  ),
  stat(
    "DesarrangementTableauCount",
    "The standard Young tableaux whose first ascent is even, which are the transposes of the tableaux of the conjugate shape with even first descent.",
    nonEmpty(evenFirstDescentTableaux(conjugate), 1),
  ),

  // ── FindStat's integer-partition statistics, batch 11 ───────────────────────────────────

  stat(
    "SemistandardTableauWeightCountWithEntriesUpToLength",
    "The distinct weights of the semistandard tableaux of the shape with entries at most the number of parts: the arrangements of the partitions of the size, at most that many parts, that the shape dominates.",
    nonEmpty(
      bind(
        "t",
        distinctWeightTable,
        floored(["Sum", forEach(["Range", 0, length(), 1], at(add(total, 1), at(add("r", 1), "t")), "r")]),
        "list<list<integer>>",
      ),
      1,
    ),
    undefined,
    TABLE_CHECK_WEIGHT,
  ),
  stat(
    "ProperColoringSchemeCount",
    "The partitions of the number of cells that are the class sizes of a proper coloring of the cells with the fewest colors, no two cells in a row or a column alike.",
    nonEmpty(
      bind(
        "m",
        rookCoverage,
        bind(
          "u",
          coloringProfile,
          bind(
            "w",
            at(add(total, 1), dominatedPartitionTableOf("u", longerSide)),
            floored(["Sum", "w"]),
            "list<integer>",
          ),
          "list<integer>",
        ),
        "list<integer>",
      ),
      1,
    ),
    undefined,
    TABLE_CHECK_WEIGHT,
  ),
  stat(
    "MultisetPartitionCount",
    "The multiset partitions of the multiset with these multiplicities: its vector of multiplicities written as an unordered sum of nonzero vectors.",
    nonEmpty(overVectors(partRadices, eulerTransformCount(multisetWeights)), 1),
    undefined,
    TABLE_CHECK_WEIGHT,
  ),
  stat(
    "ColoredRootedTreeCount",
    "The rooted trees, unordered and unlabeled, on vertices colored with these multiplicities, vertices of one color being interchangeable.",
    nonEmpty(overVectors(partRadices, rootedTreeCount)),
    undefined,
    TABLE_CHECK_WEIGHT,
  ),
  stat(
    "ColoredTreeCount",
    "The trees, unrooted and unlabeled, on vertices colored with these multiplicities, vertices of one color being interchangeable.",
    nonEmpty(overVectors(partRadices, treeCount)),
    undefined,
    TABLE_CHECK_WEIGHT,
  ),
  stat(
    "SemistandardTableauCountWithContent",
    "The semistandard tableaux of any shape in which the entry i occurs as many times as part i: the symmetric matrices of nonnegative integers with these row sums.",
    nonEmpty(overVectors(partRadices, eulerTransformCount(symmetricMatrixWeights)), 1),
    undefined,
    TABLE_CHECK_WEIGHT,
  ),
  stat(
    "InvariantSetPartitionCount",
    "The set partitions of the points that a permutation of this cycle type maps to themselves.",
    nonEmpty(invariantSetPartitionCount, 1),
    undefined,
    TABLE_CHECK_WEIGHT,
  ),
  stat(
    "ColoredEndofunctionCount",
    "The endofunctions, up to relabeling, on points colored with these multiplicities, points of one color being interchangeable.",
    nonEmpty(overVectors(partRadices, endofunctionCount), 1),
    undefined,
    TABLE_CHECK_WEIGHT,
  ),
  stat(
    "WordCountWithoutThreeConsecutiveIncreasingLetters",
    "The words in which letter i occurs as many times as part i that have no three consecutive letters in increasing order.",
    nonEmpty(overVectors(partRadices, avoidingWordCount), 1),
    undefined,
    TABLE_CHECK_WEIGHT,
  ),
  stat(
    "NonnegativeIntegerMatrixCountWithDecreasingColumnSums",
    "The matrices of nonnegative integers whose row sums are the parts and whose column sums weakly decrease, with no empty column.",
    nonEmpty(
      overVectors(
        partRadices,
        layeredSequenceCount(() => 1, vectorSize, total),
      ),
      1,
    ),
    undefined,
    TABLE_CHECK_WEIGHT,
  ),
  stat(
    "ZeroOneMatrixCountWithDecreasingColumnSums",
    "The matrices of 0 and 1 whose row sums are the parts and whose column sums weakly decrease, with no empty column.",
    nonEmpty(overVectors(partRadices, layeredSequenceCount(isZeroOneVector, vectorSize, length())), 1),
    undefined,
    TABLE_CHECK_WEIGHT,
  ),
  stat(
    "OrderedSetPartitionCountWithDecreasingBlockSums",
    "The ways to put the parts, told apart by position, into an ordered list of blocks whose sums weakly decrease.",
    nonEmpty(
      overVectors(
        binaryRadices,
        layeredSequenceCount(() => 1, pickedPartSum, total),
      ),
      1,
    ),
    undefined,
    TABLE_CHECK_WEIGHT,
  ),
  stat(
    "RootedTreeCountWithNoLeafOfItsParentsColor",
    "The rooted trees on these colored vertices, told apart by position within a color, in which no leaf has the color of its parent: n^(n-1) trees counted by the formal group law of x exp(-x).",
    nonEmpty(
      formalGroupLawCoefficient(
        (m) => ["Multiply", m, ["If", equals(["Mod", m, 2], 1), 1, -1]],
        (d) => ["If", equals(d, 0), 0, ["Power", d, subtract(d, 1)]],
      ),
    ),
    undefined,
    TABLE_CHECK_WEIGHT,
  ),
  stat(
    "IncreasingTreeCountWithNoLeafOfItsParentsColor",
    "The increasing trees on the vertices 1 .. n, colored in blocks with these multiplicities, in which no leaf has the color of its parent.",
    nonEmpty(
      formalGroupLawCoefficient(
        (m) => ["If", equals(["Mod", m, 2], 1), 1, -1],
        (d) => ["If", equals(d, 0), 0, factorialOf(subtract(d, 1))],
      ),
    ),
    undefined,
    TABLE_CHECK_WEIGHT,
  ),
  stat(
    "BinaryTreeCountWithNoTwinLeavesOfOneColor",
    "The rooted binary trees whose leaves are the colored vertices, internal vertices unlabeled, in which no internal vertex has two leaves of one color as its children.",
    nonEmpty(
      formalGroupLawCoefficient(
        (m) => ["If", equals(m, 1), 1, ["If", equals(m, 2), -1, 0]],
        (d) => [
          "If",
          equals(d, 0),
          0,
          [
            "Divide",
            factorialOf(subtract(["Multiply", 2, d], 2)),
            ["Multiply", ["Power", 2, subtract(d, 1)], factorialOf(subtract(d, 1))],
          ],
        ],
      ),
    ),
    undefined,
    TABLE_CHECK_WEIGHT,
  ),
  stat(
    "LeafLabeledTreeCountWithNoTwinLeavesOfOneColor",
    "The rooted trees whose leaves are the colored vertices, internal vertices unlabeled and with at least two children, in which no internal vertex has only leaves of one color as its children.",
    nonEmpty(
      formalGroupLawCoefficient(
        (m) => ["If", equals(m, 1), 1, -1],
        (d) => at(add(d, 1), "gt"),
        (body) =>
          bind(
            "gt",
            typedFold(
              [
                "Join",
                "a",
                [
                  "List",
                  add(
                    ["Multiply", -1, "n", at(add("n", 1), "a")],
                    [
                      "Multiply",
                      2,
                      floored([
                        "Sum",
                        forEach(
                          upTo("n"),
                          [
                            "Multiply",
                            ["Binomial", "n", "k"],
                            at(add("k", 1), "a"),
                            at(add(subtract("n", "k"), 2), "a"),
                          ],
                          "k",
                        ),
                      ]),
                    ],
                  ),
                ],
              ],
              "a",
              "n",
              ["List", 0, 1],
              upTo(total),
              "list<integer>",
            ),
            body,
            "list<integer>",
          ),
      ),
    ),
    undefined,
    TABLE_CHECK_WEIGHT,
  ),
  stat(
    "StandardTableauCountWithNoConsecutiveEntriesInOneRow",
    "The standard Young tableaux of the shape in which no row holds i and i + 1 together.",
    nonEmpty(overVectors(partRadices, bind("t", tableauxWithoutRowRuns, at(multisetVectors, "t"), "list<integer>")), 1),
    undefined,
    TABLE_CHECK_WEIGHT,
  ),
  stat(
    "LehmerCodeMultiplicityPermutationCount",
    "The permutations of the size whose Lehmer code takes its values with these multiplicities, the nonzero multiplicities of its values being the parts.",
    nonEmpty(lehmerCodeMultiplicityCount, 1),
    undefined,
    TABLE_CHECK_WEIGHT,
  ),
  stat(
    "DiagramPosetLinearExtensionCount",
    "The linear extensions of the poset on the diagram (Speyer's construction for the homogeneous Garnir relations), counted by the splitting of the diagram at its lowest cell on the longest antidiagonal into the rows below and the columns beyond.",
    nonEmpty(diagramLinearExtensionCount, 1),
  ),
  stat(
    "ChompGrundyValue",
    "The Grundy value of Chomp on the diagram: a move cuts a cell and all cells below and right of it, any cell but the first, and the player left with the first cell alone loses.",
    nonEmpty(
      overVectors(partRadices, bind("t", grundyTable(chompMoveCount), at(multisetVectors, "t"), "list<integer>")),
    ),
    undefined,
    TABLE_CHECK_WEIGHT,
  ),
  stat(
    "SquareRemovalGrundyValue",
    "The Grundy value of the game that removes a cell or a 2 x 2 square of cells from the diagram, which must stay a partition, the player who cannot move losing.",
    nonEmpty(
      overVectors(partRadices, bind("t", grundyTable(squareGameMoveCount), at(multisetVectors, "t"), "list<integer>")),
    ),
    undefined,
    TABLE_CHECK_WEIGHT,
  ),
  stat(
    "SmallestOddRestrictionDepth",
    "The fewest cells to remove from the diagram so that the partition left has an odd number of standard tableaux: the least d such that the restriction of the irreducible representation to the symmetric group on n - d points has a constituent of odd dimension.",
    nonEmpty(overVectors(partRadices, smallestOddRestrictionDepth)),
    undefined,
    TABLE_CHECK_WEIGHT,
  ),
  stat(
    "DominoTilingCount",
    "The tilings of the diagram by single cells and dominoes, the dominoes of two adjacent cells, whether in a row or a column.",
    nonEmpty(dominoTilingCount, 1),
    undefined,
    TABLE_CHECK_WEIGHT,
  ),
  stat(
    "ColoredCycleMultisetCount",
    "The multisets of cycles on points colored with these multiplicities, points of one color being interchangeable.",
    nonEmpty(overVectors(partRadices, eulerTransformCount(cycleMultisetWeights)), 1),
    undefined,
    TABLE_CHECK_WEIGHT,
  ),
];
