// Integer-composition statistics, over `_x` = the list of parts, each a positive integer.
//
// A composition is read as a word of its parts (ascents, records, subsequences, runs of equal
// parts), as the heights of a bargraph, or as the row lengths of a ribbon. Where a statistic
// reads the composition one of the latter ways, the head says so.

import type { Definition, MathJSON } from "../../src/statistics/types.ts";
import {
  adjacent,
  add,
  and,
  at,
  atLeastValue,
  atMostValue,
  bindList,
  carried,
  count,
  equals,
  floored,
  fold,
  forEach,
  fallsAfter,
  greater,
  hasPair,
  hasTriple,
  here,
  interior,
  length,
  less,
  max,
  min,
  next,
  nonEmpty,
  positions,
  previous,
  risesAfter,
  subtract,
  sumOver,
  upTo,
  visiting,
  where,
  x,
} from "../../src/statistics/vocabulary.ts";

const on = "IntegerComposition";
const stat = (head: string, summary: string, expr: MathJSON, note?: string): Definition => ({
  head,
  on,
  summary,
  expr,
  ...(note ? { note } : {}),
});

const k = length();
/** `a` and `b` differ. */
const differ = (a: MathJSON, b: MathJSON): MathJSON => greater(["Abs", subtract(a, b)], 0);
/** The part at the mirror position of `i`. */
const mirrored: MathJSON = at(subtract(add(k, 1), "i"));
/** The rise from position i to i + 1, or 0 where the parts fall or stay. */
const rise: MathJSON = ["If", greater(next, here), subtract(next, here), 0];
const list = (...items: MathJSON[]): MathJSON => ["List", ...items];
const total: MathJSON = ["Sum", x];

// ── parts and their multiplicities ───────────────────────────────────────────────────────

/** How many parts equal the part at position `i`. */
const multiplicityAt = (i: MathJSON): MathJSON => count(positions, equals(at("j"), at(i)), "j");
const multiplicities: MathJSON = forEach(positions, multiplicityAt("i"), "i");

// ── records ──────────────────────────────────────────────────────────────────────────────

/** No earlier part is at least (a strong record) or more than (a weak record) part `i`. */
const strongRecords: MathJSON = where(
  positions,
  equals(count(positions, and(less("j", "i"), atLeastValue(at("j"), at("i"))), "j"), 0),
);
const weakRecords: MathJSON = where(
  positions,
  equals(count(positions, and(less("j", "i"), greater(at("j"), at("i"))), "j"), 0),
);

// ── subsequences ─────────────────────────────────────────────────────────────────────────

/**
 * Patience sorting: the tails of the best subsequences by length. A part goes on the first pile
 * whose tail is not `ahead` of it, or starts a new pile; the number of piles is the length.
 */
const piles = (ahead: MathJSON): MathJSON => {
  const target: MathJSON = add(["Count", ["Filter", "a", ["Function", ahead, "t"]]], 1);
  const step: MathJSON = [
    "If",
    greater("m", ["Count", "a"]),
    ["Join", "a", list(visiting)],
    ["ReplaceAt", "a", "m", visiting],
  ];
  return fold(x, list(), ["Apply", ["Function", step, "m"], target]);
};

// ── runs of equal parts ──────────────────────────────────────────────────────────────────

/** The run lengths behind the first entry, which holds the part of the run in progress. */
const runLengths: MathJSON = [
  "Rest",
  fold(x, list(0), [
    "If",
    equals(visiting, at(1, "a")),
    ["ReplaceAt", "a", ["Length", "a"], add(["Last", "a"], 1)],
    ["Join", ["ReplaceAt", "a", 1, visiting], list(1)],
  ]),
];

// ── the bargraph of heights x_1 ... x_k ──────────────────────────────────────────────────

/** Up steps: the first height, and every rise after it. */
const upSteps: MathJSON = add(at(1), hasPair(sumOver(adjacent, rise)));
/**
 * Peaks: the state machine over the heights closed off by a zero. It carries the previous
 * height, whether a rise is waiting for its fall, and the peaks so far.
 */
