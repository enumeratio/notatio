// Poset statistics, over `_x` = the list of lower covers: entry i is the ascending list of the elements that i covers, each
// less than i (a natural labeling), the relation transitively reduced. In a natural labeling x < y in the poset only when
// x < y as numbers. Every definition answers the poset with no elements first: an interpreted `At` of a literal empty list
// is an error.

import { fold as tableFold, map as tableMap, upTo as tableUpTo } from "../../collections/src/families/tables.ts";
import type { Definition, MathJSON } from "../../src/statistics/types.ts";
import { bind } from "../../src/statistics/vocabulary.ts";

/** The table builders, as this file's `MathJSON`. */
const fold = (...args: Parameters<typeof tableFold>): MathJSON => tableFold(...args) as MathJSON;
const map = (...args: Parameters<typeof tableMap>): MathJSON => tableMap(...args) as MathJSON;
const upTo = (...args: Parameters<typeof tableUpTo>): MathJSON => tableUpTo(...args) as MathJSON;

const on = "Poset";
const stat = (head: string, summary: string, expr: MathJSON, note?: string): Definition => ({
  head,
  on,
  summary,
  expr,
  ...(note ? { note } : {}),
});

const subject: MathJSON = "_x";
const elements: MathJSON = upTo(1, "n");
const one = (test: MathJSON): MathJSON => ["If", test, 1, 0];
const equals = (a: MathJSON, b: MathJSON): MathJSON => ["Equal", a, b];
const times = (...factors: MathJSON[]): MathJSON => ["Multiply", ...factors];
const plus = (...terms: MathJSON[]): MathJSON => ["Add", ...terms];
const minus = (a: MathJSON, b: MathJSON): MathJSON => ["Subtract", a, b];
const lowerCovers = (element: MathJSON): MathJSON => ["At", subject, element];
/** The sum of `body` over `over`, floored at 0 so the compiler types it real; the sums here count. */
const total = (body: MathJSON, variable: string, over: MathJSON = elements): MathJSON => [
  "Max",
  ["Sum", map(body, variable, over)],
  0,
];
const greatest = (body: MathJSON, variable: string, over: MathJSON = elements): MathJSON => [
  "Max",
  map(body, variable, over),
];

/** `body` with `n` the element count; the poset with no elements gives `otherwise`. */
export const withPoset = (body: MathJSON, otherwise: MathJSON = 0): MathJSON => [
  "If",
  equals(["Length", subject], 0),
  otherwise,
  bind("n", ["Length", subject], body, "integer"),
];

/**
 * The strict order as a flat row-major list of n² entries, built a row at a time: entry (i - 1) n + j is 1 when j < i in the
 * poset, which is when j is a lower cover of i or lies below one of them (those rows are already built).
 */
const lowerEntry: MathJSON = ["At", "acc", ["Add", ["Multiply", ["Subtract", "c", 1], "n"], "j"]];
/** The strict order of the poset held in `of`, read with `n` its element count. */
export const strictOrderOf = (of: MathJSON): MathJSON => {
  const covers = (element: MathJSON): MathJSON => ["At", of, element];
  const relationCell: MathJSON = [
    "If",
    ["Or", ["Contains", covers("i"), "j"], ["Greater", ["Max", ["Sum", map(lowerEntry, "c", covers("i"))], 0], 0]],
    1,
    0,
  ];
  return fold(["Join", "acc", map(relationCell, "j", elements)], "acc", "i", ["List"], elements, "list<integer>");
};
const strictOrder: MathJSON = strictOrderOf(subject);
/** `body` with `below` the strict order; read inside `withPoset`. */
export const withRelation = (body: MathJSON): MathJSON => bind("below", strictOrder, body, "list<integer>");

/** 1 when a < b in the poset. */
const less = (a: MathJSON, b: MathJSON): MathJSON => ["At", "below", plus(times(minus(b, 1), "n"), a)];
/** 1 when a ≤ b. */
const atMost = (a: MathJSON, b: MathJSON): MathJSON => ["If", equals(a, b), 1, less(a, b)];
const comparable = (a: MathJSON, b: MathJSON): MathJSON => plus(atMost(a, b), less(b, a));

