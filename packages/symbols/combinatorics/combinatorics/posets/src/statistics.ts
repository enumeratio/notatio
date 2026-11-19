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

/**
 * The joins (`meets` the meets) as a flat row-major list of n² entries: entry (a - 1) n + b is the join of a and b, the
 * least-labeled common upper bound, which in a natural labeling is below every other one; n + 1 when a and b have none
 * (the meet is the greatest-labeled common lower bound, 0 when there is none). Built a row at a time. Read inside
 * `withRelation`.
 */
const boundTable = (pick: "Min" | "Max", test: (z: MathJSON) => MathJSON, none: MathJSON): MathJSON =>
  fold(
    ["Join", "acc", map([pick, map(["If", equals(test("z"), 1), "z", none], "z", elements)], "j", elements)],
    "acc",
    "i",
    ["List"],
    elements,
    "list<integer>",
  );
/** `body` with `joins` the join table. */
export const withJoins = (body: MathJSON): MathJSON =>
  bind(
    "joins",
    boundTable("Min", (z) => times(atMost("i", z), atMost("j", z)), plus("n", 1)),
    body,
    "list<integer>",
  );
/** `body` with `meets` the meet table. */
export const withMeets = (body: MathJSON): MathJSON =>
  bind(
    "meets",
    boundTable("Max", (z) => times(atMost(z, "i"), atMost(z, "j")), 0),
    body,
    "list<integer>",
  );

/**
 * `body` for a poset that is a lattice, with `n` and `below`; the poset with no elements gives `otherwise`. There is no
 * guard: the caller's `where` (`IsLattice`) keeps the statistic off every other subject.
 */
export const withLattice = (body: MathJSON, otherwise: MathJSON = 0): MathJSON =>
  withPoset(withRelation(body), otherwise);

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
/** The empty poset has no FindStat row: its value is chosen, not checked. */
const CONVENTION = (value: string): string =>
  `The poset with no elements gives ${value}, a convention: FindStat has no row for it.`;

/** 2^(v - 1), the mask of the element v. */
const bit = (element: MathJSON): MathJSON => ["Power", 2, minus(element, 1)];
/** The mask holding every element. */
const fullMask: MathJSON = minus(["Power", 2, "n"], 1);
/** 1 + a mask: its position in a table built over `masks`. */
const slot = (mask: MathJSON): MathJSON => plus(mask, 1);
/** 1 when `element` is not in the subset and every element below it is. */
const extends_ = (mask: MathJSON, element: MathJSON): MathJSON =>
  equals(plus(inMask(mask, element), total(times(less("u", element), minus(1, inMask(mask, "u"))), "u")), 0);
/** Whether every member of the subset has all the elements below it in the subset: an order ideal. */
const isIdeal = (mask: MathJSON): MathJSON =>
  equals(total(times(inMask(mask, "v"), total(times(less("u", "v"), minus(1, inMask(mask, "u"))), "u")), "v"), 0);
/** 1 when the subset `inner` lies inside `outer`. */
const containedIn = (inner: MathJSON, outer: MathJSON): MathJSON =>
  one(equals(total(times(inMask(inner, "v"), minus(1, inMask(outer, "v"))), "v"), 0));

/** A list over `over`, built an entry at a time from the entries `acc` already holds. */
const tableOver = (entry: MathJSON, variable: string, over: MathJSON): MathJSON =>
  fold(["Join", "acc", ["List", entry]], "acc", variable, ["List"], over, "list<integer>");
const tableEntry = (table: MathJSON, position: MathJSON): MathJSON => ["At", table, position];

/**
 * The linear extensions that build each order ideal, by mask (0 for a subset that is not an ideal): the empty ideal has one;
 * an ideal's are those of the ideals it gives by dropping a maximal member, summed.
 */
const idealWays: MathJSON = tableOver(
  [
    "If",
    equals("m", 0),
    1,
    ["If", isIdeal("m"), total(["If", hasBit("m", "v"), tableEntry("acc", slot(minus("m", bit("v")))), 0], "v"), 0],
  ],
  "m",
  masks,
);
/**
 * The ways to finish from each order ideal to the whole poset, by mask, read only at ideals: the whole poset has one, and
 * an ideal sums those of the ideals it gives by adding an element. The table runs from the full mask down, so position j
 * is the mask 2^n - j.
 */