const bargraphPeaks: MathJSON = at(
  3,
  fold(["Join", x, list(0)], list(0, 0, 0), [
    "If",
    greater(visiting, at(1, "a")),
    list(visiting, 1, at(3, "a")),
    [
      "If",
      less(visiting, at(1, "a")),
      list(visiting, 0, add(at(3, "a"), at(2, "a"))),
      list(visiting, at(2, "a"), at(3, "a")),
    ],
  ]),
);
/**
 * Valleys, between consecutive bars: a fall, then (after any level bars) a rise, whose height
 * is the bar before the rise. It carries whether a fall is waiting for its rise, and the total.
 */
const valleyHeights: MathJSON = hasPair(
  at(
    2,
    fold(["Range", 2, k, 1], list(0, 0), [
      "If",
      less(at("b"), at(subtract("b", 1))),
      list(1, at(2, "a")),
      [
        "If",
        greater(at("b"), at(subtract("b", 1))),
        list(0, add(at(2, "a"), ["Multiply", at(1, "a"), at(subtract("b", 1))])),
        "a",
      ],
    ]),
  ),
);

// ── tableaux ─────────────────────────────────────────────────────────────────────────────

/**
 * Standard immaculate tableaux are the linear extensions of a forest: the first entries of the
 * rows form a chain, and each row continues above its first entry. The hook length formula for
 * forests gives n! over the product, over rows i, of the number of entries at or below row i's
 * first entry, times (parts_i - 1)!.
 */
const immaculateTableaux: MathJSON = nonEmpty(
  [
    "Divide",
    ["Product", ["Range", 1, total]],
    [
      "Product",
      forEach(
        positions,
        [
          "Multiply",
          add(subtract(total, sumOver(["Range", 1, "i"], at("j"), "j")), at("i")),
          ["Divide", ["Product", ["Range", 1, at("i")]], at("i")],
        ],
        "i",
      ),
    ],
  ],
  1,
);

/** The sum of the first `parts` parts. */
const partialSum = (parts: MathJSON): MathJSON => [
  "Sum",
  forEach(where(positions, less("u", add(parts, 1)), "u"), at("u"), "u"),
];
/**
 * Standard fillings of the ribbon are the permutations of 1 .. n whose descents are the
 * composition's partial sums. By inclusion-exclusion over the descents kept, their number is n!
 * times the sum, over the coarsenings of the composition, of (-1)^(parts merged away) over the
 * product of the coarse parts' factorials. The list holds, for each cut so far (the empty cut
 * first), n! times that sum over the coarsenings of what precedes it (so every entry is an
 * integer, and the compiled code stays exact); the next cut closes a block from any earlier cut,
 * merging the parts between.
 */
const ribbonTableaux: MathJSON = nonEmpty(
  [
    "Last",
    fold(positions, list(["Product", ["Range", 1, total]]), [
      "Join",
      "a",
      list([
        "Sum",
        forEach(
          ["Range", 1, "b"],
          [
            "Divide",
            ["Multiply", ["Power", -1, subtract("b", "j")], at("j", "a")],
            ["Product", ["Range", 1, subtract(partialSum("b"), partialSum(subtract("j", 1)))]],
          ],
          "j",
        ),
      ]),
    ]),
  ],
  1,
);

/**
 * The ribbon's boundary path goes along each row (a horizontal step for each cell past the
 * first) and up between rows. Its corners are one more than its runs of like steps: the
 * horizontal runs are the rows of two or more cells, and the vertical runs are separated by the
 * rows strictly between the first and last that have two or more.
 */
const ribbonCorners: MathJSON = nonEmpty(
  add(
    add(count(positions, atLeastValue(at("i"), 2)), [
      "If",
      less(k, 2),
      0,
      add(
        1,
        count(positions, and(and(atLeastValue("i", 2), atMostValue("i", subtract(k, 1))), atLeastValue(at("i"), 2))),
      ),
    ]),
    1,
  ),
);

// ── cut points, meanders and bounce paths ────────────────────────────────────────────────

/** The partial sums of the parts, from 0 to the total: where the blocks of the composition cut. */
const cutPoints: MathJSON = fold(x, list(0), ["Join", "a", list(add(["Last", "a"], "b"))]);
/** The last cut before position `i`, which is where the block holding `i` starts less one. */
const cutBefore = (i: MathJSON): MathJSON => max(where("cuts", less("u", i), "u"));
const reflected = (i: MathJSON): MathJSON => subtract(add(total, 1), i);