/** The upper covers of each element: how many elements have it as a lower cover. */
const upperCoverCount = (element: MathJSON): MathJSON => total(one(["Contains", lowerCovers("k"), element]), "k");

/** A list over the elements 1 .. n, built an element at a time from the entries `acc` already built. */
const accumulate = (entry: MathJSON): MathJSON =>
  fold(["Join", "acc", ["List", entry]], "acc", "i", ["List"], elements, "list<integer>");
const entryOf = (element: MathJSON): MathJSON => ["At", "acc", element];

const noLowerCovers = (element: MathJSON): MathJSON => equals(["Length", lowerCovers(element)], 0);
const noUpperCovers = (element: MathJSON): MathJSON => equals(upperCoverCount(element), 0);

/** The size of the longest chain ending at each element. */
const chainSizes: MathJSON = accumulate(
  plus(1, ["Max", ["Join", ["List", 0], map(entryOf("c"), "c", lowerCovers("i"))]]),
);
/** The paths from a minimal element up to each element along covers: the maximal chains of its principal ideal. */
const chainsEndingAt: MathJSON = accumulate(["If", noLowerCovers("i"), 1, total(entryOf("c"), "c", lowerCovers("i"))]);
/** The fewest elements of a chain from a minimal element up to each element along covers. */
const shortestChains: MathJSON = accumulate([
  "If",
  noLowerCovers("i"),
  1,
  plus(1, ["Min", map(entryOf("c"), "c", lowerCovers("i"))]),
]);

/** Each element's component, as its least element, built by merging at each element the components of its lower covers. */
const componentLeaders: MathJSON = fold(
  map(
    [
      "If",
      [
        "Or",
        equals("k", "i"),
        ["Greater", total(one(equals(["At", "comp", "c"], ["At", "comp", "k"])), "c", lowerCovers("i")), 0],
      ],
      ["If", noLowerCovers("i"), "i", ["Min", map(["At", "comp", "c"], "c", lowerCovers("i"))]],
      ["At", "comp", "k"],
    ],
    "k",
    elements,
  ),
  "comp",
  "i",
  elements,
  elements,
  "list<integer>",
);

/** The subsets of the elements as bitmasks: bit v - 1 of the mask is element v. */
const masks: MathJSON = ["Range", 0, minus(["Power", 2, "n"], 1)];
const hasBit = (mask: MathJSON, element: MathJSON): MathJSON => [
  "GreaterEqual",
  ["Mod", mask, ["Power", 2, element]],
  ["Power", 2, minus(element, 1)],
];
const inMask = (mask: MathJSON, element: MathJSON): MathJSON => one(hasBit(mask, element));
/** The elements of the subset. */
const maskSize = (mask: MathJSON): MathJSON => total(inMask(mask, "v"), "v");
/** The related pairs inside the subset. */
const relatedInside = (mask: MathJSON): MathJSON =>
  total(total(times(inMask(mask, "a"), inMask(mask, "b"), less("a", "b")), "b"), "a");
/** The pairs inside the subset that are not related. */
const unrelatedInside = (mask: MathJSON): MathJSON =>
  total(
    total(times(inMask(mask, "a"), inMask(mask, "b"), one(["Less", "a", "b"]), minus(1, less("a", "b"))), "b"),
    "a",
  );
const isAntichain = (mask: MathJSON): MathJSON => equals(relatedInside(mask), 0);
const isChain = (mask: MathJSON): MathJSON => equals(unrelatedInside(mask), 0);

/** The elements x ≤ z ≤ y. */
const intervalSize = (x: MathJSON, y: MathJSON): MathJSON => total(times(atMost(x, "z"), atMost("z", y)), "z");

/**
 * The Möbius function from each element x, by its recurrence in index order: μ(x, x) = 1, μ(x, y) = 0 unless x < y, and
 * otherwise μ(x, y) = −Σ μ(x, z) over x ≤ z < y. Row x holds μ(x, y) for y = 1 .. n.
 */