const backwardSlot = (mask: MathJSON): MathJSON => minus(["Power", 2, "n"], mask);
const idealCompletions: MathJSON = tableOver(
  [
    "If",
    equals("m", fullMask),
    1,
    total(["If", extends_("m", "v"), tableEntry("acc", backwardSlot(plus("m", bit("v")))), 0], "v"),
  ],
  "m",
  ["Range", fullMask, 0, -1],
);
const withIdealWays = (body: MathJSON): MathJSON => bind("ways", idealWays, body, "list<integer>");
const withIdealCompletions = (body: MathJSON): MathJSON => bind("completions", idealCompletions, body, "list<integer>");
const linearExtensions: MathJSON = tableEntry("ways", slot(fullMask));
/** The linear extensions with x before y: x joins an ideal that leaves y out. */
const extensionsBefore = (x: MathJSON, y: MathJSON): MathJSON =>
  total(
    [
      "If",
      extends_("m", x),
      times(
        tableEntry("ways", slot("m")),
        minus(1, inMask("m", y)),
        tableEntry("completions", backwardSlot(plus("m", bit(x)))),
      ),
      0,
    ],
    "m",
    masks,
  );
/** The pairs x < y (as numbers) whose count c of extensions with x first passes `balanced` (1 or 0), which reads `c` and `e`. */
const balancedPairs = (balanced: (c: MathJSON, e: MathJSON) => MathJSON): MathJSON =>
  withIdealWays(
    withIdealCompletions(
      bind(
        "e",
        linearExtensions,
        total(
          total(
            ["If", ["Less", "x", "y"], bind("c", extensionsBefore("x", "y"), balanced("c", "e"), "integer"), 0],
            "y",
          ),
          "x",
        ),
        "integer",
      ),
    ),
  );

/**
 * The table over (mask, last) for the extensions that end in `last`, flat with n entries per mask: `entry` reads the entries
 * of the ideal `m` without `last`, at `previous(prev)`, and is held at `invalid` where `last` cannot be the final element.
 */
const lastTable = (entry: MathJSON, invalid: MathJSON): MathJSON =>
  fold(
    [
      "Join",
      "acc",
      map(
        [
          "If",
          hasBit("m", "last"),
          ["If", isIdeal(withoutLast), ["If", extends_(withoutLast, "last"), entry, invalid], invalid],
          invalid,
        ],
        "last",
        elements,
      ),
    ],
    "acc",
    "m",
    ["List"],
    masks,
    "list<integer>",
  );
/** The entry of `table` at the ideal `mask` ending in `last`. */
const lastEntry = (table: MathJSON, mask: MathJSON, last: MathJSON): MathJSON =>
  tableEntry(table, plus(times(mask, "n"), last));
const withoutLast: MathJSON = minus("m", bit("last"));
/** 1 when `last` covers `prev`. */
const covers = (last: MathJSON, prev: MathJSON): MathJSON => one(["Contains", lowerCovers(last), prev]);

/** The fewest jumps over the linear extensions that end in each element; the ideal table of `lastTable` with sentinel 2n. */
const jumpTable: MathJSON = lastTable(
  [
    "If",
    equals(withoutLast, 0),
    0,
    ["Min", map(plus(lastEntry("acc", withoutLast, "prev"), minus(1, covers("last", "prev"))), "prev", elements)],
  ],
  times(2, "n"),
);
/** The sequences of the greedy algorithm that end in each element. */
const greedyTable: MathJSON = lastTable(
  [
    "If",
    equals(withoutLast, 0),
    1,
    total(
      times(
        lastEntry("acc", withoutLast, "prev"),
        one([
          "Greater",
          plus(
            covers("last", "prev"),
            minus(1, one(["Greater", total(times(one(extends_(withoutLast, "w")), covers("w", "prev")), "w"), 0])),
          ),
          0,
        ]),
      ),
      "prev",
    ),
  ],
  0,
);

/** The paths of each element along covers that have the best size there, by `best`: a list of the best size per element. */
const bestPathCounts: MathJSON = accumulate([
  "If",
  noLowerCovers("i"),
  1,
  total(times(one(equals(plus(["At", "best", "c"], 1), ["At", "best", "i"])), entryOf("c")), "c", lowerCovers("i")),
]);
/** The maximal chains whose size is the `extreme` (Max or Min) over maximal chains, by their best sizes `sizes`. */
const extremeMaximalChains = (sizes: MathJSON, extreme: "Max" | "Min"): MathJSON =>
  bind(
    "best",
    sizes,
    bind(
      "paths",
      bestPathCounts,
      bind(
        "target",
        [
          extreme,
          map(["If", noUpperCovers("v"), ["At", "best", "v"], extreme === "Max" ? 0 : plus("n", 1)], "v", elements),
        ],
        total(times(one(noUpperCovers("v")), one(equals(["At", "best", "v"], "target")), ["At", "paths", "v"]), "v"),
        "integer",
      ),
      "list<integer>",
    ),
    "list<integer>",
  );