/**
 * The meander of the composition over the single block 1 .. n, as FindStat's code builds it: a
 * simple graph, so an arc above and an arc below the same two dots are one edge. A vertex's
 * neighbours are its mirror image in the block of the composition and in 1 .. n.
 *
 * Index = 2C + P - 1 with C the cycles and P the paths. Every vertex has at most two neighbours,
 * so every component is a path or a cycle, and the paths are counted by their ends: P = (degree-1
 * vertices)/2 + (isolated vertices). With K components, C = K - P, and the index is 2K - P - 1.
 * K comes from propagating the least label along the edges, n times.
 */
const seaweedIndex: MathJSON = bindList(
  "cuts",
  cutPoints,
  bindList(
    "top",
    forEach(upTo(total), subtract(add(add(cutBefore("i"), min(where("cuts", atLeastValue("u", "i"), "u"))), 1), "i")),
    bindList(
      "degrees",
      forEach(
        upTo(total),
        subtract(add(["If", differ(at("i", "top"), "i"), 1, 0], ["If", differ(reflected("i"), "i"), 1, 0]), [
          "If",
          and(equals(at("i", "top"), reflected("i")), differ(at("i", "top"), "i")),
          1,
          0,
        ]),
      ),
      bindList(
        "labels",
        fold(
          upTo(total),
          upTo(total),
          forEach(upTo(total), ["Min", at("i", "a"), at(at("i", "top"), "a"), at(reflected("i"), "a")]),
        ),
        subtract(
          subtract(
            subtract(["Multiply", 2, count(upTo(total), equals(at("i", "labels"), "i"))], 1),
            count(upTo(total), equals(at("i", "degrees"), 0)),
          ),
          ["Divide", count(upTo(total), equals(at("i", "degrees"), 1)), 2],
        ),
      ),
    ),
  ),
);

/**
 * Dyck paths whose area sequence is at least the bounce path's, row by row. The bounce path of
 * the composition has the area sequence 0 .. c_1 - 1, 0 .. c_2 - 1, and so on. An area sequence
 * starts at 0 and rises by at most one a row, so the count carries, by area, the sequences so far.
 */
const dyckPathsAboveBouncePath: MathJSON = nonEmpty(
  bindList(
    "cuts",
    cutPoints,
    bindList("bounceAreas", forEach(upTo(total), subtract(subtract("i", 1), cutBefore("i"))), [
      "If",
      less(total, 2),
      1,
      floored([
        "Sum",
        fold(
          ["Range", 2, total, 1],
          forEach(upTo(total), ["If", equals("h", 1), 1, 0], "h"),
          forEach(
            upTo(total),
            [
              "If",
              atLeastValue(subtract("h", 1), at(visiting, "bounceAreas")),
              ["Sum", forEach(["Range", ["Max", subtract("h", 1), 1], total, 1], at("g", "a"), "g")],
              0,
            ],
            "h",
          ),
        ),
      ]),
    ]),
  ),
  1,
);

// ── parking functions and composition tableaux ───────────────────────────────────────────

/**
 * A parking function of size n has its inverse descent composition c exactly when the word of
 * its cars, read along diagonals, has the inverse with descents at the partial sums of c. The
 * parking functions' Frobenius characteristic is h_n[(n+1)X]/(n+1), and the RSK correspondence
 * turns h_n[(n+1)X] into the words of length n on 1 .. n+1, so the count is 1/(n+1) of the
 * words on 1 .. n+1 that fall inside each block of c and rise (weakly) between blocks. The list
 * carries, for each last letter, the words so far.
 */
const inverseDescentParkingFunctions: MathJSON = bindList("cuts", cutPoints, [
  "If",
  less(total, 2),
  1,
  [
    "Divide",
    floored([
      "Sum",
      fold(
        ["Range", 1, subtract(total, 1), 1],
        forEach(upTo(add(total, 1)), 1, "w"),
        forEach(
          upTo(add(total, 1)),
          [
            "Sum",
            forEach(
              where(
                upTo(add(total, 1)),
                ["If", greater(count("cuts", equals("c", "b"), "c"), 0), atMostValue("u", "w"), greater("u", "w")],
                "u",
              ),
              at("u", "a"),
              "u",
            ),
          ],
          "w",
        ),
      ),
    ]),
    add(total, 1),
  ],
]);

