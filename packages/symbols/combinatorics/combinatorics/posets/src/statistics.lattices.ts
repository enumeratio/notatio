// Lattice statistics, on the poset carrier: `_x` is the list of lower covers (statistics.ts). A lattice is a poset whose
// every pair has a join and a meet; in a natural labeling its bottom is element 1, its top is element n, and the join of a and
// b is the least-labeled common upper bound (the meet, the greatest-labeled common lower bound). Each statistic is defined
// for a lattice and carries a `where` (`IsLattice` and the sizes it is answered on), so on any other poset the call stays
// unevaluated. A body reads the lattice without checking it. A statistic of counts answers the poset with no elements.

import type { Definition, MathJSON } from "../../src/statistics/types.ts";
import { bind } from "../../src/statistics/vocabulary.ts";
import {
  accumulate,
  atMost,
  atMostElements,
  ELEMENT_LIMIT,
  chainSizes,
  comparable,
  elements,
  equals,
  fold,
  greatest,
  inMask,
  less,
  lowerCovers,
  map,
  masks,
  minus,
  moebiusRow,
  noLowerCovers,
  one,
  plus,
  times,
  total,
  upperCoverCount,
  withJoins,
  withLattice,
  withMeets,
  withPoset,
  withRelation,
  POSET_STATISTICS,
} from "./statistics.ts";

const on = "Poset";
const subject: MathJSON = "_x";

/**
 * The lattices with at least `least` elements (where FindStat has rows, or the empty poset where the count of nothing is
 * answered) and, when given, at most `most`. A `where` reads `_x` unwrapped, the list of lower covers, and `IsLattice` takes the
 * poset, so the subject is wrapped again. The upper bound comes first, so a poset too large is not tested.
 */
const latticeWhere = (least: number, most?: number): MathJSON => [
  "And",
  ...(most === undefined ? [] : [atMostElements(most)]),
  ["IsLattice", ["Poset", subject]],
  ["GreaterEqual", ["Length", subject], least],
];

const join = (a: MathJSON, b: MathJSON): MathJSON => ["At", "joins", plus(times(minus(a, 1), "n"), b)];
const meet = (a: MathJSON, b: MathJSON): MathJSON => ["At", "meets", plus(times(minus(a, 1), "n"), b)];
/** 1 when the two differ. */
const differ = (a: MathJSON, b: MathJSON): MathJSON => minus(1, one(equals(a, b)));
const isZero = (count: MathJSON): MathJSON => equals(count, 0);
const hasNone = (count: MathJSON): MathJSON => one(isZero(count));
const bottom = 1;
const top: MathJSON = "n";
const oneLowerCover = (element: MathJSON): MathJSON => equals(["Length", lowerCovers(element)], 1);
const isCoverOf = (upper: MathJSON, lower: MathJSON): MathJSON => one(["Contains", lowerCovers(upper), lower]);
/** The sum of `body` over the elements `a` and `b`. */
const overPairs = (body: MathJSON, a = "a", b = "b"): MathJSON => total(total(body, b), a);

/** 1 when `x` has a complement: some y with x ∧ y the bottom and x ∨ y the top. */
const complemented = (x: MathJSON): MathJSON =>
  one(["Greater", total(times(one(equals(meet(x, "y"), bottom)), one(equals(join(x, "y"), top))), "y"), 0]);

/** The ways to take r from {e, p, q} (u and v the others) that break distributivity of the sublattice they generate. */
const neutralBreaks = (e: MathJSON, p: MathJSON, q: MathJSON): MathJSON => {
  const broken = (u: MathJSON, v: MathJSON, r: MathJSON): MathJSON => [
    "Max",
    differ(meet(join(u, v), r), join(meet(u, r), meet(v, r))),
    differ(join(meet(u, v), r), meet(join(u, r), join(v, r))),
  ];
  return plus(broken(p, q, e), broken(e, q, p), broken(e, p, q));
};
/** 1 when e is neutral: no p, q break any of the three ways. */
const neutral = (e: MathJSON): MathJSON => hasNone(overPairs(neutralBreaks(e, "p", "q"), "p", "q"));

const withNeutral = (body: MathJSON): MathJSON =>
  bind("neutral", map(neutral("e"), "e", elements), body, "list<integer>");
/** 1 when e is neutral and has a complement. */
const central = (e: MathJSON): MathJSON => times(["At", "neutral", e], complemented(e));
const withCentral = (body: MathJSON): MathJSON =>
  withNeutral(bind("central", map(central("c"), "c", elements), body, "list<integer>"));