/** 1 when the subset is an antichain no other element can join. */
const isMaximalAntichain = (mask: MathJSON): MathJSON =>
  equals(
    plus(
      relatedInside(mask),
      total(
        times(
          minus(1, inMask(mask, "w")),
          one(equals(total(times(inMask(mask, "a"), plus(less("a", "w"), less("w", "a"))), "a"), 0)),
        ),
        "w",
      ),
    ),
    0,
  );
/** The elements of each maximal antichain by mask, and `other` for a subset that is not one. */
const maximalAntichainSizes = (other: MathJSON): MathJSON =>
  map(["If", isMaximalAntichain("m"), maskSize("m"), other], "m", masks);
/** The maximal antichains with the `extreme` (Max or Min) number of elements. */
const extremeMaximalAntichains = (extreme: "Max" | "Min"): MathJSON =>
  bind(
    "sizes",
    maximalAntichainSizes(extreme === "Max" ? 0 : plus("n", 1)),
    bind("target", [extreme, "sizes"], total(one(equals("s", "target")), "s", "sizes"), "integer"),
    "list<integer>",
  );

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
  stat(
    "LinearExtensionCount",
    "The number of linear extensions of the poset: the orderings of its elements that keep every x < y with x first.",
    withPoset(withRelation(withIdealWays(linearExtensions)), 1),
    `FindStat's St000100. A table over the order ideals: the extensions that build an ideal are the sums over its maximal members of those of the ideal without them. ${CONVENTION("1, the empty ordering")}`,
  ),
  stat(
    "ChainPolytopeFacetCount",
    "The facets of the chain polytope: the elements and the maximal chains.",
    withPoset(
      plus(
        "n",
        bind(
          "paths",
          chainsEndingAt,
          total(times(one(noUpperCovers("v")), ["At", "paths", "v"]), "v"),
          "list<integer>",
        ),
      ),
    ),
    `FindStat's St000151, held to its rows only, which stop at 6 elements: the closed form, the elements plus the paths up the Hasse diagram from a minimal to a maximal element, is not read from the polytope. ${CONVENTION("0")}`,
  ),
  stat(
    "JumpNumber",
    "The fewest jumps over the linear extensions: the steps where the next element does not cover the last.",
    withPoset(
      withRelation(
        bind("jumps", jumpTable, ["Min", map(lastEntry("jumps", fullMask, "last"), "last", elements)], "list<integer>"),
      ),
    ),
    `FindStat's St000632. A table over the order ideals and their last element. ${CONVENTION("0")}`,
  ),
  stat(
    "CutCount",
    "The Dedekind-MacNeille cuts: the subsets A equal to the elements below every upper bound of A, the empty subset included.",
    withPoset(
      withRelation(
        total(
          one(
            bind(
              "upper",
              map(one(equals(total(times(inMask("m", "a"), minus(1, atMost("a", "w"))), "a"), 0)), "w", elements),
              equals(
                total(
                  [
                    "Abs",
                    minus(
                      inMask("m", "z"),
                      one(equals(total(times(["At", "upper", "w"], minus(1, atMost("z", "w"))), "w"), 0)),
                    ),
                  ],
                  "z",
                ),
                0,
              ),
              "list<integer>",
            ),
          ),
          "m",
          masks,
        ),
      ),
      1,
    ),
    `FindStat's St000656. The rows count these cuts of the order; a graph's cut is a bipartition, which this is not. ${CONVENTION("1, the empty subset")}`,
  ),
  stat(
    "MostBalancedPairExtensionCount",
    "The most, over the pairs x, y, of the fewer of the linear extensions with x first and with y first.",
    withPoset(
      withRelation(
        withIdealWays(
          withIdealCompletions(
            bind(
              "e",
              linearExtensions,
              [
                "If",
                ["Less", "n", 2],
                0,
                greatest(
                  greatest(
                    [
                      "If",
                      ["Less", "x", "y"],
                      bind("c", extensionsBefore("x", "y"), ["Min", "c", minus("e", "c")], "integer"),
                      0,
                    ],
                    "y",
                  ),
                  "x",
                ),
              ],
              "integer",
            ),
          ),
        ),
      ),
    ),
    `FindStat's St000848. A comparable pair gives 0, and so does a poset with fewer than two elements. ${CONVENTION("0")}`,
  ),
  stat(
    "OneThirdBalancedPairCount",
    "The pairs x, y whose share of the linear extensions with x first is between a third and two thirds.",
    withPoset(
      withRelation(
        balancedPairs((c, e) => [
          "If",
          ["GreaterEqual", times(3, c), e],
          one(["LessEqual", times(3, c), times(2, e)]),
          0,
        ]),
      ),
    ),
    `FindStat's St000849. The shares are compared as integers. A pair counts once. ${CONVENTION("0")}`,
  ),
  stat(
    "HalfBalancedPairCount",
    "The pairs x, y with as many linear extensions with x first as with y first.",
    withPoset(withRelation(balancedPairs((c, e) => one(equals(times(2, c), e))))),
    `FindStat's St000850. The shares are compared as integers. A pair counts once. ${CONVENTION("0")}`,
  ),
  stat(
    "ShortestMaximalAntichainCount",
    "The maximal antichains with the fewest elements.",
    withPoset(withRelation(extremeMaximalAntichains("Min")), 1),
    `FindStat's St000907. ${CONVENTION("1, the empty antichain")}`,
  ),
  stat(
    "ShortestMaximalAntichainSize",
    "The fewest elements in a maximal antichain.",
    withPoset(withRelation(["Min", maximalAntichainSizes(plus("n", 1))])),
    `FindStat's St000908, whose title says the length of the antichain: its rows count its elements. ${CONVENTION("0")}`,
  ),
  stat(
    "LongestMaximalChainCount",
    "The maximal chains with the most elements.",
    withPoset(extremeMaximalChains(chainSizes, "Max"), 1),
    `FindStat's St000909. ${CONVENTION("1, the empty chain")}`,
  ),
  stat(
    "ShortestMaximalChainCount",
    "The maximal chains with the fewest elements.",
    withPoset(extremeMaximalChains(shortestChains, "Min"), 1),
    `FindStat's St000910, whose title says the length of the chain: its rows count the chains with the fewest elements. ${CONVENTION("1, the empty chain")}`,
  ),
  stat(
    "LargestMaximalAntichainCount",
    "The maximal antichains with the most elements.",
    withPoset(withRelation(extremeMaximalAntichains("Max")), 1),
    `FindStat's St000911. ${CONVENTION("1, the empty antichain")}`,
  ),
  stat(
    "MaximalAntichainCount",
    "The antichains that no element can be added to.",
    withPoset(withRelation(total(one(isMaximalAntichain("m")), "m", masks)), 1),
    `FindStat's St000912. ${CONVENTION("1, the empty antichain")}`,
  ),
  stat(
    "GreedyLinearExtensionCount",
    "The sequences the greedy algorithm builds: a minimal element of the rest that covers the last chosen, else any minimal element.",
    withPoset(
      withRelation(bind("greedy", greedyTable, total(lastEntry("greedy", fullMask, "last"), "last"), "list<integer>")),
      1,
    ),
    `FindStat's St001105. A table over the order ideals and their last element. ${CONVENTION("1, the empty sequence")}`,
  ),
  stat(
    "ThreeChainHomomorphismCount",
    "The order-preserving maps to the chain of three elements: the pairs of nested order ideals.",
    withPoset(
      withRelation(
        bind(
          "ideals",
          ["Filter", masks, ["Function", isIdeal("m"), "m"]],
          total(total(containedIn("a", "b"), "a", "ideals"), "b", "ideals"),
          "list<integer>",
        ),
      ),
      1,
    ),
    `FindStat's St001709. ${CONVENTION("1, the empty map")}`,
  ),
  stat(
    "OrderPreservingSurjectionToChainCount",
    "The order-preserving surjections from the poset onto a chain of any size: the chains of order ideals from the empty one to the whole poset with strict steps.",
    withPoset(
      withRelation(
        bind(
          "chains",
          tableOver(
            [
              "If",
              equals("m", 0),
              1,
              [
                "If",
                isIdeal("m"),
                total(times(containedIn("s", "m"), tableEntry("acc", slot("s"))), "s", ["Range", 0, minus("m", 1), 1]),
                0,
              ],
            ],
            "m",
            masks,
          ),
          tableEntry("chains", slot(fullMask)),
          "list<integer>",
        ),
      ),
      1,
    ),
    `FindStat's St001815. ${CONVENTION("1, the empty map")}`,
  ),
  stat(
    "IntervalClosedSetCount",
    "The subsets that hold every element between two of their members, the empty subset included.",
    withPoset(
      withRelation(
        total(
          one(
            equals(
              total(
                times(
                  minus(1, inMask("m", "z")),
                  one(["Greater", total(times(inMask("m", "x"), atMost("x", "z")), "x"), 0]),
                  one(["Greater", total(times(inMask("m", "y"), atMost("z", "y")), "y"), 0]),
                ),
                "z",
              ),
              0,
            ),
          ),
          "m",
          masks,
        ),
      ),
      1,
    ),
    `FindStat's St001909. ${CONVENTION("1, the empty subset")}`,
  ),
];

/** The builders the lattice statistics (statistics.lattices.ts) write their definitions with. */
export {
  accumulate,
  atMost,
  chainSizes,
  comparable,
  elements,
  entryOf,
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
  NO_ELEMENTS,
  one,
  plus,
  stat,
  times,
  total,
  upperCoverCount,
  upTo,
};