/**
 * Standard composition tableaux of the shape (Haglund, Luoto, Mason and van Willigenburg): rows
 * decrease left to right, the first column increases downwards, and the triple rule holds. The
 * entries go in as 1, 2, ..., so each row fills from its right end, and a state is how many
 * cells each row has so far (read as the digits of a number, row j's with weight the product of
 * the sizes before it). Row j may take its next cell, leaving m cells in the row, when
 * - m = 0 (the first column): the row above is full, and
 * - m > 0 (the triple rule, forbidding d < c < a for a, d above c's column pair): no row above
 *   has exactly m cells left.
 */
const standardCompositionTableaux: MathJSON = nonEmpty(
  bindList("radices", fold(x, list(1), ["Join", "a", list(["Multiply", ["Last", "a"], add("b", 1)])]), [
    "If",
    equals(total, 0),
    1,
    [
      "Last",
      fold(["Range", 1, subtract(["Last", "radices"], 1), 1], list(1), [
        "Join",
        "a",
        list(
          bindList(
            "placed",
            forEach(
              positions,
              [
                "Divide",
                subtract(["Mod", "b", at(add("j", 1), "radices")], ["Mod", "b", at("j", "radices")]),
                at("j", "radices"),
              ],
              "j",
            ),
            [
              "Sum",
              forEach(
                positions,
                [
                  "If",
                  and(atLeastValue(at("j", "placed"), 1), [
                    "If",
                    equals(subtract(at("j"), at("j", "placed")), 0),
                    [
                      "If",
                      equals("j", 1),
                      ["Equal", 1, 1],
                      equals(at(subtract("j", 1), "placed"), at(subtract("j", 1))),
                    ],
                    equals(
                      count(
                        positions,
                        and(
                          less("i", "j"),
                          equals(subtract(at("i"), at("i", "placed")), subtract(at("j"), at("j", "placed"))),
                        ),
                      ),
                      0,
                    ),
                  ]),
                  at(add(subtract("b", at("j", "radices")), 1), "a"),
                  0,
                ],
                "j",
              ),
            ],
          ),
        ),
      ]),
    ],
  ]),
  1,
);

// ── the Nakayama algebra of the composition ──────────────────────────────────────────────

/**
 * The Kupisch series of the linear Nakayama algebra of the composition: each part c gives
 * c + 1, c, ..., 2, and the series ends with 1. A module is (top vertex x, length y); it is
 * projective when y is the series' entry at x, and otherwise its syzygy is (x + y, entry - y).
 * Vertices count from 0, and there are n + 1 of them.
 */
const kupischSeries: MathJSON = [
  "Join",
  fold(x, list(), ["Join", "a", forEach(upTo("b"), subtract(add("b", 2), "t"), "t")]),
  list(1),
];
/** The projective dimension of the module (x0, y0): syzygies taken until the module is projective. */
const projectiveDimension = (x0: MathJSON, y0: MathJSON): MathJSON =>
  at(
    3,
    fold(
      upTo(add(total, 1)),
      list(x0, y0, 0),
      bindList(
        "entry",
        at(add(carried(1), 1), "series"),
        [
          "If",
          equals(carried(2), "entry"),
          list(carried(1), carried(2), carried(3)),
          list(add(carried(1), carried(2)), subtract("entry", carried(2)), add(carried(3), 1)),
        ],
        "integer",
      ),
    ),
  );
/** The global dimension: the largest projective dimension of a simple module. */
const nakayamaGlobalDimension: MathJSON = nonEmpty(
  bindList("series", kupischSeries, [
    "Max",
    forEach(upTo(add(total, 1)), projectiveDimension(subtract("v", 1), 1), "v"),
  ]),
);

// ── quasisymmetric change of basis ───────────────────────────────────────────────────────