const moebiusRow = (x: MathJSON): MathJSON =>
  fold(
    [
      "Join",
      "acc",
      [
        "List",
        [
          "If",
          equals("i", x),
          1,
          [
            "If",
            equals(less(x, "i"), 0),
            0,
            fold(
              minus("s", times(atMost(x, "z"), less("z", "i"), ["At", "acc", "z"])),
              "s",
              "z",
              0,
              upTo(1, minus("i", 1)),
              "integer",
            ),
          ],
        ],
      ],
    ],
    "acc",
    "i",
    ["List"],
    elements,
    "list<integer>",
  );
const moebiusRows: MathJSON = fold(
  ["Join", "rows", ["List", moebiusRow("x")]],
  "rows",
  "x",
  ["List"],
  elements,
  "list<list<integer>>",
);
const withMoebius = (body: MathJSON): MathJSON => bind("mu", moebiusRows, body, "list<list<integer>>");
const moebiusValue = (x: MathJSON, y: MathJSON): MathJSON => ["At", ["At", "mu", x], y];

/** The ordinal summands end where an initial segment lies below everything after it: 1 at position k when it does (and at n). */
const summandEnds: MathJSON = map(
  [
    "If",
    equals("k", "n"),
    1,
    one(
      equals(
        total(total(less("a", "b"), "a", upTo(1, "k")), "b", upTo(plus("k", 1), "n")),
        times("k", minus("n", "k")),
      ),
    ),
  ],
  "k",
  elements,
);
const withSummandEnds = (body: MathJSON): MathJSON => bind("ends", summandEnds, body, "list<integer>");

/** The elements of the largest antichain. */
const width: MathJSON = greatest(times(one(isAntichain("m")), maskSize("m")), "m", masks);

const NO_ELEMENTS = (value: string): string => `The poset with no elements gives ${value}.`;