/** The central elements above the bottom with no central element above the bottom below them: the atoms of the center. */
const centerRank: MathJSON = total(
  times(
    ["At", "central", "v"],
    one(["Greater", "v", bottom]),
    hasNone(total(times(["At", "central", "w"], one(["Greater", "w", bottom]), less("w", "v")), "w")),
  ),
  "v",
);

/**
 * 1 when e → j is a step of a small-interval chain: e < j and j is the join of the upper covers of e below it. That join is
 * j when no z above all of them lies strictly below j.
 */
const isStep = (e: MathJSON, j: MathJSON): MathJSON =>
  times(
    less(e, j),
    hasNone(
      total(
        times(
          hasNone(total(times(isCoverOf("c", e), atMost("c", j), minus(1, atMost("c", "z"))), "c")),
          minus(1, atMost(j, "z")),
        ),
        "z",
      ),
    ),
  );
/** The element the accumulation at step i holds, counting the elements down from the top. */
const fromTop: MathJSON = minus(plus("n", 1), "i");
const placeOf = (j: MathJSON): MathJSON => minus(plus("n", 1), j);
const stepSizes: MathJSON = accumulate([
  "If",
  equals(fromTop, top),
  1,
  [
    "Min",
    map(["If", equals(isStep(fromTop, "j"), 1), plus(["At", "acc", placeOf("j")], 1), plus("n", 2)], "j", elements),
  ],
]);
const stepCounts: MathJSON = accumulate([
  "If",
  equals(fromTop, top),
  1,
  total(
    times(isStep(fromTop, "j"), one(equals(plus(["At", "sizes", placeOf("j")], 1), ["At", "sizes", "i"])), [
      "If",
      equals(isStep(fromTop, "j"), 1),
      ["At", "acc", placeOf("j")],
      0,
    ]),
    "j",
  ),
]);

/** The join of the upper covers of the element `e`: the least z above all of them. */
const coverJoin = (e: MathJSON): MathJSON => [
  "Min",
  map(
    ["If", isZero(total(times(isCoverOf("c", e), minus(1, atMost("c", "z"))), "c")), "z", plus("n", 1)],
    "z",
    elements,
  ),
];
/** The state (element, size) after jumping from the bottom to the join of each element's upper covers until the top. */
const jumps: MathJSON = fold(
  [
    "List",
    ["If", equals(["At", "acc", 1], top), ["At", "acc", 1], coverJoin(["At", "acc", 1])],
    ["If", equals(["At", "acc", 1], top), ["At", "acc", 2], plus(["At", "acc", 2], 1)],
  ],
  "acc",
  "i",
  ["List", bottom, 1],
  elements,
  "list<integer>",
);

/** The meet of the lower covers of x, or x when it has none. */
const coversMeet = (x: MathJSON): MathJSON => [
  "If",
  noLowerCovers(x),
  x,
  ["Max", map(["If", isZero(total(minus(1, atMost("z", "c")), "c", lowerCovers(x))), "z", 0], "z", elements)],
];

/** The subsets of the elements as bitmasks, as statistics.ts reads them. */
const maskSize = (mask: MathJSON): MathJSON => total(inMask(mask, "v"), "v");
const without = (mask: MathJSON, element: MathJSON): MathJSON => minus(mask, ["Power", 2, minus(element, 1)]);
/** The join (meet) of the elements in the subset: the bottom (top) for the empty subset. */
const joinOf = (mask: MathJSON): MathJSON => [
  "Min",
  map(
    ["If", isZero(total(times(inMask(mask, "v"), minus(1, atMost("v", "z"))), "v")), "z", plus("n", 1)],
    "z",
    elements,
  ),
];
const meetOf = (mask: MathJSON): MathJSON => [
  "Max",
  map(["If", isZero(total(times(inMask(mask, "v"), minus(1, atMost("z", "v"))), "v")), "z", 0], "z", elements),
];
const nonEmpty = (mask: MathJSON): MathJSON => one(["Greater", mask, 0]);
/** 1 when the subset has a nonempty part meeting at the bottom. */
const meetsAtBottom = (mask: MathJSON): MathJSON => times(nonEmpty(mask), one(equals(meetOf(mask), bottom)));

const latticeStat = (
  head: string,
  summary: string,
  expr: MathJSON,
  note: string,
  least = 1,
  most?: number,
): Definition => ({ head, on, summary, expr, where: latticeWhere(least, most), note });

const FINDSTAT_ROWS = (id: number): string => `FindStat's St${String(id).padStart(6, "0")}.`;
const DOMAIN = "Defined on a lattice with at least one element; FindStat has no row for the poset with no elements.";
/** A statistic that counts answers the poset with no elements: FindStat has no row there, and the value counts nothing. */
const EMPTY = (value: string, what: string): string =>
  `Defined on a lattice. FindStat has no row for the poset with no elements, which gives ${value}, ${what}.`;