/**
 * The dual immaculate function of the composition is the sum, over immaculate tableaux of its
 * shape, of M at the tableau's content: rows weakly increase, the first column strictly
 * increases, and the content (how often 1, 2, ... occur) has no gaps. So the column sum is the
 * count of such tableaux. With entries in 1 .. m, row i takes its first entry a, then a weakly
 * increasing row from m - a + 1 values, in C(m - a + c_i - 1, c_i - 1) ways, and the first
 * entries climb. The state lists, for p = a + 1 (the virtual a = 0 starts it), the ways so far.
 * Fillings using exactly j values follow by inclusion-exclusion, so the count with a gapless
 * content is the sum over m of the fillings in 1 .. m times the sum over k from m to n of
 * (-1)^(k-m) C(k, m).
 */
const fillingsWithin: MathJSON = [
  "Sum",
  fold(
    x,
    forEach(upTo(add("m", 1)), ["If", equals("p", 1), 1, 0], "p"),
    forEach(
      upTo(add("m", 1)),
      [
        "If",
        equals("p", 1),
        0,
        [
          "Multiply",
          ["Binomial", add(subtract("m", "p"), visiting), subtract(visiting, 1)],
          ["Sum", forEach(["Range", 1, ["Max", subtract("p", 1), 1]], at("q", "a"), "q")],
        ],
      ],
      "p",
    ),
  ),
];
const dualImmaculateColumnSum: MathJSON = nonEmpty(
  sumOver(
    upTo(total),
    [
      "Multiply",
      fillingsWithin,
      sumOver(["Range", "m", total], ["Multiply", ["Power", -1, subtract("k", "m")], ["Binomial", "k", "m"]], "k"),
    ],
    "m",
  ),
);