export const POSET_STATISTICS: readonly Definition[] = [
  stat("ElementCount", "The elements of the poset.", withPoset("n"), `FindStat's St000189. ${NO_ELEMENTS("0")}`),
  stat(
    "MinimalElementCount",
    "The elements that cover nothing.",
    withPoset(total(one(noLowerCovers("v")), "v")),
    `FindStat's St000068. ${NO_ELEMENTS("0")}`,
  ),
  stat(
    "MaximalElementCount",
    "The elements that nothing covers.",
    withPoset(total(one(noUpperCovers("v")), "v")),
    `FindStat's St000069. ${NO_ELEMENTS("0")}`,
  ),
  stat(
    "CoverRelationCount",
    "The pairs where one element covers another: the edges of the Hasse diagram.",
    withPoset(total(["Length", lowerCovers("v")], "v")),
    `FindStat's St000327. ${NO_ELEMENTS("0")}`,
  ),
  stat(
    "RelationCount",
    "The pairs x ≤ y: the elements and the pairs x < y.",
    withPoset(withRelation(plus("n", ["Max", ["Sum", "below"], 0]))),
    `FindStat's St000639. ${NO_ELEMENTS("0")}`,
  ),
  stat(
    "PosetComponentCount",
    "The connected components of the Hasse diagram.",
    withPoset(bind("leaders", componentLeaders, total(one(equals(["At", "leaders", "v"], "v")), "v"), "list<integer>")),
    `FindStat's St000181. ${NO_ELEMENTS("0")}`,
  ),
  stat(
    "PosetRank",
    "The length of the longest chain: one less than the elements it holds.",
    withPoset(bind("sizes", chainSizes, minus(["Max", "sizes"], 1), "list<integer>"), -1),
    `FindStat's St000080. ${NO_ELEMENTS("-1")}`,
  ),
  stat(
    "PosetHeight",
    "The elements of the longest chain.",
    withPoset(bind("sizes", chainSizes, ["Max", "sizes"], "list<integer>")),
    `FindStat's St000528. ${NO_ELEMENTS("0")}`,
  ),
  stat(
    "PosetWidth",
    "The elements of the largest antichain.",
    withPoset(withRelation(width)),
    `FindStat's St000527. ${NO_ELEMENTS("0")}`,
  ),
  stat(
    "ElementCountMinusWidth",
    "The elements less the width.",
    withPoset(withRelation(minus("n", width))),
    `FindStat's St001668. ${NO_ELEMENTS("0")}`,
  ),
  stat(
    "OrdinalSummandCount",
    "The summands of the longest decomposition of the poset as an ordinal sum.",
    withPoset(withRelation(withSummandEnds(["Max", ["Sum", "ends"], 0]))),
    `FindStat's St000717. The summands end where an initial segment lies below everything after it. ${NO_ELEMENTS("0")}`,
  ),
  stat(
    "LargestOrdinalSummandSize",
    "The most elements in a summand of the longest decomposition of the poset as an ordinal sum.",
    withPoset(
      withRelation(
        withSummandEnds(
          bind(
            "runs",
            fold(
              [
                "List",
                ["If", equals(["At", "ends", "k"], 1), 0, plus(["At", "runs_so_far", 1], 1)],
                ["Max", ["At", "runs_so_far", 2], plus(["At", "runs_so_far", 1], 1)],
              ],
              "runs_so_far",
              "k",
              ["List", 0, 0],
              elements,
              "list<integer>",
            ),
            ["At", "runs", 2],
            "list<integer>",
          ),
        ),
      ),
    ),
    `FindStat's St001268. The summands end where an initial segment lies below everything after it. ${NO_ELEMENTS("0")}`,
  ),
  stat(
    "MaximumLowerCoverCount",
    "The most elements covered by one element.",
    withPoset(greatest(["Length", lowerCovers("v")], "v")),
    `FindStat's St000846, whose title says the elements covering one element: its rows count the elements a single element covers. ${NO_ELEMENTS("0")}`,
  ),
  stat(
    "MaximumUpperCoverCount",
    "The most elements covering one element.",
    withPoset(greatest(upperCoverCount("v"), "v")),
    `FindStat's St000845, whose title says the elements covered by one element: its rows count the elements covering a single element. ${NO_ELEMENTS("0")}`,
  ),
  stat(
    "IncomparablePairCount",
    "The pairs of elements, neither below the other.",
    withPoset(withRelation(total(total(times(one(["Less", "a", "b"]), minus(1, less("a", "b"))), "b"), "a"))),
    `FindStat's St001397. ${NO_ELEMENTS("0")}`,
  ),
  stat(
    "IncomparableTripleCount",
    "The sets of three elements, no two of them comparable.",
    withPoset(
      withRelation(
        total(
          total(
            total(
              times(
                one(["Less", "a", "b"]),
                one(["Less", "b", "c"]),
                minus(1, less("a", "b")),
                minus(1, less("b", "c")),
                minus(1, less("a", "c")),
              ),
              "c",
            ),
            "b",
          ),
          "a",
        ),
      ),
    ),
    `FindStat's St001396. ${NO_ELEMENTS("0")}`,
  ),
  stat(
    "VSubsetCount",
    "The sets of three elements with one below the other two, which are incomparable.",
    withPoset(
      withRelation(
        total(
          total(
            total(times(one(["Less", "y", "z"]), less("x", "y"), less("x", "z"), minus(1, less("y", "z"))), "z"),
            "y",
          ),
          "x",
        ),
      ),
    ),
    `FindStat's St001398. The bottom need not be covered by the other two. ${NO_ELEMENTS("0")}`,
  ),
  stat(
    "LargestIntervalSize",
    "The most elements in an interval [x, y].",
    withPoset(
      withRelation(["Max", map(greatest(times(atMost("x", "y"), intervalSize("x", "y")), "y"), "x", elements)]),
    ),
    `FindStat's St001717. An interval [x, y] holds the elements z with x ≤ z ≤ y. ${NO_ELEMENTS("0")}`,
  ),
  stat(
    "OpenIntervalCount",
    "The pairs x < y with an element strictly between them.",
    withPoset(withRelation(total(total(times(less("x", "y"), one(["Greater", intervalSize("x", "y"), 2])), "y"), "x"))),
    `FindStat's St001718. ${NO_ELEMENTS("0")}`,
  ),
  stat(
    "PotentialCoverCount",
    "The ordered pairs of incomparable elements x, y such that adding x < y adds no other relation.",
    withPoset(
      withRelation(
        total(
          total(
            times(
              one(equals(comparable("x", "y"), 0)),
              one(
                equals(
                  total(total(times(atMost("a", "x"), atMost("y", "b"), minus(1, atMost("a", "b"))), "b"), "a"),
                  1,
                ),
              ),
            ),
            "y",
          ),
          "x",
        ),
      ),
    ),
    `FindStat's St001902. Adding x < y adds the pairs a < b with a ≤ x and y ≤ b that did not hold; one pair is added exactly when that count is 1. ${NO_ELEMENTS("0")}`,
  ),
  stat(
    "PrincipalFilterSizeProduct",
    "The product, over the elements, of the number of elements at or above each.",
    withPoset(withRelation(["Product", map(total(atMost("x", "y"), "y"), "x", elements)]), 1),
    `FindStat's St001813. ${NO_ELEMENTS("1, the empty product")}`,
  ),
  stat(
    "MoebiusFunctionSum",
    "The sum of the Möbius function μ(x, y) over the pairs x ≤ y.",
    withPoset(
      withRelation(withMoebius(["Sum", map(["Sum", map(moebiusValue("p", "q"), "q", elements)], "p", elements)])),
    ),
    `FindStat's St000914. ${NO_ELEMENTS("0")}`,
  ),
  stat(
    "MaximumMoebiusMagnitude",
    "The largest |μ(x, y)| of the Möbius function.",
    withPoset(withRelation(withMoebius(["Max", map(greatest(["Abs", moebiusValue("p", "q")], "q"), "p", elements)]))),
    `FindStat's St001890. The pairs x = y give 1. ${NO_ELEMENTS("0")}`,
  ),
  stat(
    "OrderPolytopeFacetCount",
    "The facets of the order polytope: one for each cover, each minimal element and each maximal element.",
    withPoset(
      plus(
        total(["Length", lowerCovers("v")], "v"),
        total(one(noLowerCovers("v")), "v"),
        total(one(noUpperCovers("v")), "v"),
      ),
    ),
    `FindStat's St000104. ${NO_ELEMENTS("0")}`,
  ),
  stat(
    "ChainCount",
    "The sets of pairwise comparable elements, the empty set included.",
    withPoset(withRelation(total(one(isChain("m")), "m", masks)), 1),
    `FindStat's St000180. ${NO_ELEMENTS("1, the empty chain")}`,
  ),
  stat(
    "AntichainCount",
    "The sets of pairwise incomparable elements, the empty set included.",
    withPoset(withRelation(total(one(isAntichain("m")), "m", masks)), 1),
    `FindStat's St000070. ${NO_ELEMENTS("1, the empty antichain")}`,
  ),
  stat(
    "MaximalChainCount",
    "The chains that no element can be added to: the paths up the Hasse diagram from a minimal to a maximal element.",
    withPoset(
      bind("paths", chainsEndingAt, total(times(one(noUpperCovers("v")), ["At", "paths", "v"]), "v"), "list<integer>"),
      1,
    ),
    `FindStat's St000071. ${NO_ELEMENTS("1, the empty chain")}`,
  ),
  stat(
    "ShortestMaximalChainSize",
    "The fewest elements in a maximal chain.",
    withPoset(
      bind(
        "shortest",
        shortestChains,
        ["Min", map(["If", noUpperCovers("v"), ["At", "shortest", "v"], plus("n", 1)], "v", elements)],
        "list<integer>",
      ),
    ),
    `FindStat's St000906, whose title says the length of the chain: its rows count the elements of the chain, one more than the covers. ${NO_ELEMENTS("0")}`,
  ),
];