/** The lattices FindStat's statistics are read on: `IsLattice` answers `True` for the poset with no elements too. */
const isLattice: Definition = {
  head: "IsLattice",
  on,
  summary: "Whether every pair of elements has a join and a meet.",
  result: "boolean",
  expr: withPoset(
    withRelation(
      withJoins([
        "And",
        equals(total(one(noLowerCovers("v")), "v"), 1),
        isZero(
          overPairs([
            "Add",
            one(["Greater", join("a", "b"), top]),
            total(times(atMost("a", "z"), atMost("b", "z"), minus(1, atMost(join("a", "b"), "z"))), "z"),
          ]),
        ),
      ]),
    ),
    "True",
  ),
  note: "True for the poset with no elements. A poset has a join for every pair and a bottom exactly when it is a lattice: the test is one minimal element and, for every pair, a least common upper bound (a common upper bound below all the others). A top and a join for every pair are not enough.",
};

export const LATTICE_STATISTICS: readonly Definition[] = [
  isLattice,
  latticeStat(
    "ModularElementCount",
    "The elements a with a ∧ (y ∨ z) = (a ∧ y) ∨ z for every y and every z ≤ a.",
    withLattice(
      withJoins(
        withMeets(
          total(
            hasNone(
              overPairs(
                times(atMost("z", "v"), differ(meet("v", join("y", "z")), join(meet("v", "y"), "z"))),
                "y",
                "z",
              ),
            ),
            "v",
          ),
        ),
      ),
    ),
    `${FINDSTAT_ROWS(550)} Its title and description say that (x, y) and (y, x) are modular pairs for every y; that reading agrees with only 39 of the 78 rows through 7 elements, and the reading here, the modular elements of Stern's definition, with all 78. ${EMPTY("0", "a count of nothing")}`,
    0,
  ),
  latticeStat(
    "LeftModularElementCount",
    "The elements a with (y ∨ a) ∧ z = y ∨ (a ∧ z) for every y ≤ z.",
    withLattice(
      withJoins(
        withMeets(
          total(
            hasNone(
              overPairs(
                times(atMost("y", "z"), differ(meet(join("y", "v"), "z"), join("y", meet("v", "z")))),
                "y",
                "z",
              ),
            ),
            "v",
          ),
        ),
      ),
    ),
    `${FINDSTAT_ROWS(551)} ${EMPTY("0", "a count of nothing")}`,
    0,
  ),
  latticeStat(
    "LatticeCenterRank",
    "The base-2 logarithm of the size of the center: the central elements that cover no other central element above the bottom.",
    withLattice(withJoins(withMeets(withCentral(centerRank)))),
    `${FINDSTAT_ROWS(1613)} The center is the neutral elements that have a complement; it is a Boolean lattice, so its size is 2^k and k is the number of its atoms, which is what this counts (no logarithm). ${DOMAIN}`,
  ),
  latticeStat(
    "JoinPrimeCount",
    "The elements above the bottom that lie below a join p ∨ q only when they lie below p or below q.",
    withLattice(
      withJoins(
        total(
          times(
            one(["Greater", "v", bottom]),
            hasNone(
              overPairs(
                times(atMost("v", join("p", "q")), minus(1, atMost("v", "p")), minus(1, atMost("v", "q"))),
                "p",
                "q",
              ),
            ),
          ),
          "v",
        ),
      ),
    ),
    `${FINDSTAT_ROWS(1615)} The top counts when it is join-prime. ${EMPTY("0", "a count of nothing")}`,
    0,
  ),
  latticeStat(
    "NeutralElementCount",
    "The elements e such that, for all p and q, the sublattice generated by e, p and q is distributive.",
    withLattice(withJoins(withMeets(total(neutral("v"), "v")))),
    `${FINDSTAT_ROWS(1616)} Written as: for each way to take r from {e, p, q}, with u and v the others, (u ∨ v) ∧ r = (u ∧ r) ∨ (v ∧ r) and (u ∧ v) ∨ r = (u ∨ r) ∧ (v ∨ r); that agrees with the sublattice reading on every row. ${EMPTY("0", "a count of nothing")}`,
    0,
  ),
  latticeStat(
    "AtomCount",
    "The elements that cover only the bottom.",
    withPoset(total(one(["And", oneLowerCover("v"), ["Contains", lowerCovers("v"), bottom]]), "v")),
    `${FINDSTAT_ROWS(1621)} ${EMPTY("0", "a count of nothing")}`,
    0,
  ),
  latticeStat(
    "JoinIrreducibleCount",
    "The elements that cover exactly one element.",
    withPoset(total(one(oneLowerCover("v")), "v")),
    `${FINDSTAT_ROWS(1622)} ${EMPTY("0", "a count of nothing")}`,
    0,
  ),
  latticeStat(
    "DoublyIrreducibleCount",
    "The elements that cover exactly one element and are covered by exactly one.",
    withPoset(total(one(["And", oneLowerCover("v"), equals(upperCoverCount("v"), 1)]), "v")),
    `${FINDSTAT_ROWS(1623)} ${EMPTY("0", "a count of nothing")}`,
    0,
  ),
  latticeStat(
    "MoebiusInvariant",
    "The Möbius function from the bottom to the top.",
    withLattice(bind("row", moebiusRow(bottom), ["At", "row", "n"], "list<integer>")),
    `${FINDSTAT_ROWS(1625)} μ(1, n) of the lattice, the last entry of the Möbius row of the bottom. ${DOMAIN}`,
  ),
  latticeStat(
    "FranklNumber",
    "The greatest n − 2 |[x, n]| over the join-irreducible elements x, the interval [x, n] being the elements at or above x.",
    withLattice(
      greatest(
        ["If", oneLowerCover("x"), minus("n", times(2, total(atMost("x", "y"), "y"))), minus(0, times(2, "n"))],
        "x",
      ),
    ),
    `${FINDSTAT_ROWS(1651)} The one-element lattice has no join-irreducible element and FindStat no row for it, so it is outside the domain, not 0. Defined on a lattice with at least two elements.`,
    2,
  ),
  latticeStat(
    "ShortestSmallIntervalChainCount",
    "The chains from the bottom to the top with the fewest elements in which each element is a join of upper covers of the one before.",
    withLattice(
      bind("sizes", stepSizes, bind("counts", stepCounts, ["At", "counts", "n"], "list<integer>"), "list<integer>"),
    ),
    `${FINDSTAT_ROWS(1719)} A step from e to j > e is allowed when the upper covers of e below j have join j. Counted by a fold from the top over the elements. ${DOMAIN}`,
  ),
  latticeStat(
    "CoverJoinChainSize",
    "The elements of the chain from the bottom to the top that jumps from each element to the join of its upper covers.",
    withLattice(bind("state", jumps, ["At", "state", 2], "list<integer>")),
    `${FINDSTAT_ROWS(1720)} Its title says the shortest chain of small intervals and its length: its rows count the elements of the chain that jumps from each element to the join of all its upper covers, both ends included, so the one-element lattice gives 1. That chain is not always the shortest: on one lattice of 7 elements it has 4 elements, the shortest has 3, and the row says 4. ${DOMAIN}`,
  ),
  latticeStat(
    "PopStackImageSize",
    "The distinct values of x ∧ (the meet of the elements x covers), where an element that covers none gives itself.",
    withLattice(
      bind(
        "images",
        map(coversMeet("x"), "x", elements),
        total(one(["Greater", total(one(equals(["At", "images", "x"], "v")), "x"), 0]), "v"),
        "list<integer>",
      ),
    ),
    `${FINDSTAT_ROWS(1820)} The meet of the lower covers of x lies below x, so the image is that meet, or x itself when x covers nothing. ${EMPTY("0", "a count of nothing")}`,
    0,
  ),
  latticeStat(
    "LinearIntervalCount",
    "The pairs x ≤ y, x = y included, whose interval [x, y] is a chain.",
    withLattice(
      overPairs(
        times(
          atMost("x", "y"),
          hasNone(
            overPairs(
              times(
                atMost("x", "z"),
                atMost("z", "y"),
                atMost("x", "w"),
                atMost("w", "y"),
                one(["Less", "z", "w"]),
                minus(1, comparable("z", "w")),
              ),
              "z",
              "w",
            ),
          ),
        ),
        "x",
        "y",
      ),
    ),
    `${FINDSTAT_ROWS(1833)} ${EMPTY("0", "a count of nothing")}`,
    0,
  ),
  latticeStat(
    "JoinIrreducibleCountMinusRank",
    "The join-irreducible elements less the length of the longest chain.",
    withLattice(
      bind(
        "sizes",
        chainSizes,
        minus(total(one(oneLowerCover("v")), "v"), minus(["Max", "sizes"], 1)),
        "list<integer>",
      ),
    ),
    `${FINDSTAT_ROWS(1845)} The length of the longest chain is one less than its elements. ${DOMAIN}`,
  ),
  latticeStat(
    "UncomplementedElementCount",
    "The elements with no complement: no y with x ∧ y the bottom and x ∨ y the top.",
    withLattice(withJoins(withMeets(total(minus(1, complemented("v")), "v")))),
    `${FINDSTAT_ROWS(1846)} ${EMPTY("0", "a count of nothing")}`,
    0,
  ),
  latticeStat(
    "DirectFactorCount",
    "The directly indecomposable factors of the lattice, when it is a product of them: the larger of 1 and the center's rank.",
    withLattice(withJoins(withMeets(withCentral(["Max", 1, centerRank])))),
    `${FINDSTAT_ROWS(1881)} The center is a Boolean lattice 2^k and the lattice is a product of k directly indecomposable lattices; equal to the larger of 1 and the base-2 logarithm of the center's size on every row. ${DOMAIN}`,
  ),
  {
    head: "ZeroDivisorCount",
    on,
    summary: "The elements a above the bottom with some b above the bottom and a ∧ b the bottom.",
    expr: withLattice(
      withMeets(
        total(
          times(
            one(["Greater", "a", bottom]),
            one(["Greater", total(times(one(["Greater", "b", bottom]), one(equals(meet("a", "b"), bottom))), "b"), 0]),
          ),
          "a",
        ),
      ),
    ),
    where: latticeWhere(0),
    note: `${FINDSTAT_ROWS(1990)} The lattice with no elements has a row, and its value is 0.`,
  },
  latticeStat(
    "SublatticeCount",
    "The subsets closed under join and meet, the empty set included.",
    withLattice(
      withJoins(
        withMeets(
          total(
            hasNone(
              overPairs(
                times(
                  inMask("m", "a"),
                  inMask("m", "b"),
                  plus(minus(1, inMask("m", join("a", "b"))), minus(1, inMask("m", meet("a", "b")))),
                ),
              ),
            ),
            "m",
            masks,
          ),
        ),
      ),
      1,
    ),
    `${FINDSTAT_ROWS(1620)} The empty set is a sublattice: the one-element lattice has 2. ${EMPTY("1", "the count of the empty subset")}`,
    0,
    ELEMENT_LIMIT,
  ),
  latticeStat(
    "LatticeBreadth",
    "The most elements in a join-irredundant subset: one whose join changes when any element is dropped.",
    withLattice(
      withJoins([
        "Max",
        1,
        greatest(
          times(
            hasNone(total(times(inMask("m", "w"), one(equals(joinOf(without("m", "w")), joinOf("m")))), "w")),
            maskSize("m"),
          ),
          "m",
          masks,
        ),
      ]),
    ),
    `${FINDSTAT_ROWS(1624)} At least 1. The same value is the most elements in a join-irredundant subset of the join-irreducible elements. Named for the lattice: Breadth is a permutation statistic. ${DOMAIN}`,
    1,
    ELEMENT_LIMIT,
  ),
  latticeStat(
    "NondegenerateBottomMeetSubsetCount",
    "The nonempty subsets holding neither the bottom nor the top whose meet is the bottom.",
    withLattice(
      total(times(meetsAtBottom("m"), minus(1, inMask("m", bottom)), minus(1, inMask("m", top))), "m", masks),
    ),
    `${FINDSTAT_ROWS(1677)} ${EMPTY("0", "a count of nothing")}`,
    0,
    ELEMENT_LIMIT,
  ),
  latticeStat(
    "BottomMeetSubsetCount",
    "The nonempty subsets whose meet is the bottom.",
    withLattice(total(meetsAtBottom("m"), "m", masks)),
    `${FINDSTAT_ROWS(1679)} 2^(n−1) + 2 times St001677 for n ≥ 2. ${EMPTY("0", "a count of nothing")}`,
    0,
    ELEMENT_LIMIT,
  ),
  latticeStat(
    "MinimalBottomMeetSubsetCount",
    "The subsets whose meet is the bottom and no smaller subset's is.",
    withLattice(
      total(
        times(meetsAtBottom("m"), hasNone(total(times(inMask("m", "w"), meetsAtBottom(without("m", "w"))), "w"))),
        "m",
        masks,
      ),
    ),
    `${FINDSTAT_ROWS(1681)} A subset with meet the bottom stays one when elements are added, so it is minimal when dropping any one element loses that. ${DOMAIN}`,
    1,
    ELEMENT_LIMIT,
  ),
];

/** Every definition on the poset carrier: the poset statistics, then the lattice statistics. */
export const POSET_AREA_STATISTICS: readonly Definition[] = [...POSET_STATISTICS, ...LATTICE_STATISTICS];