export const COMPOSITION_STATISTICS: readonly Definition[] = [
  stat("LargestPart", "The largest part.", nonEmpty(max(x))),
  stat("FirstPart", "The first part.", nonEmpty(at(1))),
  stat("LastPart", "The last part.", nonEmpty(["Last", x])),
  stat("SmallestPart", "The smallest part.", nonEmpty(min(x))),
  stat("DistinctParts", "How many distinct part sizes occur.", ["Length", ["Unique", x]]),
  stat("LargestMultiplicity", "The largest number of parts of one size.", nonEmpty(max(multiplicities))),
  stat(
    "SmallestMultiplicity",
    "The smallest number of parts of one size, among the sizes that occur.",
    nonEmpty(min(multiplicities)),
  ),
  stat(
    "DistinctMultiplicities",
    "How many different multiplicities the part sizes have.",
    nonEmpty(["Length", ["Unique", multiplicities]]),
  ),
  stat("Ascents", "Positions i with c(i) < c(i+1).", hasPair(count(adjacent, risesAfter))),
  stat("WeakDescentCount", "Positions i with c(i) >= c(i+1).", hasPair(count(adjacent, atLeastValue(here, next)))),
  stat(
    "Peaks",
    "Interior positions with c(i-1) < c(i) > c(i+1).",
    hasTriple(count(interior, and(less(previous, here), greater(here, next)))),
  ),
  stat(
    "Inversions",
    "Pairs i < j with c(i) > c(j).",
    hasPair(sumOver(adjacent, count(["Range", add("i", 1), k, 1], greater(here, at("j")), "j"))),
  ),
  stat(
    "CompositionMajorIndex",
    "The sum of the descents of the composition: its partial sums, the total left out.",
    hasPair(sumOver(adjacent, sumOver(["Range", 1, "i"], at("j"), "j"))),
    "Reads the composition as a descent set, as FindStat's St000008 does. `MajorIndex` reads it as a word.",
  ),
  stat(
    "MajorIndex",
    "The sum of the positions i with c(i) > c(i+1).",
    hasPair(["Sum", where(adjacent, fallsAfter)]),
    "MacMahon's major index of the composition regarded as a word.",
  ),
  {
    ...stat(
      "WeakMajorIndex",
      "The sum of the positions i with c(i) >= c(i+1).",
      hasPair(["Sum", where(adjacent, atLeastValue(here, next))]),
      "Reads the composition as a word, so it stands on a bare list too.",
    ),
    alsoOnList: true,
  },
  stat(
    "AbsoluteVariation",
    "The sum of |c(i+1) - c(i)|.",
    hasPair(sumOver(adjacent, ["Abs", subtract(next, here)])),
    "Archibald, Knopfmacher and Mansour, Variation statistics on compositions.",
  ),
  stat(
    "Variation",
    "The signed sum of c(i+1) - c(i): the last part less the first.",
    hasPair(sumOver(adjacent, subtract(next, here))),
    "Archibald, Knopfmacher and Mansour, Variation statistics on compositions.",
  ),
  stat(
    "AscentVariation",
    "The sum of c(i+1) - c(i) over the positions where it is positive.",
    hasPair(sumOver(adjacent, rise)),
    "Archibald, Knopfmacher and Mansour, Variation statistics on compositions. FindStat titles it the descent variation; it sums the rises, which is equidistributed with the sum of the falls under reversal.",
  ),
  stat(
    "StrongRecordCount",
    "Parts greater than every part before: the first part and each new maximum.",
    nonEmpty(["Count", strongRecords]),
    "Knopfmacher and Mansour, Record statistics in integer compositions.",
  ),
  stat(
    "WeakRecordCount",
    "Parts at least as great as every part before.",
    nonEmpty(["Count", weakRecords]),
    "Knopfmacher and Mansour, Record statistics in integer compositions.",
  ),
  stat(
    "StrongRecordPositionSum",
    "The sum of the positions of the strong records.",
    nonEmpty(["Sum", strongRecords]),
    "Knopfmacher and Mansour, Record statistics in integer compositions.",
  ),
  stat(
    "WeakRecordPositionSum",
    "The sum of the positions of the weak records.",
    nonEmpty(["Sum", weakRecords]),
    "Knopfmacher and Mansour, Record statistics in integer compositions.",
  ),
  stat(
    "LongestWeaklyIncreasingSubsequence",
    "The length of a longest weakly increasing subsequence of the parts.",
    nonEmpty(["Count", piles(atMostValue("t", visiting))]),
    "The first row of the RSK shape of the composition as a word.",
  ),
  stat(
    "LongestDecreasingSubsequence",
    "The length of a longest strictly decreasing subsequence of the parts.",
    nonEmpty(["Count", piles(greater("t", visiting))]),
    "The number of rows of the RSK shape of the composition as a word (Greene-Kleitman).",
  ),
  stat(
    "LongestStaircase",
    "The greatest l with parts at positions i_1 < ... < i_l such that part i_m is at least m.",
    nonEmpty(fold(x, 0, ["If", greater(visiting, "a"), add("a", 1), "a"])),
    "Skandera, An Eulerian partner for inversions (Definition 3.1): taking each part that exceeds the staircase so far is optimal.",
  ),
  stat(
    "ConstantRunCount",
    "Maximal runs of equal parts.",
    nonEmpty(add(1, hasPair(count(adjacent, differ(next, here))))),
    "Hopkins, Shattuck and Sills, Parts and subword patterns in compositions.",
  ),
  stat("LongestConstantRun", "The length of the longest run of equal parts.", nonEmpty(max(runLengths))),
  stat("ShortestConstantRun", "The length of the shortest run of equal parts.", nonEmpty(min(runLengths))),
  stat(
    "BargraphPeakCount",
    "Peaks of the bargraph with bars of these heights: a rise, level steps, then a fall.",
    nonEmpty(bargraphPeaks),
    "Deutsch and Elizalde, A bijection between bargraphs and Dyck paths.",
  ),
  stat(
    "BargraphHalfPerimeter",
    "Up steps plus horizontal steps of the bargraph.",
    nonEmpty(add(add(k, at(1)), hasPair(sumOver(adjacent, rise)))),
    "Deutsch and Elizalde, A bijection between bargraphs and Dyck paths, and FindStat call it the semiperimeter.",
  ),
  stat(
    "BargraphUpStepCount",
    "Up steps of the bargraph.",
    nonEmpty(upSteps),
    "Deutsch and Elizalde, A bijection between bargraphs and Dyck paths.",
  ),
  stat(
    "BargraphValleyHeightSum",
    "The sum of the heights of the valleys of the bargraph.",
    nonEmpty(valleyHeights),
    "A valley is a fall, level steps, then a rise (Deutsch and Elizalde, A bijection between bargraphs and Dyck paths).",
  ),
  stat(
    "AsymmetryDegree",
    "Pairs of mirror positions holding different parts.",
    nonEmpty(count(positions, and(less("i", subtract(add(k, 1), "i")), differ(at("i"), mirrored)))),
  ),
  stat(
    "PartsEqualToReversedPart",
    "Positions i where the part equals the part at the mirror position.",
    nonEmpty(count(positions, equals(at("i"), mirrored))),
    "Andrews, Just and Simay, Anti-palindromic compositions.",
  ),
  stat(
    "RotationOrbitSize",
    "The number of distinct compositions obtained by rotating the parts.",
    nonEmpty([
      "Min",
      where(
        positions,
        equals(count(positions, differ(at("i"), at(add(["Mod", subtract(add("i", "r"), 1), k], 1))), "i"), 0),
        "r",
      ),
    ]),
  ),
  stat(
    "StandardImmaculateTableauCount",
    "Standard immaculate tableaux of the shape: fillings of 1 .. n increasing along the rows and down the first column.",
    immaculateTableaux,
    "Berg, Bergeron, Saliola, Serrano and Zabrocki, A lift of the Schur and Hall-Littlewood bases to non-commutative symmetric functions (Proposition 3.13).",
  ),
  stat(
    "StandardRibbonTableauCount",
    "Standard fillings of the ribbon whose rows have these lengths: the permutations of 1 .. n with these partial sums as their descents.",
    ribbonTableaux,
    "Stanley, Enumerative Combinatorics, volume 1, section 1.4: Proposition 1.4.1 counts permutations whose descents lie in a set, and inclusion-exclusion over it gives this count. FindStat cites the formula as section 14.4.",
  ),
  stat("RibbonCornerCount", "Corners of the ribbon: its inner and outer corners together.", ribbonCorners),
  stat(
    "SeaweedIndex",
    "Twice the cycles plus the paths, less one, of the meander of the composition over the single block: the index of the maximal parabolic seaweed algebra.",
    nonEmpty(seaweedIndex),
    "Dergachev and Kirillov, Index of Lie algebras of seaweed type. FindStat's code builds the meander as a simple graph, so two dots joined by an arc above and one below are a path, not a cycle; the definition follows the code, not the prose. The empty composition is outside FindStat's rows.",
  ),
  stat(
    "DyckPathsAboveBouncePathCount",
    "Dyck paths of semilength n that stay weakly above the bounce path of the composition: their area sequences are at least 0 .. c_1 - 1, 0 .. c_2 - 1, ....",
    dyckPathsAboveBouncePath,
    "FindStat titles it the parabolic noncrossing partitions indexed by the composition (Mühle and Williams) and also the size of a nu-Tamari lattice (Bergeron, Ceballos and Pilaud); its code counts these Dyck paths.",
  ),
  stat(
    "InverseDescentParkingFunctionCount",
    "Parking functions of size n whose diagonal reading word has the inverse descent composition c.",
    inverseDescentParkingFunctions,
    "FindStat's St000285 is the size of that preimage; the count here is the equivalent word count, 1/(n+1) of the words on 1 .. n+1 that fall within each block and rise between blocks.",
  ),
  stat(
    "StandardCompositionTableauCount",
    "Standard composition tableaux of the shape: fillings of 1 .. n with rows decreasing, the first column increasing, and the triple rule.",
    standardCompositionTableaux,
    "Luoto, Mykytiuk and van Willigenburg, An introduction to quasisymmetric Schur functions (Definition 4.2.6).",
  ),
  stat(
    "CompositionNakayamaGlobalDimension",
    "The global dimension of the linear Nakayama algebra whose Kupisch series is c_1 + 1, ..., 2, c_2 + 1, ..., 2, ..., 1.",
    nakayamaGlobalDimension,
    "FindStat's St001235 (its Comp-Nakayama algebra): the largest projective dimension of a simple module.",
  ),
  stat(
    "DualImmaculateMonomialColumnSum",
    "The sum of the entries in the column of the composition in the matrix from the dual immaculate to the monomial quasisymmetric functions.",
    dualImmaculateColumnSum,
    "FindStat's St000817: the number of immaculate tableaux of the shape with any gapless content (Berg, Bergeron, Saliola, Serrano and Zabrocki).",
  ),
];
