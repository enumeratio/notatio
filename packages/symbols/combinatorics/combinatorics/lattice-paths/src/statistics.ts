// Dyck-path statistics, over `_x` = the step word: 1 for an up step, 0 for a down step.
//
// Everything here is a statement about the HEIGHT PROFILE, so that is defined once and the
// statistics read it. `heightAfter(i)` is (ups - downs) over the first i steps, which for a
// 0/1 word is the sum of (2*step - 1).

import type { Definition, MathJSON } from "../../src/statistics/types.ts";
import {
  add,
  and,
  atLeast,
  atLeastValue,
  atMostValue,
  bind,
  bindList,
  floored,
  carried,
  fold,
  visiting,
  x,
  at,
  count,
  equals,
  forEach,
  greater,
  hasPair,
  length,
  less,
  nonEmpty,
  or,
  positions,
  subtract,
  sumOver,
  upTo,
  where,
} from "../../src/statistics/vocabulary.ts";

const on = "DyckPath";
const stat = (head: string, summary: string, expr: Definition["expr"], note?: string): Definition => ({
  head,
  on,
  summary,
  expr,
  ...(note ? { note } : {}),
});

const step = (i: MathJSON): MathJSON => at(i);
/** Height after the first `i` steps: each up step is +1, each down step is -1. */
const heightAfter = (i: MathJSON): MathJSON => sumOver(upTo(i), subtract(["Multiply", 2, at("k")], 1), "k");
/** The height profile, one entry per prefix. */
const profile: MathJSON = forEach(positions, heightAfter("i"));

const isUp = (i: MathJSON): MathJSON => equals(step(i), 1);
const isDown = (i: MathJSON): MathJSON => equals(step(i), 0);
const nextIndex: MathJSON = add("i", 1);

/** The longest run of a given step value, carried as (best, current). */
const longestRunOf = (value: number): MathJSON => [
  "At",
  fold(
    x,
    ["List", 0, 0],
    [
      "If",
      ["Equal", visiting, value],
      ["List", ["Max", ["List", carried(1), ["Add", carried(2), 1]]], ["Add", carried(2), 1]],
      ["List", carried(1), 0],
    ],
  ),
  1,
];

// Area, dinv and bounce all read the AREA SEQUENCE — a value per up-step, against the diagonal,
// not the axis (the height profile sums to twice the area plus n). a_i
// is the height right before the i-th up step — read straight off `heightAfter`, at the
// position just before that step, rather than folded up while walking the word: a fold's
// accumulator has to stay one uniform element type across every index compute-engine looks
// at, and (height, growing list) mixes a number with a list in the same slot, which is
// exactly the shape compute-engine 0.128 mis-infers (Join silently degrades to a 2-element
// List once any index of the accumulator is used arithmetically elsewhere in the same
// Function). Reading positions filtered by step type sidesteps the whole accumulator.
const heightBefore = (i: MathJSON): MathJSON => ["If", less(i, 2), 0, heightAfter(subtract(i, 1))];

/** a_1 .. a_n, one entry per up step: the height right before taking it. */
const areaSequence: MathJSON = forEach(where(positions, isUp("i")), heightBefore("i"));
/**
 * The bounce path starts at the end of the path and travels toward the origin, so it reads the
 * path from the right: H(x) for x = 0 .. n-1 is the height after the (n-x)-th up step, plus x
 * (the up steps still to come). `ups` holds the positions of the up steps.
 */
const bounceCeilings: MathJSON = bindList(
  "ups",
  where(positions, isUp("i")),
  forEach(
    upTo(["Divide", length(), 2]),
    add(heightAfter(at(subtract(add(["Divide", length(), 2], 1), "j"), "ups")), subtract("j", 1)),
    "j",
  ),
);
const areaAt = (i: MathJSON): MathJSON => at(i, areaSequence);
const semilength: MathJSON = ["Divide", length(), 2];

// One tick of the bounce walk, over the ceilings read from the end. Accumulator is (k, blockIndex, total): k is the current
// diagonal touch point, blockIndex counts how many climbs have happened so far, total is the
// running bounce weight. Once k reaches n the walk is done and the tick is a no-op, which is
// what lets a fixed n-tick fold stand in for "until k reaches n".
const bounceStep: MathJSON = [
  "If",
  equals(carried(1), semilength),
  ["List", carried(1), carried(2), carried(3)],
  [
    "List",
    at(add(carried(1), 1), "ceilings"),
    add(carried(2), 1),
    add(carried(3), ["Multiply", carried(2), subtract(at(add(carried(1), 1), "ceilings"), carried(1))]),
  ],
];

// ── peaks and rises, for the FindStat statistics that read them ────────────────────────────

const isPeak: MathJSON = and(isUp("i"), isDown(nextIndex));
/** Positions of the up steps that end a rise (a peak's up step), in order. */
const peakPositions: MathJSON = where(upTo(subtract(length(), 1)), isPeak);
/** The height of each peak, left to right. */
const peakHeights: MathJSON = forEach(peakPositions, heightAfter("i"));
/** Up steps among the first `i` steps. */
const upsUpTo = (i: MathJSON): MathJSON => count(upTo(i), isUp("k"), "k");
/** The length of each rise (maximal run of up steps), left to right. Up steps are counted at
 *  each peak, and a rise is what accrues since the previous peak. */
const riseLengths: MathJSON = bindList(
  "u",
  forEach(peakPositions, upsUpTo("i")),
  forEach(
    ["Range", 1, ["Length", "u"]],
    ["If", equals("k", 1), ["At", "u", 1], subtract(["At", "u", "k"], ["At", "u", subtract("k", 1)])],
    "k",
  ),
);
/** First position of the double rises' pairs (an up step followed by an up step); 0 if none. */
const lastDoubleRise: MathJSON = bindList(
  "doubles",
  where(upTo(subtract(length(), 1)), and(isUp("i"), isUp(nextIndex))),
  ["If", equals(["Length", "doubles"], 0), 0, ["Max", "doubles"]],
);
/** A step `i` that equals its successor, at positions where one exists. */
const repeatsAt = (value: number): MathJSON =>
  where(upTo(subtract(length(), 1)), and(equals(step("i"), value), equals(step(nextIndex), value)));
/** Occurrences of a three-step pattern, 1 for an up step and 0 for a down step. */
const occurrencesOf = (a: number, b: number, c: number): MathJSON =>
  atLeast(
    3,
    count(
      upTo(subtract(length(), 2)),
      and(and(equals(step("i"), a), equals(step(add("i", 1)), b)), equals(step(add("i", 2)), c)),
    ),
  );
const height: MathJSON = ["Max", profile];

// ── FindStat's tunnels, runs, interactions and the rest ───────────────────────────────────

/** Down steps among the first `i` steps. */
const downsUpTo = (i: MathJSON): MathJSON => count(upTo(i), isDown("d"), "d");
/** Heights at every vertex, the origin included: vertex `v` is entry `v + 1`. */
const vertexProfile: MathJSON = ["Join", ["List", 0], profile];
/** Positions of the down steps that are followed by an up step. */
const valleyPositions: MathJSON = where(upTo(subtract(length(), 1)), and(isDown("i"), isUp(nextIndex)));
/** 1 if two adjacent steps differ (one up and one down), else 0. */
const differ = (a: MathJSON, b: MathJSON): MathJSON => ["If", equals(add(a, b), 1), 1, 0];

/**
 * For each position, the position of the up step matching it if it is a down step, else 0: the
 * last up step before it that ends at the height the down step starts from (the path between
 * stays at or above that height, or a later such up step would exist).
 */
const matchingUps: MathJSON = bindList(
  "h",
  profile,
  forEach(
    positions,
    [
      "If",
      isDown("p"),
      [
        "Max",
        where(upTo(subtract("p", 1)), and(isUp("q"), equals(["At", "h", "q"], ["At", "h", subtract("p", 1)])), "q"),
      ],
      0,
    ],
    "p",
  ),
);
/** Tunnels (an up step with its matching down step) accepted by `member`, given the matching positions as `m`. */
const tunnelsWhere = (member: (p: MathJSON) => MathJSON): MathJSON =>
  where(positions, and(isDown("p"), member("p")), "p");
const centered = (p: MathJSON): MathJSON => equals(add(p, ["At", "m", p]), add(length(), 1));
const leftOf = (p: MathJSON): MathJSON => less(add(p, ["At", "m", p]), add(length(), 1));
/** Pairs of tunnels in the set, one strictly inside the other. */
const nestedTunnelPairs = (member: (p: MathJSON) => MathJSON): MathJSON =>
  bindList(
    "m",
    matchingUps,
    sumOver(
      tunnelsWhere(member),
      count(
        upTo(subtract("p", 1)),
        and(and(isDown("r"), member("r")), greater(["At", "m", "r"], ["At", "m", "p"])),
        "r",
      ),
      "p",
    ),
  );
const tunnelCount = (member: (p: MathJSON) => MathJSON): MathJSON =>
  bindList("m", matchingUps, ["Length", tunnelsWhere(member)]);

/**
 * The interactions of a path: runs of one step type build a count, and the next run of the other
 * type uses it up one step at a time. Accumulator: (interactions, count, previous step).
 */
const interactions = (builder: number): MathJSON => [
  "At",
  fold(
    x,
    ["List", 0, 0, 0],
    [
      "If",
      equals(visiting, builder),
      ["List", carried(1), ["If", equals(carried(3), 1 - builder), 1, add(carried(2), 1)], builder],
      [
        "If",
        greater(carried(2), 0),
        ["List", add(carried(1), 1), subtract(carried(2), 1), 1 - builder],
        ["List", carried(1), carried(2), 1 - builder],
      ],
    ],
  ),
  1,
];

/** Rises of a given length, counted by `test` on each length. */
const risesWhere = (test: (r: MathJSON) => MathJSON): MathJSON =>
  bindList("lengths", riseLengths, count("lengths", test("r"), "r"));
/** Whether step `i` differs from the step before it, or is the first. */
const startsRun = (i: MathJSON): MathJSON => ["If", equals(i, 1), 1, differ(at(subtract(i, 1)), at(i))];
/** Whether step `i` differs from the step after it, or is the last. */
const endsRun = (i: MathJSON): MathJSON => ["If", equals(i, length()), 1, differ(at(i), at(add(i, 1)))];
/** A hill of size `k` starting at step `i`: k up steps then k down steps, beginning on the axis. */
const hillAt = (k: number): MathJSON => {
  const steps = Array.from({ length: 2 * k }, (_, t) => equals(step(add("i", t)), t < k ? 1 : 0));
  const shape = steps.reduce((all, one) => and(all, one));
  return and(shape, equals(["If", equals("i", 1), 0, heightAfter(subtract("i", 1))], 0));
};
/** Peaks that are (weak or strict) left-to-right maxima among the peak heights. */
const peakMaxima = (beats: "Greater" | "GreaterEqual"): MathJSON => [
  "At",
  fold(
    peakHeights,
    ["List", 0, 0],
    ["If", [beats, visiting, carried(1)], ["List", visiting, add(carried(2), 1)], ["List", carried(1), carried(2)]],
  ),
  2,
];

/** Haglund's area: the whole squares between the path and the zigzag, the sum of the area sequence. */
const areaValue: MathJSON = nonEmpty(["Divide", subtract(["Sum", profile], semilength), 2]);
const dinvValue: MathJSON = atLeast(
  4,
  sumOver(
    upTo(semilength),
    // Guarded rather than left to `Range(i+1, n)`: compute-engine's `Range` does not
    // collapse to empty when its start exceeds its end (it returns the two endpoints
    // instead — the same gotcha `atLeast`/`hasPair` exist to dodge, just at the OTHER
    // end of the range), so the last position's empty tail needs an explicit floor.
    [
      "If",
      less("i", semilength),
      count(
        ["Range", add("i", 1), semilength],
        or(equals(areaAt("i"), areaAt("j")), equals(areaAt("i"), add(areaAt("j"), 1))),
        "j",
      ),
      0,
    ],
  ),
);
/** The bounce statistic, from the bounce path that starts at the end of the path. */
const bounceWalk = (field: number): MathJSON =>
  bindList("ceilings", bounceCeilings, ["At", fold(upTo(semilength), ["List", 0, 0, 0], bounceStep), field]);
const bounceValue: MathJSON = atLeast(2, bounceWalk(3));
/** The number of cells of the staircase below the diagonal, binomial(n, 2). */
const triangle: MathJSON = ["Divide", ["Multiply", semilength, subtract(semilength, 1)], 2];

// ── helpers for FindStat's second Dyck-path batch ─────────────────────────────────────────

/** m!, with 0! = 1, from the core's `Product` and `Range`. */
const factorialOf = (m: MathJSON): MathJSON => ["If", equals(m, 0), 1, ["Product", ["Range", 1, m]]];
/** Ups through each peak, left to right: how high the peak's shadow reaches. */
const peakUps: MathJSON = forEach(peakPositions, upsUpTo("i"));
/** Downs before each peak, left to right: where the peak's shadow starts. */
const peakDowns: MathJSON = forEach(peakPositions, subtract("i", upsUpTo("i")));
/**
 * Boxes between the path and the diagonal (squares wholly above it), counted when `test` accepts
 * the number of peaks whose shadow covers the box. A peak's shadow is the boxes right of it and
 * below it. Column k (the k-th down step) rises to `ups before it`, so its boxes are rows k up to
 * that height less one.
 */
const boxesBelowPeaks = (test: (coveringPeaks: MathJSON) => MathJSON): MathJSON =>
  hasPair(
    bindList(
      "pu",
      peakUps,
      bindList(
        "pd",
        peakDowns,
        bindList(
          "downs",
          where(positions, isDown("i")),
          sumOver(
            upTo(semilength),
            [
              "If",
              less(subtract(at("k", "downs"), "k"), add("k", 1)),
              0,
              count(
                ["Range", "k", subtract(subtract(at("k", "downs"), "k"), 1)],
                test(count(upTo(["Length", "pu"]), and(less(at("q", "pd"), "k"), greater(at("q", "pu"), "c")), "q")),
                "c",
              ),
            ],
            "k",
          ),
        ),
      ),
    ),
  );

/**
 * Dyck paths whose area sequence stays on one side of this path's. The area sequence starts at 0
 * and rises by at most 1, so one pass along this path's own sequence suffices: the carried list
 * holds, at entry v+1, how many prefixes end at value v. A next value w may follow any v >= w-1,
 * and `keeps` decides whether w respects this path's entry.
 */
const areaSequenceBounded = (keeps: (next: MathJSON, bound: MathJSON) => MathJSON): MathJSON => [
  "If",
  less(semilength, 2),
  1,
  bindList(
    "s",
    areaSequence,
    floored([
      "Sum",
      fold(
        forEach(["Range", 2, semilength], at("i", "s")),
        forEach(upTo(semilength), ["If", equals("w", 1), 1, 0], "w"),
        forEach(
          upTo(semilength),
          [
            "If",
            keeps(subtract("w", 1), visiting),
            ["Sum", forEach(["Range", ["Max", ["List", subtract("w", 1), 1]], semilength], at("u", "a"), "u")],
            0,
          ],
          "w",
        ),
      ),
    ]),
  ),
];

/**
 * Walks of the same length, up or down a step at a time, that stay weakly above this path. The
 * carried list holds, at entry d+1, how many prefixes sit d above the path. Against an up step a
 * walk's up step keeps d and its down step lowers it; against a down step its up step raises d
 * and its down step keeps it; below zero is dropped.
 */
const pathsWeaklyAbove: MathJSON = bindList(
  "m",
  add(length(), 1),
  bindList(
    "start",
    forEach(upTo("m"), ["If", equals("w", 1), 1, 0], "w"),
    floored([
      "Sum",
      [
        "Fold",
        // The carried list is typed, so the compiled sum stays an integer rather than a complex number.
        [
          "Function",
          bindList(
            "next",
            forEach(
              upTo("m"),
              [
                "If",
                equals(visiting, 1),
                add(at("w", "a"), ["If", less("w", "m"), at(add("w", 1), "a"), 0]),
                add(at("w", "a"), ["If", greater("w", 1), at(subtract("w", 1), "a"), 0]),
              ],
              "w",
            ),
            "next",
          ),
          "a",
          "b",
        ],
        "start",
        x,
      ],
    ]),
  ),
  "integer",
);

/** The bounce path's climbs weigh binomial(climb, 2) each: its area, as `Area` counts it. */
const bounceAreaStep: MathJSON = [
  "If",
  equals(carried(1), semilength),
  ["List", carried(1), carried(2), carried(3)],
  [
    "List",
    at(add(carried(1), 1), "ceilings"),
    add(carried(2), 1),
    add(carried(3), [
      "Divide",
      [
        "Multiply",
        subtract(at(add(carried(1), 1), "ceilings"), carried(1)),
        subtract(subtract(at(add(carried(1), 1), "ceilings"), carried(1)), 1),
      ],
      2,
    ]),
  ],
];
const bouncePathArea: MathJSON = bindList("ceilings", bounceCeilings, [
  "At",
  fold(upTo(semilength), ["List", 0, 0, 0], bounceAreaStep),
  3,
]);

// The Delest-Viennot parallelogram polyomino of a Dyck path. Past the first up and the last down
// step, the steps pair up (2t, 2t+1); each pair is one step of each of the polyomino's two
// bounding paths: up-up is (north, east), down-down is (east, north), up-down is (east, east) and
// down-up is (north, north). One path is the odd steps then a final east step, the other an east
// step then the even steps reversed in kind (north for a down step). Column j is as tall as the
// two paths' j-th east steps are apart.
const polyominoNorthFirst: MathJSON = [
  "Join",
  forEach(upTo(semilength), step(subtract(["Multiply", 2, "i"], 1))),
  ["List", 0],
];
const polyominoEastFirst: MathJSON = [
  "Join",
  ["List", 0],
  forEach(upTo(semilength), subtract(1, step(["Multiply", 2, "i"]))),
];
/** Positions of the east steps of a path of `semilength + 1` steps. */
const eastSteps = (path: MathJSON): MathJSON => where(upTo(add(semilength, 1)), equals(at("i", path), 0));
/** Column heights, left to right, with the two paths bound as `north` and `east`. */
const withColumnHeights = (body: MathJSON): MathJSON =>
  bindList(
    "north",
    polyominoNorthFirst,
    bindList(
      "east",
      polyominoEastFirst,
      bindList(
        "northEasts",
        eastSteps("north"),
        bindList(
          "eastEasts",
          eastSteps("east"),
          bindList(
            "columns",
            forEach(upTo(["Length", "northEasts"]), subtract(at("j", "northEasts"), at("j", "eastEasts")), "j"),
            body,
          ),
        ),
      ),
    ),
  );
/** Maximal runs of east steps in a path of `semilength + 1` steps. */
const eastRuns = (path: MathJSON): MathJSON =>
  sumOver(upTo(add(semilength, 1)), [
    "If",
    equals(at("i", path), 0),
    ["If", equals("i", 1), 1, ["If", equals(at(subtract("i", 1), path), 1), 1, 0]],
    0,
  ]);

// ── helpers for FindStat's third Dyck-path batch ──────────────────────────────────────────

/** Step `i`, or 2 (neither step) when `i` is off the path, so a guard can read past either end. */
const stepOrNone = (i: MathJSON): MathJSON => ["If", and(atLeastValue(i, 1), atMostValue(i, length())), at(i), 2];
/** The first `j` whose step 2j is a down step. */
const firstEvenDown: MathJSON = ["Min", where(upTo(semilength), equals(at(["Multiply", 2, "i"]), 0))];
/**
 * Natural descents k of a set-valued two-row tableau, read off the path as FindStat gives them
 * (St001955): with j the first index whose step 2j goes down, k is one when it is past the
 * pivot and steps 2k-3, 2k-2 differ, when it is past the pivot and steps 2k-2 to 2k read 0, 1, 1,
 * when it is the pivot and steps 2k-1, 2k both go down, or when it precedes the pivot and steps
 * 2k-1, 2k read 0, 1.
 */
const isNaturalDescent = (k: MathJSON): MathJSON => {
  const s = (offset: number): MathJSON => stepOrNone(subtract(["Multiply", 2, k], offset));
  return or(
    or(
      or(
        and(atLeastValue(subtract(k, 2), "j"), equals(add(s(3), s(2)), 1)),
        and(atLeastValue(subtract(k, 1), "j"), and(and(equals(s(2), 0), equals(s(1), 1)), equals(s(0), 1))),
      ),
      and(equals(k, "j"), and(equals(s(1), 0), equals(s(0), 0))),
    ),
    and(less(k, "j"), and(equals(s(1), 0), equals(s(0), 1))),
  );
};
const naturalDescents: MathJSON = where(upTo(add(semilength, 1)), isNaturalDescent("k"), "k");

/** Steps 2p-1 and 2p as one number: 3 for up-up, 2 for up-down, 1 for down-up, 0 for down-down. */
const pairCode = (p: MathJSON): MathJSON =>
  add(["Multiply", 2, at(subtract(["Multiply", 2, p], 1))], at(["Multiply", 2, p]));
/** The invariant's descents (St001104) are the pairs p with a pair p+1 after it that breaks the pattern. */
const invariantDescents: MathJSON = count(
  upTo(subtract(semilength, 1)),
  or(
    or(
      and(
        equals(pairCode("p"), 3),
        or(
          equals(pairCode(add("p", 1)), 1),
          and(
            equals(pairCode(add("p", 1)), 0),
            greater(
              subtract(
                count(upTo(semilength), and(atMostValue("q", "p"), equals(pairCode("q"), 3)), "q"),
                count(upTo(semilength), and(less("q", "p"), equals(pairCode("q"), 0)), "q"),
              ),
              1,
            ),
          ),
        ),
      ),
      and(equals(pairCode("p"), 2), or(less(pairCode(add("p", 1)), 2), greater(pairCode(add("p", 1)), 2))),
    ),
    and(equals(pairCode("p"), 1), equals(pairCode(add("p", 1)), 0)),
  ),
  "p",
);

/**
 * The standard monomial relative to the diagonal boundary (St001508): walk the steps carrying
 * (open, blocked, found). An up step opens a column unless it reaches the next blocker, one of
 * the odd positions 1, 3, 5, ..., and then it spends that blocker; a down step with an open
 * column closes it, spends the next blocker and adds one to the monomial.
 */
const standardMonomialDegree: MathJSON = fold(
  positions,
  ["List", 0, 1, 0],
  [
    "If",
    equals(at(visiting), 1),
    [
      "If",
      less(visiting, [
        "If",
        atMostValue(carried(2), semilength),
        subtract(["Multiply", 2, carried(2)], 1),
        add(length(), 1),
      ]),
      ["List", add(carried(1), 1), carried(2), carried(3)],
      ["List", carried(1), add(carried(2), 1), carried(3)],
    ],
    [
      "If",
      greater(carried(1), 0),
      ["List", subtract(carried(1), 1), add(carried(2), 1), add(carried(3), 1)],
      ["List", carried(1), carried(2), carried(3)],
    ],
  ],
);

/**
 * The standard monomial relative to the trivial lower boundary (St001509): walk the steps carrying (open, spent,
 * found). A down step is blocked once it passes the half plus the blockers spent, and spends one then, else it opens a
 * column; an up step with an open column closes it, spends a blocker and adds one to the monomial.
 */
const lowerStandardMonomialDegree: MathJSON = fold(
  positions,
  ["List", 0, 0, 0],
  [
    "If",
    equals(at(visiting), 0),
    [
      "If",
      atMostValue(visiting, add(semilength, carried(2))),
      ["List", add(carried(1), 1), carried(2), carried(3)],
      ["List", carried(1), add(carried(2), 1), carried(3)],
    ],
    [
      "If",
      greater(carried(1), 0),
      ["List", subtract(carried(1), 1), add(carried(2), 1), add(carried(3), 1)],
      ["List", carried(1), carried(2), carried(3)],
    ],
  ],
);

/**
 * Pairs of singleton blocks of Biane's noncrossing partition (the ups whose matching downs lie in
 * one run of downs) whose merger is still noncrossing: no other block has a member strictly
 * between the two and another outside them.
 */
const mergeableSingletonPairs: MathJSON = bindList(
  "ups",
  where(positions, isUp("i")),
  bindList(
    "h",
    profile,
    bindList(
      "block",
      forEach(
        upTo(semilength),
        bindList(
          "close",
          [
            "Min",
            where(
              ["Range", add(at("j", "ups"), 1), length(), 1],
              equals(at("q", "h"), subtract(at(at("j", "ups"), "h"), 1)),
              "q",
            ),
          ],
          count(peakPositions, less("r", "close"), "r"),
          "integer",
        ),
        "j",
      ),
      bindList(
        "low",
        forEach(
          upTo(semilength),
          ["Min", where(upTo(semilength), equals(at("l", "block"), at("k", "block")), "l")],
          "k",
        ),
        bindList(
          "high",
          forEach(
            upTo(semilength),
            ["Max", where(upTo(semilength), equals(at("l", "block"), at("k", "block")), "l")],
            "k",
          ),
          sumOver(
            upTo(semilength),
            count(
              upTo(semilength),
              and(
                and(
                  greater("t", "s"),
                  equals(count(upTo(semilength), equals(at("l", "block"), at("s", "block")), "l"), 1),
                ),
                and(
                  equals(count(upTo(semilength), equals(at("l", "block"), at("t", "block")), "l"), 1),
                  equals(
                    count(
                      upTo(semilength),
                      and(
                        and(greater("k", "s"), less("k", "t")),
                        or(less(at("k", "low"), "s"), greater(at("k", "high"), "t")),
                      ),
                      "k",
                    ),
                    0,
                  ),
                ),
              ),
              "t",
            ),
            "s",
          ),
        ),
      ),
    ),
  ),
);

// The linear Nakayama algebra of a path, by its Kupisch series: the heights after the up steps from
// the right, each plus one, then 1. A module is (top vertex x, length y); it is projective when y is
// the series' entry at x, and otherwise its syzygy is (x + y, entry - y). Vertices count from 0.
const vertexCount: MathJSON = add(semilength, 1);
const kupischSeries: MathJSON = bindList(
  "h",
  profile,
  bindList("ups", where(positions, isUp("i")), [
    "Join",
    forEach(upTo(semilength), add(at(at(subtract(add(semilength, 1), "t"), "ups"), "h"), 1), "t"),
    ["List", 1],
  ]),
);
/** The projective dimension of the module (x0, y0): syzygies taken until the module is projective. */
const projectiveDimension = (x0: MathJSON, y0: MathJSON): MathJSON => [
  "At",
  fold(
    upTo(vertexCount),
    ["List", x0, y0, 0],
    bindList(
      "entry",
      at(add(carried(1), 1), "series"),
      [
        "If",
        equals(carried(2), "entry"),
        ["List", carried(1), carried(2), carried(3)],
        ["List", add(carried(1), carried(2)), subtract("entry", carried(2)), add(carried(3), 1)],
      ],
      "integer",
    ),
  ),
  3,
];
/** The projective dimension of each simple module, vertex by vertex. */
const simpleDimensions: MathJSON = forEach(upTo(vertexCount), projectiveDimension(subtract("v", 1), 1), "v");
/** `dimension` of each indecomposable injective module, by socle: the longest module ending there. */
const forInjectives = (dimension: (top: MathJSON, length: MathJSON) => MathJSON): MathJSON =>
  forEach(
    upTo(vertexCount),
    bindList(
      "top",
      [
        "Min",
        where(["Range", 0, subtract("v", 1), 1], greater(add("x", at(add("x", 1), "series")), subtract("v", 1)), "x"),
      ],
      dimension("top", subtract("v", "top")),
      "integer",
    ),
    "v",
  );
/** The projective dimension of each indecomposable injective module. */
const injectiveDimensions: MathJSON = forInjectives(projectiveDimension);
/** The series behind a 0, so that the first vertex's projective is never lengthened to its left. */
const leftSeries: MathJSON = ["Join", ["List", 0], "series"];
/**
 * The codominant dimension of the module (x0, y0): the leading terms of its minimal projective
 * resolution that are injective. The terms past the end are zero, so a projective-injective module
 * counts every tick; the cap is the vertex count. Accumulator (top, length, count, still injective).
 */
const codominantDimension = (x0: MathJSON, y0: MathJSON): MathJSON => [
  "At",
  fold(
    upTo(vertexCount),
    ["List", x0, y0, 0, 1],
    bindList(
      "entry",
      at(add(carried(1), 1), "series"),
      bindList(
        "flag",
        ["Multiply", carried(4), ["If", atMostValue(at(add(carried(1), 1), "leftSeries"), "entry"), 1, 0]],
        [
          "If",
          equals(carried(2), "entry"),
          ["List", carried(1), carried(2), add(carried(3), "flag"), "flag"],
          ["List", add(carried(1), carried(2)), subtract("entry", carried(2)), add(carried(3), "flag"), "flag"],
        ],
        "integer",
      ),
      "integer",
    ),
  ),
  3,
];
/** The codominant dimension of each indecomposable injective module. */
const injectiveCodominantDimensions: MathJSON = forInjectives(codominantDimension);
/** `body`, reading the simples' projective dimensions as `dims` and the series as `series`. */
const overSimples = (body: MathJSON): MathJSON =>
  nonEmpty(bindList("series", kupischSeries, bindList("dims", simpleDimensions, body)));
/** `body`, reading `dims` as for the simples and the injectives' as `injectiveDims`. */
const overSimplesAndInjectives = (body: MathJSON): MathJSON =>
  nonEmpty(
    bindList(
      "series",
      kupischSeries,
      bindList("dims", simpleDimensions, bindList("injectiveDims", injectiveDimensions, body)),
    ),
  );
const globalDimension: MathJSON = ["Max", "dims"];
const simplesWhere = (test: (dimension: MathJSON) => MathJSON): MathJSON => count("dims", test("d"), "d");
const injectivesWhere = (test: (dimension: MathJSON) => MathJSON): MathJSON => count("injectiveDims", test("d"), "d");
/** Every indecomposable module is an interval (top v, length 1 .. the series' entry at v, floored at 1 so `Range` stays a list); count those whose projective dimension passes `test`. */
const modulesWhere = (test: (dimension: MathJSON) => MathJSON): MathJSON =>
  floored(
    sumOver(
      upTo(vertexCount),
      count(
        forEach(upTo(["Max", at("v", "series"), 1]), projectiveDimension(subtract("v", 1), "y"), "y"),
        test("d"),
        "d",
      ),
      "v",
    ),
  );
/** The modules of the given length (those the series' entry at their top allows) whose projective dimension passes `test`. */
const modulesOfLengthWhere = (length: number, test: (dimension: MathJSON) => MathJSON): MathJSON =>
  count(
    where(upTo(vertexCount), atLeastValue(at("v", "series"), length), "v"),
    test(projectiveDimension(subtract("v", 1), length)),
    "v",
  );
/** `body`, reading the injectives' codominant dimensions as `codominantDims` besides `dims`, `injectiveDims` and `series`. */
const overInjectiveCodominants = (body: MathJSON): MathJSON =>
  nonEmpty(
    bindList(
      "series",
      kupischSeries,
      bindList(
        "leftSeries",
        leftSeries,
        bindList(
          "dims",
          simpleDimensions,
          bindList(
            "injectiveDims",
            injectiveDimensions,
            bindList("codominantDims", injectiveCodominantDimensions, body),
          ),
        ),
      ),
    ),
  );
/** The vertices whose indecomposable injective module is not projective (projective dimension above 0); the first vertex's, a simple module, always is. */
const nonProjectiveInjectives: MathJSON = where(upTo(vertexCount), greater(at("v", "injectiveDims"), 0), "v");
/** The dominant dimension of the algebra, which equals its opposite's: the least codominant dimension of a non-projective injective. */
const dominantDimension: MathJSON = ["Min", forEach(nonProjectiveInjectives, at("v", "codominantDims"), "v")];

// ── homomorphisms and extensions between interval modules ─────────────────────────────────
// A module (top x, length y) has the composition factors x .. x+y-1. Two such modules have at
// most a one-dimensional space of maps: a map is fixed by its image, which is a quotient of the
// first and a submodule of the second, and the image's length is forced by where the second ends.
/** dim Hom((x, y), (a, b)): 1 when l = a + b - x lies between 1 and both lengths, else 0. */
const homDimension = (x: MathJSON, y: MathJSON, a: MathJSON, b: MathJSON): MathJSON => {
  const image = subtract(add(a, b), x);
  return ["Max", 0, ["Min", 1, image, add(subtract(["Min", y, b], image), 1)]];
};
/** dim Ext^1((x, y), (a, b)): Hom(syzygy, N) less Hom(projective cover, N) plus Hom(M, N), from Hom(-, N) on 0 -> syzygy -> cover -> M -> 0. */
const firstExtensionDimension = (x: MathJSON, y: MathJSON, a: MathJSON, b: MathJSON): MathJSON => {
  const entry = at(add(x, 1), "series");
  return add(
    subtract(homDimension(add(x, y), subtract(entry, y), a, b), homDimension(x, entry, a, b)),
    homDimension(x, y, a, b),
  );
};
/** dim Ext^1((x, y), A) for the regular module A, the sum of the indecomposable projectives. */
const firstExtensionWithRegular = (x: MathJSON, y: MathJSON): MathJSON =>
  floored(sumOver(upTo(vertexCount), firstExtensionDimension(x, y, subtract("w", 1), at("w", "series")), "w"));
/** dim Ext^2((x, y), A) = dim Ext^1(syzygy, A); a zero syzygy has its top clamped to a real vertex. */
const secondExtensionWithRegular = (x: MathJSON, y: MathJSON): MathJSON =>
  bindList(
    "syzygyTop",
    ["Min", add(x, y), semilength],
    firstExtensionWithRegular("syzygyTop", subtract(at(add(x, 1), "series"), y)),
    "integer",
  );

/** A set of modules as parallel lists of tops and lengths, bound by `overModuleSets` as `<name>Tops` and `<name>Lengths`. */
type ModuleSet = readonly [name: string, tops: MathJSON, lengths: MathJSON];
const vertexIndices: MathJSON = upTo(vertexCount);
/** The radicals of the indecomposable projectives; the last projective is simple, so its radical is zero and left out. */
const radicals: ModuleSet = [
  "radical",
  forEach(upTo(semilength), "v", "v"),
  forEach(upTo(semilength), subtract(at("v", "series"), 1), "v"),
];
/** The squares of those radicals, lengths floored at 0 where a projective is too short to have one. */
const squaredRadicals: ModuleSet = [
  "squaredRadical",
  forEach(upTo(semilength), add("v", 1), "v"),
  forEach(upTo(semilength), ["Max", subtract(at("v", "series"), 2), 0], "v"),
];
/** The socles of the indecomposable projectives: simple modules, repeated when projectives share one. */
const projectiveSocles: ModuleSet = [
  "projectiveSocle",
  forEach(vertexIndices, subtract(add("w", at("w", "series")), 2), "w"),
  forEach(vertexIndices, 1, "w"),
];
/** The indecomposable projectives modulo their socles. */
const projectivesModuloSocle: ModuleSet = [
  "quotient",
  forEach(vertexIndices, subtract("w", 1), "w"),
  forEach(vertexIndices, subtract(at("w", "series"), 1), "w"),
];
const projectiveModules: ModuleSet = [
  "projective",
  forEach(vertexIndices, subtract("w", 1), "w"),
  forEach(vertexIndices, at("w", "series"), "w"),
];
const injectiveModules: ModuleSet = [
  "injective",
  forInjectives((top) => top),
  forInjectives((_top, injectiveLength) => injectiveLength),
];
/** `body` over the series with each module set's tops and lengths bound, and the left-shifted series too when `left` is set. */
const overModuleSets = (sets: readonly ModuleSet[], body: MathJSON, left = false): MathJSON => {
  const withSets = sets.reduceRight<MathJSON>(
    (inner, [name, tops, lengths]) => bindList(`${name}Tops`, tops, bindList(`${name}Lengths`, lengths, inner)),
    body,
  );
  return nonEmpty(bindList("series", kupischSeries, left ? bindList("leftSeries", leftSeries, withSets) : withSets));
};
/** The total of `term` over every pair of a module in the first set and one in the second. */
const pairTotal = (
  left: ModuleSet,
  right: ModuleSet,
  term: (x: MathJSON, y: MathJSON, a: MathJSON, b: MathJSON) => MathJSON,
): MathJSON => {
  const [leftName, rightName] = [left[0], right[0]];
  return floored(
    sumOver(
      upTo(["Length", `${leftName}Tops`]),
      floored(
        sumOver(
          upTo(["Length", `${rightName}Tops`]),
          term(
            at("i", `${leftName}Tops`),
            at("i", `${leftName}Lengths`),
            at("j", `${rightName}Tops`),
            at("j", `${rightName}Lengths`),
          ),
          "j",
        ),
      ),
      "i",
    ),
  );
};
/** The total first-extension dimension from the modules of one set to those of another. */
const pairExtensions = (left: ModuleSet, right: ModuleSet): MathJSON =>
  overModuleSets(left === right ? [left] : [left, right], pairTotal(left, right, firstExtensionDimension));
/** `body` over the series alone. */
const overSeries = (body: MathJSON): MathJSON => nonEmpty(bindList("series", kupischSeries, body));
/** Ext^2 with the regular module of each simple module, vertex by vertex: the syzygy of the simple at v - 1 is (v, series_v - 1). */
const simpleSecondExtensions: MathJSON = forEach(vertexIndices, secondExtensionWithRegular(subtract("v", 1), 1), "v");

/** The top of the longest module ending at the vertex `socle` (counting from 0): its injective hull's top. */
const hullTop = (socle: MathJSON): MathJSON => [
  "Min",
  where(["Range", 0, socle, 1], greater(add("x", at(add("x", 1), "series")), socle), "x"),
];
/**
 * The injective dimension of the module (x0, y0): cosyzygies taken until the module is injective.
 * The cosyzygy of a module in its hull (top, length) is (hull top, module top - hull top).
 */
const injectiveDimension = (x0: MathJSON, y0: MathJSON): MathJSON => [
  "At",
  fold(
    upTo(vertexCount),
    ["List", x0, y0, 0],
    bindList(
      "socle",
      subtract(add(carried(1), carried(2)), 1),
      bindList(
        "hull",
        hullTop("socle"),
        [
          "If",
          equals(carried(1), "hull"),
          ["List", carried(1), carried(2), carried(3)],
          ["List", "hull", subtract(carried(1), "hull"), add(carried(3), 1)],
        ],
        "integer",
      ),
      "integer",
    ),
  ),
  3,
];
/**
 * The dominant dimension of the module (x0, y0): the leading terms of its minimal injective
 * coresolution that are projective. The terms past the end are zero, so an injective module whose
 * hull is projective counts every tick; the cap is the vertex count. Accumulator (top, length,
 * count, still projective); the zero module has length 0.
 */
const dominantDimensionOfModule = (x0: MathJSON, y0: MathJSON): MathJSON => [
  "At",
  fold(
    upTo(vertexCount),
    ["List", x0, y0, 0, 1],
    bindList(
      "socle",
      ["Max", subtract(add(carried(1), carried(2)), 1), 0],
      bindList(
        "hull",
        hullTop("socle"),
        bindList(
          "flag",
          [
            "Multiply",
            carried(4),
            [
              "If",
              or(equals(carried(2), 0), equals(at(add("hull", 1), "series"), subtract(add("socle", 1), "hull"))),
              1,
              0,
            ],
          ],
          [
            "If",
            equals(carried(2), 0),
            ["List", carried(1), 0, add(carried(3), "flag"), "flag"],
            ["List", "hull", subtract(carried(1), "hull"), add(carried(3), "flag"), "flag"],
          ],
          "integer",
        ),
        "integer",
      ),
      "integer",
    ),
  ),
  3,
];
/** `body`, reading the series as `series` and the named values of the Nakayama algebra, each bound in order. */
const overNakayama = (bindings: readonly (readonly [string, MathJSON])[], body: MathJSON): MathJSON =>
  nonEmpty(
    bindList(
      "series",
      kupischSeries,
      bindings.reduceRight((inner, [name, value]) => bindList(name, value, inner), body),
    ),
  );
const simpleProjectiveDimensions = ["dims", simpleDimensions] as const;
/** `body` over the modules; the interpreter leaves a module-wise fold unevaluated unless `dims` is bound too. */
const overModules = (body: MathJSON): MathJSON => overNakayama([simpleProjectiveDimensions], body);
/** The injective dimension of each simple module, vertex by vertex. */
const simpleInjectiveDimensions = [
  "simpleInjectiveDims",
  forEach(upTo(vertexCount), injectiveDimension(subtract("v", 1), 1), "v"),
] as const;
/** The injective dimension of each indecomposable projective module, vertex by vertex. */
const projectiveInjectiveDimensions = [
  "projectiveInjectiveDims",
  forEach(upTo(vertexCount), injectiveDimension(subtract("v", 1), at("v", "series")), "v"),
] as const;
/** The dominant dimension of each simple module, vertex by vertex. */
const simpleDominantDimensions = [
  "simpleDominantDims",
  forEach(upTo(vertexCount), dominantDimensionOfModule(subtract("v", 1), 1), "v"),
] as const;
/** Every indecomposable module is (top v, length y) for y up to the series' entry at v, floored at 1 so `Range` stays a list. */
const moduleLengths: MathJSON = upTo(["Max", at("v", "series"), 1]);
/** `body` for the projective and injective dimensions of the module (top v, length y), bound as `projective` and `injective`. */
const forModules = (body: MathJSON): MathJSON =>
  bindList(
    "projective",
    projectiveDimension(subtract("v", 1), "y"),
    bindList("injective", injectiveDimension(subtract("v", 1), "y"), body, "integer"),
    "integer",
  );
/** The indecomposable modules whose projective and injective dimensions pass `test`. */
const modulesWhereBoth = (test: (projective: MathJSON, injective: MathJSON) => MathJSON): MathJSON =>
  floored(
    sumOver(
      upTo(vertexCount),
      ["Sum", forEach(moduleLengths, forModules(["If", test("projective", "injective"), 1, 0]), "y")],
      "v",
    ),
  );
/** The greatest sum of the projective and injective dimensions over the indecomposable modules. */
const modulesGreatestDimensionSum: MathJSON = [
  "Max",
  forEach(upTo(vertexCount), ["Max", forEach(moduleLengths, forModules(add("projective", "injective")), "y")], "v"),
];
const simplesCountWhere = (test: MathJSON): MathJSON => count(upTo(vertexCount), test, "v");

// ── grades and extensions of simple, injective and dual modules with the regular module ────
/** dim Hom((x, y), A) for the regular module A. */
const homWithRegular = (x: MathJSON, y: MathJSON): MathJSON =>
  floored(sumOver(upTo(vertexCount), homDimension(x, y, subtract("w", 1), at("w", "series")), "w"));
/** The syzygy of the module (x0, y0) taken `steps` times (or until it is projective), as (top, length, steps taken). */
const syzygyAfter = (x0: MathJSON, y0: MathJSON, steps: MathJSON): MathJSON =>
  bindList(
    "target",
    steps,
    fold(
      upTo(vertexCount),
      ["List", x0, y0, 0],
      bindList(
        "entry",
        at(add(carried(1), 1), "series"),
        [
          "If",
          or(equals(carried(2), "entry"), equals(carried(3), "target")),
          ["List", carried(1), carried(2), carried(3)],
          ["List", add(carried(1), carried(2)), subtract("entry", carried(2)), add(carried(3), 1)],
        ],
        "integer",
      ),
    ),
    "integer",
  );
/** dim Ext^i((x0, y0), A) for i >= 1, which is Ext^1 of the (i - 1)-th syzygy. */
const extensionWithRegularAt = (x0: MathJSON, y0: MathJSON, degree: MathJSON): MathJSON =>
  bindList(
    "syzygy",
    syzygyAfter(x0, y0, subtract(degree, 1)),
    firstExtensionWithRegular(at(1, "syzygy"), at(2, "syzygy")),
  );
/**
 * The grade of the module (x0, y0): the least i with Ext^i(M, A) nonzero. Accumulator (top, length, grade, found, ticks):
 * tick k reads Ext^(k+1) as Ext^1 of the k-th syzygy, and the grade is 0 when Hom(M, A) is nonzero.
 */
const gradeOf = (x0: MathJSON, y0: MathJSON): MathJSON => [
  "At",
  fold(
    upTo(vertexCount),
    ["List", x0, y0, 0, ["If", greater(homWithRegular(x0, y0), 0), 1, 0], 0],
    bindList(
      "cursor",
      carried(1),
      bindList(
        "extent",
        carried(2),
        bindList(
          "extension",
          firstExtensionWithRegular("cursor", "extent"),
          bindList(
            "entry",
            at(add("cursor", 1), "series"),
            bindList(
              "found",
              ["If", or(equals(carried(4), 1), greater("extension", 0)), 1, 0],
              [
                "List",
                ["If", equals("extent", "entry"), "cursor", add("cursor", "extent")],
                ["If", equals("extent", "entry"), "extent", subtract("entry", "extent")],
                [
                  "If",
                  equals(carried(4), 1),
                  carried(3),
                  ["If", greater("extension", 0), add(carried(5), 1), carried(3)],
                ],
                "found",
                add(carried(5), 1),
              ],
              "integer",
            ),
            "integer",
          ),
          "integer",
        ),
        "integer",
      ),
      "integer",
    ),
  ),
  3,
];
const injectiveGrades: MathJSON = forInjectives(gradeOf);
const simpleGrades: MathJSON = forEach(vertexIndices, gradeOf(subtract("v", 1), 1), "v");
/** The total dimension of Ext^i(D(A), A), D(A) the direct sum of the indecomposable injectives. */
const dualRegularExtensionTotal = (degree: MathJSON): MathJSON =>
  floored(["Sum", forInjectives((top, moduleLength) => extensionWithRegularAt(top, moduleLength, degree))]);
/** Simple modules S that are k-regular: projective dimension k, grade k, and Ext^k(S, A) one-dimensional. */
const regularSimples = (k: number): MathJSON =>
  overSimples(
    floored(
      sumOver(
        vertexIndices,
        [
          "If",
          equals(at("v", "dims"), k),
          [
            "If",
            equals(gradeOf(subtract("v", 1), 1), k),
            ["If", equals(extensionWithRegularAt(subtract("v", 1), 1, k), 1), 1, 0],
            0,
          ],
          0,
        ],
        "v",
      ),
    ),
  );
/** The `steps`-th cosyzygy of (x0, y0) as (top, length, steps taken); the zero module has length 0 and stays. */
const cosyzygyAfter = (x0: MathJSON, y0: MathJSON, steps: MathJSON): MathJSON =>
  fold(
    upTo(vertexCount),
    ["List", x0, y0, 0],
    bindList(
      "cursor",
      carried(1),
      bindList(
        "extent",
        carried(2),
        bindList(
          "socle",
          ["Max", subtract(add("cursor", "extent"), 1), 0],
          bindList(
            "hull",
            hullTop("socle"),
            [
              "If",
              or(equals("extent", 0), equals(carried(3), steps)),
              ["List", "cursor", "extent", carried(3)],
              ["List", "hull", subtract("cursor", "hull"), add(carried(3), 1)],
            ],
            "integer",
          ),
          "integer",
        ),
        "integer",
      ),
      "integer",
    ),
  );
/** The greatest projective dimension of the `steps`-th term of the minimal injective coresolution of the indecomposable projectives (term 0 is the injective hull). */
const coresolutionTermDimension = (steps: MathJSON): MathJSON => [
  "Max",
  forEach(
    vertexIndices,
    bindList("cosyzygy", cosyzygyAfter(subtract("v", 1), at("v", "series"), steps), [
      "If",
      equals(at(2, "cosyzygy"), 0),
      0,
      bindList(
        "socle",
        subtract(add(at(1, "cosyzygy"), at(2, "cosyzygy")), 1),
        bindList("hull", hullTop("socle"), projectiveDimension("hull", subtract(add("socle", 1), "hull")), "integer"),
        "integer",
      ),
    ]),
    "v",
  ),
];
const coresolutionTermProjectiveDimension = (steps: number): MathJSON => overSeries(coresolutionTermDimension(steps));
/** The dominant dimension of each indecomposable projective module, vertex by vertex. */
const projectiveDominantDimensions = [
  "projectiveDominantDims",
  forEach(vertexIndices, dominantDimensionOfModule(subtract("v", 1), at("v", "series")), "v"),
] as const;
/** The codominant dimension of each simple module, vertex by vertex. */
const simpleCodominantDimensions = [
  "simpleCodominantDims",
  forEach(vertexIndices, codominantDimension(subtract("v", 1), 1), "v"),
] as const;
/** The projective and injective dimensions of each projective's radical, vertex by vertex; the zero radical of a simple projective reads a clamped module and is never used. */
const radicalProjectiveDimensions = [
  "radicalProjectiveDims",
  forEach(
    vertexIndices,
    projectiveDimension(["Min", "v", semilength], ["Max", subtract(at("v", "series"), 1), 1]),
    "v",
  ),
] as const;
const radicalInjectiveDimensions = [
  "radicalInjectiveDims",
  forEach(vertexIndices, injectiveDimension(["Min", "v", semilength], ["Max", subtract(at("v", "series"), 1), 1]), "v"),
] as const;
/** The injective dimension of each projective's square radical, which starts two vertices on; read only where it is nonzero. */
const squaredRadicalInjectiveDimensions = [
  "squaredRadicalInjectiveDims",
  forEach(
    vertexIndices,
    injectiveDimension(["Min", add("v", 1), semilength], ["Max", subtract(at("v", "series"), 2), 1]),
    "v",
  ),
] as const;
const leftShiftedSeries = ["leftSeries", leftSeries] as const;
/** The indecomposable projectives that are not injective: the one before is longer, so a longer module ends at their socle. */
const projectiveNotInjective: MathJSON = greater(at("v", "leftSeries"), at("v", "series"));

// ── the algebra eAe and the quotient A/AeA, for e the idempotent of the minimal faithful projective-injective module ──
/** Whether the indecomposable projective at vertex `v` is injective: no longer projective ends at the same socle. */
const projectiveInjectiveAt = (v: MathJSON): MathJSON => atMostValue(at(v, "leftSeries"), at(v, "series"));
/** The vertices of the projective-injective modules, the ones e keeps; the first vertex is always one. */
const keptVertices: MathJSON = where(vertexIndices, projectiveInjectiveAt("v"), "v");
/**
 * The Kupisch series of eAe: the projective at a kept vertex has the kept vertices among its composition factors
 * as its length. Padded with one simple projective for each dropped vertex so the series keeps the path's
 * length; an isolated simple has projective dimension 0 and takes no part in any other module.
 */
const cornerSeries: MathJSON = bindList(
  "kept",
  keptVertices,
  forEach(
    vertexIndices,
    [
      "If",
      atMostValue("v", length("kept")),
      bind(
        "w",
        at("v", "kept"),
        count("kept", and(atLeastValue("y", "w"), less("y", add("w", at("w", "series")))), "y"),
        "integer",
      ),
      1,
    ],
    "v",
  ),
);
/**
 * The Kupisch series of A/AfA, f the idempotent at the socles of the projective-injective modules: a projective cut
 * at the first such socle at or after its top, and the projective at a socle itself dropped to an isolated simple.
 */
const quotientSeries: MathJSON = bindList(
  "socles",
  forEach(keptVertices, add("v", subtract(at("v", "series"), 1)), "v"),
  forEach(
    vertexIndices,
    [
      "If",
      greater(count("socles", equals("y", "v"), "y"), 0),
      1,
      [
        "Min",
        at("v", "series"),
        subtract(["Min", ["Join", where("socles", atLeastValue("y", "v"), "y"), ["List", add(vertexCount, 1)]]], "v"),
      ],
    ],
    "v",
  ),
);
/** `body` with the series and left shifted series of the path's algebra bound, then those of `derived`; `outer` values bind in between. */
const overDerivedSeries = (
  derived: MathJSON,
  outer: readonly (readonly [string, MathJSON, string?])[],
  body: MathJSON,
): MathJSON =>
  nonEmpty(
    bindList(
      "series",
      kupischSeries,
      bindList(
        "leftSeries",
        leftSeries,
        outer.reduceRight(
          (inner, [name, value, type]) => bindList(name, value, inner, type),
          bindList("series", derived, bindList("leftSeries", leftSeries, body)),
        ),
      ),
    ),
  );
const withSimpleDimensions = (body: MathJSON): MathJSON => bindList("dims", simpleDimensions, body);
/** The count of simples of eAe whose projective dimension passes `test`, less the padding. */
const cornerSimplesWhere = (test: (dimension: MathJSON) => MathJSON): MathJSON =>
  overDerivedSeries(
    cornerSeries,
    [["padding", subtract(vertexCount, length(keptVertices)), "integer"]],
    withSimpleDimensions(subtract(simplesWhere(test), "padding")),
  );
/**
 * The sum of the entries of the Coxeter matrix -C^-T C for the Cartan matrix C (of the opposite reading of the
 * path), up to sign. C v = 1 has the solution v = 1 on the jumps v -> v + series[v] from the first vertex and 0
 * elsewhere, and C 1 counts at each vertex the projectives that cover it, so the sum is those counts along the jumps.
 */
const coxeterEntrySum: MathJSON = [
  "At",
  fold(
    vertexIndices,
    ["List", 1, 0],
    bindList(
      "entry",
      ["If", atMostValue(carried(1), vertexCount), at(carried(1), "series"), 0],
      [
        "If",
        atMostValue(carried(1), vertexCount),
        [
          "List",
          add(carried(1), "entry"),
          add(
            carried(2),
            count(vertexIndices, and(atMostValue("j", carried(1)), less(carried(1), add("j", at("j", "series")))), "j"),
          ),
        ],
        ["List", carried(1), carried(2)],
      ],
      "integer",
    ),
  ),
  2,
];

// ── reflexive and torsionfree modules, Auslander-Reiten sequences, double duals ──────────────────────
// A value read inside a `Filter` predicate or a nested module loop is bound to a name first: a predicate sees only its
// own parameter and the names bound around it, never the parameters of an enclosing loop.
/**
 * The syzygies of the indecomposable injectives, one row per level: row `level` holds the (level - 1)-th syzygy of each
 * injective, as its tops (`part` 1) or its lengths (`part` 2), stopping at the projective it reaches. Two rows past the
 * vertex count, so that the third extension of a path with one vertex has a row to read.
 */
const syzygyChains = (part: 1 | 2): MathJSON =>
  forEach(
    upTo(add(vertexCount, 2)),
    forInjectives((top, extent) => at(part, syzygyAfter(top, extent, subtract("level", 1)))),
    "level",
  );
/** `body` over the series with the syzygies of the injectives bound as `chainTops` and `chainLengths`, read once for every Ext below. */
const overChains = (body: MathJSON): MathJSON =>
  nonEmpty(
    bindList(
      "series",
      kupischSeries,
      bindList(
        "chainTops",
        syzygyChains(1),
        bindList("chainLengths", syzygyChains(2), body, "list<list<integer>>"),
        "list<list<integer>>",
      ),
    ),
  );
/**
 * The total dim Ext^degree from the indecomposable injectives to the module (a, b): Ext^1 of each injective's
 * (degree - 1)-th syzygy, read off the maps from its syzygy, its projective cover and itself.
 */
const injectiveExtensionsInto = (a: MathJSON, b: MathJSON, degree: MathJSON): MathJSON =>
  floored(
    sumOver(
      vertexIndices,
      bindList(
        "chainTop",
        at("m", at(degree, "chainTops")),
        bindList(
          "chainLength",
          at("m", at(degree, "chainLengths")),
          bindList(
            "chainEntry",
            at(add("chainTop", 1), "series"),
            add(
              subtract(
                homDimension(add("chainTop", "chainLength"), subtract("chainEntry", "chainLength"), a, b),
                homDimension("chainTop", "chainEntry", a, b),
              ),
              homDimension("chainTop", "chainLength", a, b),
            ),
            "integer",
          ),
          "integer",
        ),
        "integer",
      ),
      "m",
    ),
  );
/** 1 when the module (top, length) is `k`-torsionfree, else 0: Ext^i(D(A), tau M) vanishes for i up to k, tau M being (top + 1, length); a projective is. */
const torsionfreeUpTo = (top: MathJSON, extent: MathJSON, k: number): MathJSON =>
  bindList(
    "moduleTop",
    top,
    bindList(
      "moduleLength",
      extent,
      [
        "If",
        equals("moduleLength", at(add("moduleTop", 1), "series")),
        1,
        [
          "If",
          equals(
            floored(sumOver(upTo(k), injectiveExtensionsInto(add("moduleTop", 1), "moduleLength", "degree"), "degree")),
            0,
          ),
          1,
          0,
        ],
      ],
      "integer",
    ),
    "integer",
  );
/** 1 when the module is reflexive, which is 2-torsionfree, else 0; the zero module is. */
const reflexiveModule = (top: MathJSON, extent: MathJSON): MathJSON =>
  bindList(
    "candidateLength",
    extent,
    ["If", equals("candidateLength", 0), 1, torsionfreeUpTo(top, "candidateLength", 2)],
    "integer",
  );
/** `body(top, length)` at every indecomposable module, combined over the lengths at each top by `combine`; a list with one entry per top. */
const eachModule = (combine: "Sum" | "Max", body: (top: MathJSON, extent: MathJSON) => MathJSON): MathJSON =>
  forEach(
    vertexIndices,
    [
      combine,
      forEach(
        moduleLengths,
        bindList(
          "moduleHead",
          subtract("v", 1),
          bindList("moduleExtent", "y", body("moduleHead", "moduleExtent"), "integer"),
          "integer",
        ),
        "y",
      ),
    ],
    "v",
  );
const isNonProjective = (top: MathJSON, extent: MathJSON): MathJSON => less(extent, at(add(top, 1), "series"));
/** `value` at each non-projective module that passes `keep`, 0 at the rest. */
const nonProjectiveWhere = (
  combine: "Sum" | "Max",
  keep: (top: MathJSON, extent: MathJSON) => MathJSON,
  value: (top: MathJSON, extent: MathJSON) => MathJSON,
): MathJSON =>
  eachModule(combine, (top, extent) => [
    "If",
    isNonProjective(top, extent),
    ["If", keep(top, extent), value(top, extent), 0],
    0,
  ]);
/** `value` at each non-projective module, 0 at the projectives. */
const nonProjective = (combine: "Sum" | "Max", value: (top: MathJSON, extent: MathJSON) => MathJSON): MathJSON =>
  eachModule(combine, (top, extent) => ["If", isNonProjective(top, extent), value(top, extent), 0]);
const isReflexive = (top: MathJSON, extent: MathJSON): MathJSON => equals(reflexiveModule(top, extent), 1);
/** Whether the non-projective module embeds in an indecomposable projective: one with the same socle that starts at or before it. */
const isTorsionless = (top: MathJSON, extent: MathJSON): MathJSON =>
  greater(count(["Range", 0, top, 1], equals(add("a", at(add("a", 1), "series")), add(top, extent)), "a"), 0);
/** The total dimension of the Auslander-Reiten sequence terms' reflexivity: 1 when every module in `terms` (top, length) is reflexive. */
const allReflexive = (terms: readonly (readonly [MathJSON, MathJSON])[]): MathJSON => [
  "If",
  equals(["Multiply", ...terms.map(([top, extent]) => reflexiveModule(top, extent))], 1),
  1,
  0,
];
/** The indecomposable projectives that are not injective, vertex `v` counting from 1: one before it is longer. */
const projectiveNotInjectiveAt = (v: MathJSON): MathJSON => greater(at(v, "leftSeries"), at(v, "series"));
/**
 * The non-injective projectives P = (top, length) whose Auslander-Reiten sequence 0 -> P -> (top - 1, length + 1) +
 * (top, length - 1) -> (top - 1, length) -> 0 has terms that are all reflexive (`wanted` 1) or not all (`wanted` 0).
 */
const projectivesWithReflexiveSequence = (wanted: 0 | 1): MathJSON =>
  overChains(
    bindList(
      "leftSeries",
      leftSeries,
      floored(
        sumOver(
          vertexIndices,
          [
            "If",
            projectiveNotInjectiveAt("v"),
            bindList(
              "head",
              subtract("v", 1),
              bindList(
                "extent",
                at("v", "series"),
                [
                  "If",
                  equals(
                    allReflexive([
                      [subtract("head", 1), add("extent", 1)],
                      ["head", subtract("extent", 1)],
                      [subtract("head", 1), "extent"],
                    ]),
                    wanted,
                  ),
                  1,
                  0,
                ],
                "integer",
              ),
              "integer",
            ),
            0,
          ],
          "v",
        ),
      ),
    ),
  );
/** The vertices (from 1) carrying the double dual of the module (top, length), the dual's support being those of the projectives it maps into. */
const doubleDualVertices = (top: MathJSON, extent: MathJSON): MathJSON =>
  bindList(
    "dualTop",
    top,
    bindList(
      "dualLength",
      extent,
      bindList(
        "support",
        where(
          vertexIndices,
          equals(homDimension("dualTop", "dualLength", subtract("w", 1), at("w", "series")), 1),
          "w",
        ),
        bindList(
          "lowest",
          subtract(["Min", ["Join", "support", ["List", add(vertexCount, 1)]]], 1),
          bindList(
            "highest",
            subtract(["Max", ["Join", "support", ["List", 0]]], 1),
            where(
              vertexIndices,
              bindList(
                "socle",
                subtract("b", 1),
                bindList(
                  "hull",
                  hullTop("socle"),
                  and(
                    atLeastValue("socle", "highest"),
                    and(atLeastValue("hull", "lowest"), atMostValue("hull", "highest")),
                  ),
                  "integer",
                ),
                "integer",
              ),
              "b",
            ),
            "integer",
          ),
          "integer",
        ),
      ),
      "integer",
    ),
    "integer",
  );
const doubleDualDimension = (top: MathJSON, extent: MathJSON): MathJSON => length(doubleDualVertices(top, extent));
const simpleDoubleDualDimensions: MathJSON = forEach(vertexIndices, doubleDualDimension(subtract("v", 1), 1), "v");

// ── the resolution quiver: each vertex goes to its own index plus its Kupisch entry, around the vertices ──
/** The images of the vertices (from 1) under v -> v + series_v, taken around the vertex count; bound as `image`. */
const resolutionImages: MathJSON = forEach(
  vertexIndices,
  add(["Mod", add(subtract("v", 1), at("v", "series")), vertexCount], 1),
  "v",
);
/** `image` applied `steps` times to the vertex `start`; a `Range` with an explicit step is empty, not descending, when `steps` is 0. */
const imagePower = (start: MathJSON, steps: MathJSON): MathJSON =>
  fold(["Range", 1, steps, 1], start, at("a", "image"), "a", "b");
/** The vertices on a cycle: the images of every vertex under as many steps as there are vertices. */
const cycleVertices: MathJSON = forEach(vertexIndices, imagePower("v", vertexCount), "v");
/** The steps from `start` until it reaches a cycle: the ticks at which it is still off every cycle. */
const stepsToCycle = (start: MathJSON): MathJSON =>
  bindList(
    "origin",
    start,
    floored(
      sumOver(
        vertexIndices,
        bindList(
          "point",
          imagePower("origin", subtract("k", 1)),
          ["If", equals(count("cycleVertices", equals("u", "point"), "u"), 0), 1, 0],
          "integer",
        ),
        "k",
      ),
    ),
    "integer",
  );
const overResolutionQuiver = (body: MathJSON): MathJSON =>
  overNakayama(
    [
      ["image", resolutionImages],
      ["cycleVertices", cycleVertices],
    ],
    body,
  );
/** The steps from the vertex furthest from every cycle to its cycle: the number of steps the powers of the map take to become periodic. */
const resolutionQuiverDepth: MathJSON = ["Max", forEach(vertexIndices, stepsToCycle("v"), "v")];

// ── regular and syzygy modules, torsionfree indices, quotients, rigidity ───────────────────────────
/** 1 when the module (top, length) is a `level`-syzygy: it embeds in a projective with the same socle, the cokernel being a (level - 1)-syzygy; the zero module is one. */
const isSyzygyModule = (level: number, top: MathJSON, extent: MathJSON): MathJSON => {
  if (level === 0) return 1;
  const [topName, extentName, source] = [`syzygyTop${level}`, `syzygyLength${level}`, `source${level}`];
  return bindList(
    topName,
    top,
    bindList(
      extentName,
      extent,
      [
        "If",
        greater(
          floored([
            "Sum",
            forEach(
              ["Range", 0, topName, 1],
              [
                "If",
                equals(add(source, at(add(source, 1), "series")), add(topName, extentName)),
                ["If", equals(source, topName), 1, isSyzygyModule(level - 1, source, subtract(topName, source))],
                0,
              ],
              source,
            ),
          ]),
          0,
        ),
        1,
        0,
      ],
      "integer",
    ),
    "integer",
  );
};
/** The least degree i up to the global dimension at which Ext^i(D(A), tau M) is nonzero, less one: how far M is torsionfree; the global dimension when none is. */
const torsionfreeIndex = (top: MathJSON, extent: MathJSON): MathJSON =>
  bindList(
    "indexTop",
    top,
    bindList(
      "indexLength",
      extent,
      bindList(
        "limit",
        ["Max", "dims"],
        subtract(
          [
            "Min",
            [
              "Join",
              where(
                ["Range", 1, "limit", 1],
                greater(injectiveExtensionsInto(add("indexTop", 1), "indexLength", "degree"), 0),
                "degree",
              ),
              ["List", add("limit", 1)],
            ],
          ],
          1,
        ),
        "integer",
      ),
      "integer",
    ),
    "integer",
  );
/** `body` over the series and the left shifted series. */
const overSeriesAndLeft = (body: MathJSON): MathJSON =>
  nonEmpty(bindList("series", kupischSeries, bindList("leftSeries", leftSeries, body)));
/** `body` over the series, the syzygies of the injectives and the simple projective dimensions `dims`. */
const overChainsAndSimples = (body: MathJSON): MathJSON => overChains(bindList("dims", simpleDimensions, body));
/** The regular modules of degree `k`: projective dimension k, no maps into A and no extensions below k, and a one-dimensional Ext^k(M, A). */
const regularModules = (k: 2): MathJSON =>
  floored([
    "Sum",
    eachModule("Sum", (top, extent) => [
      "If",
      equals(projectiveDimension(top, extent), k),
      [
        "If",
        equals(add(homWithRegular(top, extent), firstExtensionWithRegular(top, extent)), 0),
        ["If", equals(extensionWithRegularAt(top, extent, k), 1), 1, 0],
        0,
      ],
      0,
    ]),
  ]);
/** The vertices (from 1) whose indecomposable projective is injective: the tops of the minimal faithful projective-injective module. */
const keptVertexList: MathJSON = where(vertexIndices, projectiveInjectiveAt("v"), "v");
/** The sum over the vertices not kept of Ext^1 with the regular module of the quotient A/AeA's projective at that vertex, e the idempotent of the kept vertices. */
const topQuotientExtensions: MathJSON = bindList(
  "kept",
  keptVertexList,
  floored(
    sumOver(
      vertexIndices,
      [
        "If",
        projectiveNotInjectiveAt("v"),
        bindList(
          "vertex",
          "v",
          bindList(
            "reach",
            [
              "Min",
              ["Join", where("kept", greater("w", "vertex"), "w"), ["List", add(vertexCount, at("vertex", "series"))]],
            ],
            firstExtensionWithRegular(subtract("vertex", 1), [
              "Min",
              at("vertex", "series"),
              subtract("reach", "vertex"),
            ]),
            "integer",
          ),
          "integer",
        ),
        0,
      ],
      "v",
    ),
  ),
);
/** The greatest injective dimension of the projectives of A/AfA that are not dropped, f the idempotent at the socles of the kept vertices. */
const socleQuotientInjectiveDimension: MathJSON = bindList(
  "kept",
  keptVertexList,
  bindList("socleVertices", forEach("kept", add("w", subtract(at("w", "series"), 1)), "w"), [
    "Max",
    [
      "Join",
      forEach(
        vertexIndices,
        bindList(
          "vertex",
          "v",
          [
            "If",
            equals(count("socleVertices", equals("y", "vertex"), "y"), 0),
            bindList(
              "reach",
              [
                "Min",
                ["Join", where("socleVertices", atLeastValue("y", "vertex"), "y"), ["List", add(vertexCount, 1)]],
              ],
              injectiveDimension(subtract("vertex", 1), ["Min", at("vertex", "series"), subtract("reach", "vertex")]),
              "integer",
            ),
            0,
          ],
          "integer",
        ),
        "v",
      ),
      ["List", 0],
    ],
  ]),
);
/** The least i below the global dimension g where the i-th term of the injective coresolution of A has projective dimension above i, else g. */
const gorensteinDegree: MathJSON = bindList(
  "limit",
  ["Max", "dims"],
  [
    "Min",
    [
      "Join",
      where(
        ["Range", 0, subtract("limit", 1), 1],
        bindList("level", "degree", greater(coresolutionTermDimension("level"), "level"), "integer"),
        "degree",
      ),
      ["List", "limit"],
    ],
  ],
  "integer",
);

// ── the cyclic Nakayama algebra: the path's Kupisch series with its first entry added to its last ────
/** The Kupisch series of the cyclic algebra, bound as `cyclicSeries`: its vertices go around, so a module past the last one continues at the first. */
const cyclicKupischSeries: MathJSON = [
  "Join",
  forEach(upTo(semilength), at("i", "series")),
  ["List", add(at(length("series"), "series"), at(1, "series"))],
];
/** The vertex `offset` along around the cyclic algebra (counting from 0), `offset` being no less than minus `widest`, the longest projective, turns of it. */
const aroundVertices = (offset: MathJSON): MathJSON => [
  "Mod",
  add(offset, ["Multiply", vertexCount, "widest"]),
  vertexCount,
];
/** The cap on every step count: the global and dominant dimensions of a cyclic Nakayama algebra with N simples, when finite, are below 2N. */
const cyclicTicks: MathJSON = ["Range", 1, add(["Multiply", 2, vertexCount], 2), 1];
/** The projective dimension of the cyclic module (x0, y0), or infinity when the syzygies have not reached a projective within the cap. */
const cyclicProjectiveDimension = (x0: MathJSON, y0: MathJSON): MathJSON =>
  bindList(
    "reached",
    fold(
      cyclicTicks,
      ["List", x0, y0, 0],
      bindList(
        "entry",
        at(add(carried(1), 1), "cyclicSeries"),
        [
          "If",
          equals(carried(2), "entry"),
          ["List", carried(1), carried(2), carried(3)],
          [
            "List",
            ["Mod", add(carried(1), carried(2)), vertexCount],
            subtract("entry", carried(2)),
            add(carried(3), 1),
          ],
        ],
        "integer",
      ),
    ),
    [
      "If",
      equals(at(2, "reached"), at(add(at(1, "reached"), 1), "cyclicSeries")),
      at(3, "reached"),
      "PositiveInfinity",
    ],
  );
const overCyclicSeries = (body: MathJSON): MathJSON => overNakayama([["cyclicSeries", cyclicKupischSeries]], body);
/** The codominant dimension of the cyclic module (x0, y0), counting each step of the projective resolution up to the cap while its terms are injective. */
const cyclicCodominantDimension = (x0: MathJSON, y0: MathJSON): MathJSON => [
  "At",
  fold(
    cyclicTicks,
    ["List", x0, y0, 0, 1],
    bindList(
      "entry",
      at(add(carried(1), 1), "cyclicSeries"),
      bindList(
        "before",
        at(add(["Mod", add(carried(1), subtract(vertexCount, 1)), vertexCount], 1), "cyclicSeries"),
        bindList(
          "flag",
          ["Multiply", carried(4), ["If", atMostValue("before", "entry"), 1, 0]],
          [
            "If",
            equals(carried(2), "entry"),
            ["List", carried(1), carried(2), add(carried(3), "flag"), "flag"],
            [
              "List",
              ["Mod", add(carried(1), carried(2)), vertexCount],
              subtract("entry", carried(2)),
              add(carried(3), "flag"),
              "flag",
            ],
          ],
          "integer",
        ),
        "integer",
      ),
      "integer",
    ),
  ),
  3,
];
/** The longest module ending at the vertex `socle` (counting from 0), as (top, length). */
const cyclicInjective = (socle: MathJSON): MathJSON =>
  bindList(
    "ending",
    socle,
    bindList(
      "longest",
      [
        "Max",
        where(
          ["Range", 1, "widest", 1],
          atLeastValue(at(add(aroundVertices(subtract(add("ending", 1), "y")), 1), "cyclicSeries"), "y"),
          "y",
        ),
      ],
      ["List", aroundVertices(subtract(add("ending", 1), "longest")), "longest"],
      "integer",
    ),
    "integer",
  );

export const DYCK_STATISTICS: readonly Definition[] = [
  stat("Height", "The greatest height the path reaches.", nonEmpty(["Max", profile])),

  stat(
    "Peaks",
    "Occurrences of an up step immediately followed by a down step.",
    hasPair(count(upTo(subtract(length(), 1)), and(isUp("i"), isDown(nextIndex)))),
  ),
  stat(
    "Valleys",
    "Occurrences of a down step immediately followed by an up step.",
    hasPair(count(upTo(subtract(length(), 1)), and(isDown("i"), isUp(nextIndex)))),
  ),
  stat(
    "DoubleRises",
    "Occurrences of two consecutive up steps.",
    hasPair(count(upTo(subtract(length(), 1)), and(isUp("i"), isUp(nextIndex)))),
  ),

  stat(
    "Returns",
    "Points where the path comes back to height 0.",
    nonEmpty(count(positions, equals(heightAfter("i"), 0))),
  ),
  stat(
    "TouchPointCount",
    "Points where the path touches the axis — the returns.",
    nonEmpty(count(positions, equals(heightAfter("i"), 0))),
    "The catalog carries both spellings; they are the same statistic, which is why both are defined rather than one aliased to the other.",
  ),
  stat(
    "InteriorReturns",
    "Returns to height 0 strictly before the end.",
    nonEmpty(count(positions, and(equals(heightAfter("i"), 0), less("i", length())))),
  ),
  stat(
    "Hills",
    "Peaks at height 1 — an up step from the axis immediately followed by a down step.",
    hasPair(count(upTo(subtract(length(), 1)), and(and(isUp("i"), isDown(nextIndex)), equals(heightAfter("i"), 1)))),
    "Hills of size one: a hill of size k is k up steps then k down steps from the axis (`HillsOfSizeTwo`, `HillsOfSizeThree`).",
  ),

  stat(
    "InitialRise",
    "The length of the opening run of up steps.",
    nonEmpty(count(positions, equals(heightAfter("i"), "i"))),
    "Height equals the index exactly while every step so far has been an up step.",
  ),

  stat(
    "MajorIndex",
    "The sum of the descent positions of the step word — where an up step is followed by a down step.",
    hasPair(["Sum", where(upTo(subtract(length(), 1)), and(isUp("i"), isDown(nextIndex)))]),
    "Same name as the permutation statistic, genuinely a different function — which is why definitions are keyed by signature.",
  ),

  stat(
    "Area",
    "The whole squares between the path and the diagonal below it: the sum of the area sequence.",
    areaValue,
    "Haglund's area (FindStat St000012). Half of: the total of the heights after each step, less the semilength.",
  ),
  stat(
    "Coarea",
    "The complement of the area within the staircase: binomial(n, 2) less the area.",
    nonEmpty(subtract(triangle, areaValue)),
    "Zero for the highest path, UU...DD, whose area is binomial(n, 2).",
  ),
  stat("LongestAscent", "The longest run of consecutive up steps.", nonEmpty(longestRunOf(1))),
  stat("LongestDescent", "The longest run of consecutive down steps.", nonEmpty(longestRunOf(0))),

  stat(
    "Dinv",
    "The dinv statistic, read from the area sequence.",
    dinvValue,
    "dinv = #{i<j : a_i=a_j} + #{i<j : a_i=a_j+1}; the two counts never overlap (a_i=a_j and a_i=a_j+1 can't both hold), so this is one pass over the pairs.",
  ),

  // The bounce path reads the same column ceilings H(x) that dinv reads a different way:
  // start at (0,0), climb to H(0), cross to the diagonal at k_1 = H(0), climb to H(k_1), cross
  // to k_2 = H(k_1), and so on until reaching n. bounce(D) weights each climb's length by how
  // many crossings came before it — the first climb contributes nothing, the next is weighted
  // by 1, and so on. Written as a fold over n ticks rather than the unbounded "until reaching
  // n" loop: once k reaches n the step is a no-op, so a fixed n-tick fold always finishes the
  // walk (it has at most n climbs) and idles for the rest.
  stat(
    "Bounce",
    "The bounce statistic: the sum of the bounce points of the path that bounces from its end back toward the origin.",
    bounceValue,
    "FindStat St000005. (Bounce, Area) and (Area, Dinv) share the same bivariate distribution (see dyck-statistics.test.ts).",
  ),
  stat(
    "BounceCount",
    "The number of bounce points of the bounce path, not counting the two ends.",
    atLeast(2, subtract(bounceWalk(2), 1)),
  ),
  stat(
    "DinvDeficit",
    "The binomial(n, 2) less the area and the dinv: the boxes of the partition traced out by the path where leg minus arm is not 0 or 1.",
    nonEmpty(subtract(subtract(triangle, areaValue), dinvValue)),
  ),
  stat(
    "BounceDeficit",
    "The binomial(n, 2) less the area and the bounce.",
    nonEmpty(subtract(subtract(triangle, areaValue), bounceValue)),
  ),

  // ── FindStat's Dyck-path statistics, named after their descriptions ──────────────────────

  stat(
    "FirstComponentSemilength",
    "The position of the first return to height 0, counted in up steps: half the steps of the first primitive component.",
    nonEmpty(["Divide", ["Min", where(positions, equals(heightAfter("i"), 0))], 2]),
    'FindStat\'s "position of the first return" counts up steps, not steps: UD is 1.',
  ),
  stat(
    "DownStepHeightProduct",
    "The product, over the down steps, of the height each starts from.",
    nonEmpty(["Product", forEach(where(positions, isDown("i")), add(heightAfter("i"), 1))], 1),
  ),
  stat(
    "ValleysAboveAxis",
    "Valleys not on the axis: a down step followed by an up step, at height above 0.",
    hasPair(count(upTo(subtract(length(), 1)), and(and(isDown("i"), isUp(nextIndex)), greater(heightAfter("i"), 0)))),
  ),
  stat("OccurrencesOfDDU", "Occurrences of two down steps followed by an up step.", occurrencesOf(0, 0, 1)),
  stat("OccurrencesOfUUU", "Occurrences of three consecutive up steps.", occurrencesOf(1, 1, 1)),
  stat("OccurrencesOfUDU", "Occurrences of an up, a down and an up step.", occurrencesOf(1, 0, 1)),

  stat("PeakHeightSum", "The sum of the heights of the peaks.", hasPair(["Sum", peakHeights])),
  stat(
    "PeakHeightExcess",
    "The sum of the heights of the peaks, less the number of peaks.",
    hasPair(["Sum", forEach(peakHeights, subtract("h", 1), "h")]),
  ),
  stat(
    "PeakHeightSquareSum",
    "The sum of the squares of the heights of the peaks.",
    hasPair(["Sum", forEach(peakPositions, ["Multiply", heightAfter("i"), heightAfter("i")])]),
  ),
  stat("PeakHeightProduct", "The product of the heights of the peaks.", hasPair(["Product", peakHeights], 1)),

  stat("LastUpStepPosition", "The position of the last up step.", nonEmpty(["Max", where(positions, isUp("i"))])),
  stat(
    "FirstDownStepPosition",
    "The position of the first down step.",
    nonEmpty(["Min", where(positions, isDown("i"))]),
  ),
  stat("LastDoubleRisePosition", "The position of the last double rise; 0 if there is none.", hasPair(lastDoubleRise)),

  stat(
    "RisesOfLengthOne",
    "Rises (maximal runs of up steps) of length 1.",
    hasPair(bindList("lengths", riseLengths, count("lengths", equals("r", 1), "r"))),
  ),
  stat("MinimalRise", "The length of the shortest rise.", hasPair(["Min", riseLengths])),
  stat(
    "RisesOfLengthAtLeastTwo",
    "Rises (maximal runs of up steps) of length at least 2.",
    hasPair(bindList("lengths", riseLengths, count("lengths", ["GreaterEqual", "r", 2], "r"))),
  ),

  stat(
    "UpStepsAtOddPositions",
    "Up steps at an odd position, counting from 1.",
    nonEmpty(count(positions, and(isUp("i"), equals(["Mod", "i", 2], 1)))),
  ),
  stat(
    "UpStepsAfterLastDoubleRise",
    "Up steps after the first step of the last double rise; all of them if there is none.",
    hasPair(bindList("m", lastDoubleRise, count(positions, and(isUp("i"), greater("i", "m"))), "number")),
  ),

  stat(
    "DoubleRisePositionSum",
    "The sum of the positions where an up step is followed by an up step.",
    hasPair(["Sum", repeatsAt(1)]),
  ),
  stat(
    "DoubleFallPositionSum",
    "The sum of the positions where a down step is followed by a down step.",
    hasPair(["Sum", repeatsAt(0)]),
  ),
  stat(
    "MacMahonEqualIndex",
    "The sum of the positions of double rises and double falls: MacMahon's equal index of the step word.",
    hasPair(["Add", ["Sum", repeatsAt(1)], ["Sum", repeatsAt(0)]]),
  ),

  stat(
    "LogarithmicHeight",
    "The floor of the binary logarithm of the height plus one.",
    nonEmpty(
      bindList(
        "h",
        height,
        count(["Range", 1, add("h", 1)], ["LessEqual", ["Power", 2, "k"], add("h", 1)], "k"),
        "number",
      ),
    ),
  ),
  stat(
    "FirstMaximalPeakPosition",
    "The position of the up step into the first peak of maximal height.",
    nonEmpty(bindList("h", height, ["Min", where(positions, equals(heightAfter("i"), "h"))], "number")),
  ),
  stat(
    "GlobalMaxima",
    "The number of points of the path at the greatest height it reaches.",
    ["If", equals(length(), 0), 1, bindList("h", height, count(positions, equals(heightAfter("i"), "h")), "number")],
    "The origin counts as a point, so the empty path has one; otherwise these are its highest peaks.",
  ),
  stat(
    "LargestAreaSequenceEntry",
    "The largest entry of the area sequence: the greatest area to the right of an up step.",
    nonEmpty(["Max", areaSequence]),
  ),

  // ── more of FindStat's, again named after their descriptions ───────────────────────────────

  stat(
    "UpStepsAtEvenPositions",
    "Up steps at an even position, counting from 1.",
    nonEmpty(count(positions, and(isUp("i"), equals(["Mod", "i", 2], 0)))),
  ),
  stat(
    "UpperInteractions",
    "Over each valley, the shorter of the down run before it and the up run after it, summed: the factors of k down steps then k up steps.",
    interactions(0),
    "Over a valley, the shorter of the down run before it and the up run after it.",
  ),
  stat(
    "PyramidWeight",
    "Over each peak, the shorter of the up run before it and the down run after it, summed: the sizes of the maximal pyramids.",
    interactions(1),
  ),

  stat(
    "CenteredTunnels",
    "Tunnels (an up step with its matching down step) centered on the middle of the path: positions summing to the length plus one.",
    nonEmpty(tunnelCount(centered)),
  ),
  stat(
    "LeftTunnels",
    "Tunnels (an up step with its matching down step) left of the middle: positions summing to less than the length plus one.",
    nonEmpty(tunnelCount(leftOf)),
  ),
  stat(
    "NestedCenteredTunnelPairs",
    "Pairs of centered tunnels, one strictly inside the other.",
    nonEmpty(nestedTunnelPairs(centered)),
  ),
  stat(
    "NestedLeftTunnelPairs",
    "Pairs of left tunnels, one strictly inside the other.",
    nonEmpty(nestedTunnelPairs(leftOf)),
  ),
  stat(
    "ValleyTunnelSemilengthSum",
    "The sum of the semilengths of the tunnels that end at a valley.",
    hasPair(
      bindList("m", matchingUps, [
        "Sum",
        forEach(valleyPositions, ["Divide", add(subtract("p", ["At", "m", "p"]), 1), 2], "p"),
      ]),
    ),
  ),
  stat(
    "CenteredMultitunnels",
    "Factorizations of the path into three parts, the middle one a Dyck path and the outer two of equal length.",
    nonEmpty(
      bindList(
        "v",
        vertexProfile,
        count(
          upTo(semilength),
          and(equals(["At", "v", add(semilength, add("c", 1))], ["At", "v", add(subtract(semilength, "c"), 1)]), [
            "GreaterEqual",
            [
              "Min",
              forEach(
                ["Range", add(subtract(semilength, "c"), 1), add(semilength, add("c", 1))],
                ["At", "v", "j"],
                "j",
              ),
            ],
            ["At", "v", add(subtract(semilength, "c"), 1)],
          ]),
          "c",
        ),
      ),
    ),
  ),

  stat("RisesOfLengthTwo", "Rises (maximal runs of up steps) of length 2.", hasPair(risesWhere((r) => equals(r, 2)))),
  stat("RisesOfLengthThree", "Rises (maximal runs of up steps) of length 3.", hasPair(risesWhere((r) => equals(r, 3)))),
  stat(
    "RisesOfLengthAtLeastThree",
    "Rises (maximal runs of up steps) of length at least 3.",
    hasPair(risesWhere((r) => ["GreaterEqual", r, 3])),
  ),
  stat(
    "RunsOfLengthOne",
    "Maximal runs of equal steps that are a single step.",
    hasPair(sumOver(positions, ["Multiply", startsRun("i"), endsRun("i")])),
    'Counts runs of both kinds of step, up and down; FindStat\'s title, "single rises", is misleading.',
  ),
  stat(
    "RisesOfLengthOneAtOddHeight",
    "Rises of length 1 that start at an odd height.",
    atLeast(
      3,
      count(
        upTo(subtract(length(), 2)),
        and(and(isDown("i"), isUp(nextIndex)), and(isDown(add("i", 2)), equals(["Mod", heightAfter("i"), 2], 1))),
      ),
    ),
  ),

  stat(
    "PeakRectangleAreaSum",
    "The sum, over consecutive peaks, of the area of the rectangle they span with the valley between them.",
    hasPair(
      bindList(
        "peaks",
        peakPositions,
        bindList("valleys", valleyPositions, [
          "If",
          equals(["Length", "valleys"], 0),
          0,
          [
            "Sum",
            forEach(
              ["Range", 1, ["Length", "valleys"]],
              [
                "Multiply",
                subtract(["At", "valleys", "a"], ["At", "peaks", "a"]),
                subtract(["At", "peaks", add("a", 1)], ["At", "valleys", "a"]),
              ],
              "a",
            ),
          ],
        ]),
      ),
    ),
    "Positions are counted from 1; only differences enter.",
  ),
  stat(
    "SkewHookPositionSum",
    "The sum of the skew hook positions: after two up steps and a down step, the down step's rank among the down steps; after two down steps and an up step, the rank of the second down step.",
    atLeast(
      3,
      sumOver(
        ["Range", 3, length()],
        [
          "If",
          and(and(isUp(subtract("i", 2)), isUp(subtract("i", 1))), isDown("i")),
          downsUpTo("i"),
          [
            "If",
            and(and(isDown(subtract("i", 2)), isDown(subtract("i", 1))), isUp("i")),
            downsUpTo(subtract("i", 1)),
            0,
          ],
        ],
      ),
    ),
  ),
  stat(
    "DownStepMajorIndex",
    "The major index counting positions in down steps only: over each valley, the number of down steps up to and including its down step; summed.",
    hasPair(sumOver(valleyPositions, downsUpTo("i"))),
  ),
  stat(
    "UpStepMajorIndex",
    "The major index counting positions in up steps only: over each valley, the number of up steps up to its down step; summed.",
    hasPair(sumOver(valleyPositions, subtract("i", downsUpTo("i")))),
  ),

  stat(
    "LongestZigzag",
    "The length of the longest stretch of steps that alternate between up and down.",
    [
      "At",
      fold(
        x,
        ["List", 0, 0, 2],
        [
          "If",
          equals(carried(3), visiting),
          ["List", carried(1), 1, visiting],
          ["List", ["Max", ["List", carried(1), add(carried(2), 1)]], add(carried(2), 1), visiting],
        ],
      ),
      1,
    ],
    "Starts the count again at 1 on a repeated step; the accumulator is (best, current, previous step), with 2 for no previous step.",
  ),
  stat(
    "BicoloredMotzkinHeight",
    "The height of the bicolored Motzkin path made by reading the steps in pairs: two up steps rise, two down steps fall.",
    nonEmpty(["Divide", ["Max", forEach(upTo(semilength), heightAfter(["Multiply", 2, "i"]))], 2]),
  ),
  stat(
    "BicoloredMotzkinLevelSteps",
    "The level steps of that bicolored Motzkin path: pairs of steps with one up and one down.",
    nonEmpty(
      count(upTo(semilength), equals(add(step(subtract(["Multiply", 2, "i"], 1)), step(["Multiply", 2, "i"])), 1)),
    ),
  ),
  stat(
    "MinimalValleyHeight",
    "The lowest height of a valley, or the semilength if the path has none.",
    hasPair(
      bindList("valleyHeights", forEach(valleyPositions, heightAfter("i")), [
        "If",
        equals(["Length", "valleyHeights"], 0),
        semilength,
        ["Min", "valleyHeights"],
      ]),
    ),
  ),
  stat(
    "HillsOfSizeTwo",
    "Occurrences of two up steps then two down steps, starting on the axis.",
    atLeast(4, count(upTo(subtract(length(), 3)), hillAt(2))),
  ),
  stat(
    "HillsOfSizeThree",
    "Occurrences of three up steps then three down steps, starting on the axis.",
    atLeast(6, count(upTo(subtract(length(), 5)), hillAt(3))),
  ),
  stat("MinimalPeakHeight", "The height of the lowest peak.", hasPair(["Min", peakHeights])),
  stat("PeakLeftToRightMaxima", "Peaks higher than every peak to their left.", hasPair(peakMaxima("Greater"))),
  stat(
    "WeakPeakLeftToRightMaxima",
    "Peaks at least as high as every peak to their left.",
    hasPair(peakMaxima("GreaterEqual")),
  ),
  stat(
    "BoxWeight",
    "The product, over the up steps, of one more than the number of down steps before it.",
    nonEmpty(["Product", forEach(where(positions, isUp("i")), add(1, downsUpTo("i")))], 1),
    "Follows FindStat's Sage code and its data, not its description: the description gives 4 for the path UUDD, the code and every stored value give 1.",
  ),
  stat(
    "MiddleNonRunHeight",
    "The height of the middle turning point: the middle one of the peaks and valleys, left to right.",
    hasPair(
      bindList(
        "turns",
        forEach(where(upTo(subtract(length(), 1)), equals(add(step("i"), step(nextIndex)), 1)), heightAfter("i")),
        ["At", "turns", ["Divide", add(["Length", "turns"], 1), 2]],
      ),
    ),
  ),
  stat(
    "SymmetryDegree",
    "The number of step pairs, counting inward from the ends, at which the path agrees in height with its mirror image.",
    nonEmpty(
      count(
        upTo(semilength),
        and(
          equals(
            ["At", vertexProfile, subtract(["Multiply", 2, "c"], 1)],
            ["At", vertexProfile, add(subtract(length(), subtract(["Multiply", 2, "c"], 3)), 0)],
          ),
          equals(
            ["At", vertexProfile, ["Multiply", 2, "c"]],
            ["At", vertexProfile, add(subtract(length(), ["Multiply", 2, "c"]), 2)],
          ),
        ),
        "c",
      ),
    ),
    'FindStat\'s "degree of symmetry".',
  ),
  // ── FindStat's second batch: counts, boxes under peaks, polyominoes ───────────────────────

  stat(
    "ParkingFunctionCount",
    "The parking functions supported by the path: semilength factorial over the product of the factorials of the rise lengths.",
    atLeast(2, ["Divide", factorialOf(semilength), ["Product", forEach(riseLengths, factorialOf("r"), "r")]], 1),
    "A parking function is a path with the cars of each column labeled; the labels must increase up each rise, which leaves n!/(r_1! r_2! ...) of them.",
  ),
  stat(
    "ValleyPositionSum",
    "The sum of the positions of the valleys: a down step followed by an up step.",
    hasPair(["Sum", valleyPositions]),
    "FindStat St000027, \"the major index of a Dyck path\"; the repo's `MajorIndex` on a Dyck path sums the peaks' positions instead.",
  ),
  stat(
    "InteractionDifference",
    "The pyramid weight less the upper interactions: lower interactions less upper interactions.",
    subtract(interactions(1), interactions(0)),
  ),
  stat(
    "NonFinalConstantRunsOfLengthAtLeastTwo",
    "Maximal runs of equal steps, at least two long, that are followed by a step of the other kind: the occurrences of two up steps then a down step, or two down steps then an up step.",
    add(occurrencesOf(1, 1, 0), occurrencesOf(0, 0, 1)),
  ),
  stat(
    "LongTunnels",
    "The longest sequences of consecutive tunnels: the semilength less the valleys.",
    hasPair(subtract(semilength, count(upTo(subtract(length(), 1)), and(isDown("i"), isUp(nextIndex))))),
    "Tunnels meet end to start exactly at valleys, and each valley joins one pair, so merging them leaves one long tunnel per tunnel not joined.",
  ),
  stat(
    "HalfMacMahonEqualIndex",
    "Half the sum of the positions of double rises and double falls.",
    hasPair(["Divide", ["Add", ["Sum", repeatsAt(1)], ["Sum", repeatsAt(0)]], 2]),
    "Half of `MacMahonEqualIndex`, which is even on a Dyck path.",
  ),
  stat(
    "BoxesBelowOnePeak",
    "The boxes between the path and the diagonal that lie right of and below exactly one peak.",
    boxesBelowPeaks((peaks) => equals(peaks, 1)),
  ),
  stat(
    "BoxesBelowAtLeastTwoPeaks",
    "The boxes between the path and the diagonal that lie right of and below at least two peaks.",
    boxesBelowPeaks((peaks) => ["GreaterEqual", peaks, 2]),
  ),
  stat(
    "DoubleStepVisiblePoints",
    "Points below the path, at the parity of the path's height there, from which the north-east diagonal meets a double fall and the north-west diagonal meets a double rise.",
    hasPair(
      bindList(
        "vp",
        vertexProfile,
        bindList(
          "doubleRises",
          forEach(repeatsAt(1), add("i", heightAfter("i"))),
          bindList(
            "doubleFalls",
            forEach(repeatsAt(0), subtract("i", heightAfter("i"))),
            sumOver(
              ["Range", 0, length()],
              bindList(
                "h",
                at(add("v", 1), "vp"),
                [
                  "If",
                  less("h", 2),
                  0,
                  count(
                    ["Range", 1, "h"],
                    and(
                      atMostValue(["Multiply", 2, "m"], "h"),
                      and(
                        greater(
                          count("doubleRises", equals("s", add("v", subtract("h", ["Multiply", 2, "m"]))), "s"),
                          0,
                        ),
                        greater(
                          count("doubleFalls", equals("s", subtract("v", subtract("h", ["Multiply", 2, "m"]))), "s"),
                          0,
                        ),
                      ),
                    ),
                    "m",
                  ),
                ],
                "number",
              ),
              "v",
            ),
          ),
        ),
      ),
    ),
    "A point (v, j) has j = h - 2m under the path's vertex v of height h. Its north-east diagonal meets the path at a double fall (v, h') with v - j = v' - h'; its north-west diagonal at a double rise with v + j = v' + h'.",
  ),
  stat(
    "AreaAboveBouncePath",
    "The boxes between the path and its bounce path: the area less the area of the bounce path.",
    atLeast(2, subtract(areaValue, bouncePathArea)),
    "The bounce path is U^b1 D^b1 U^b2 D^b2 ... for the climbs b of the bounce walk, so its area is the sum of binomial(b, 2).",
  ),
  stat(
    "WeaklyBelowDyckPathCount",
    "The Dyck paths of the same semilength weakly below this path, itself included.",
    areaSequenceBounded((next, bound) => atMostValue(next, bound)),
    "Weakly below: each entry of the area sequence is at most this path's.",
  ),
  stat(
    "ProperlyBelowDyckPathCount",
    "The Dyck paths of the same semilength weakly below this path, itself excluded.",
    subtract(
      areaSequenceBounded((next, bound) => atMostValue(next, bound)),
      1,
    ),
  ),
  stat(
    "WeaklyAboveDyckPathCount",
    "The Dyck paths of the same semilength weakly above this path, itself included.",
    areaSequenceBounded((next, bound) => atLeastValue(next, bound)),
  ),
  stat(
    "ProperlyAboveDyckPathCount",
    "The Dyck paths of the same semilength weakly above this path, itself excluded.",
    subtract(
      areaSequenceBounded((next, bound) => atLeastValue(next, bound)),
      1,
    ),
  ),
  stat(
    "WeaklyAboveLatticePathCount",
    "The up-and-down paths of the same length, ending anywhere, that stay weakly above this path.",
    nonEmpty(pathsWeaklyAbove, 1),
    "The paths need not return to the axis: `2^n` for the highest path, the central binomial coefficient for the zigzag.",
  ),

  stat(
    "NorthStepOrderingCount",
    "The total orderings of the up steps such that the up steps after the k-th down step are never among the first k in the order.",
    atLeast(
      4,
      bindList("us", forEach(upTo(semilength), subtract(at("k", where(positions, isDown("i"))), "k"), "k"), [
        "Product",
        forEach(
          ["Range", 1, subtract(semilength, 1)],
          [
            "Divide",
            subtract(at("k", "us"), subtract("k", 1)),
            bindList(
              "t",
              ["If", equals("k", 1), at(1, "us"), subtract(at("k", "us"), at(subtract("k", 1), "us"))],
              factorialOf("t"),
              "integer",
            ),
          ],
          "k",
        ),
      ]),
      1,
    ),
    "The coefficient of z_1^a_1 ... z_n^a_n in the product of (z_1 + ... + z_k), by Stanley's product formula: each factor is the height before a down step over the factorial of the up steps since the last one.",
  ),
  stat(
    "ThreeCatalanPathCount",
    "The paths from the origin to (n, n, n) with x >= y >= z whose first two coordinates trace this Dyck path and whose last two coordinates trace it as well.",
    atLeast(
      4,
      bindList(
        "ups",
        where(positions, isUp("i")),
        bindList("downs", where(positions, isDown("i")), [
          "Product",
          forEach(
            ["Range", 1, subtract(semilength, 1)],
            bindList(
              "r",
              subtract(subtract(at(add("k", 1), "ups"), at("k", "ups")), 1),
              bindList(
                "s",
                subtract(subtract(at(add("k", 1), "downs"), at("k", "downs")), 1),
                ["Divide", factorialOf(add("r", "s")), ["Multiply", factorialOf("r"), factorialOf("s")]],
                "integer",
              ),
              "integer",
            ),
            "k",
          ),
        ]),
      ),
      1,
    ),
    "With r the downs between consecutive up steps and s the ups between consecutive down steps, the product over consecutive pairs of binomial(r + s, r).",
  ),

  stat(
    "ParallelogramPolyominoArea",
    "The cells of the parallelogram polyomino the path corresponds to under the Delest-Viennot bijection.",
    nonEmpty(withColumnHeights(["Sum", "columns"])),
  ),
  stat(
    "ParallelogramPolyominoNormalizedArea",
    "The area of the parallelogram polyomino less the semilength: the cells beyond the smallest polyomino.",
    nonEmpty(withColumnHeights(subtract(["Sum", "columns"], semilength))),
  ),
  stat(
    "ParallelogramPolyominoMinimalColumnHeight",
    "The height of the shortest column of the parallelogram polyomino.",
    nonEmpty(withColumnHeights(["Min", "columns"])),
  ),
  stat(
    "ParallelogramPolyominoMaximalColumnHeight",
    "The height of the tallest column of the parallelogram polyomino.",
    nonEmpty(withColumnHeights(["Max", "columns"])),
  ),
  stat(
    "ParallelogramPolyominoInnerCorners",
    "The inner corners of the parallelogram polyomino: the turns from east to north on its two bounding paths, not counting the corners every polyomino has.",
    nonEmpty(
      bindList(
        "north",
        polyominoNorthFirst,
        bindList("east", polyominoEastFirst, subtract(add(eastRuns("north"), eastRuns("east")), 2)),
      ),
    ),
  ),
  stat(
    "ParallelogramPolyominoUpperInnerCorners",
    "The inner corners of the polyomino's upper path: its turns from east to north, not counting the first.",
    nonEmpty(bindList("east", polyominoEastFirst, subtract(eastRuns("east"), 1))),
    "The upper path of FindStat's polyomino is the one that opens with an east step here, up to reflecting the polyomino in the diagonal.",
  ),

  // ── FindStat's third Dyck-path batch ───────────────────────────────────────────────────────

  stat(
    "SetValuedTableauNaturalDescents",
    "The natural descents of the set-valued two-row tableau the path corresponds to, read off the step pairs by FindStat's rules.",
    nonEmpty(bind("j", firstEvenDown, ["Length", naturalDescents], "integer")),
    "FindStat's St001955. The rules go through bicolored Motzkin paths; they are stated on the path itself and implemented as given.",
  ),
  stat(
    "SetValuedTableauComajorIndex",
    "The comajor index of the set-valued two-row tableau the path corresponds to: the sum, over its natural descents k, of the semilength plus one less k.",
    nonEmpty(bind("j", firstEvenDown, sumOver(naturalDescents, subtract(add(semilength, 1), "k"), "k"), "integer")),
    "FindStat's St001956; the natural descents are those of `SetValuedTableauNaturalDescents`.",
  ),
  stat(
    "AdjointInvariantDescents",
    "The descents of the invariant in a tensor power of the adjoint representation of GL2 that the path indexes, read over its step pairs.",
    atLeast(4, invariantDescents),
    "FindStat's St001104. The step pairs are up-up, up-down, down-up or down-down; a descent is a pair after which the next pair breaks the pattern, an up-up pair judged against the level reached.",
  ),
  stat(
    "DiagonalStandardMonomialDegree",
    "The degree of the standard monomial of the path relative to the diagonal boundary.",
    nonEmpty(["At", standardMonomialDegree, 3]),
    "FindStat's St001508, as its Sage code walks the path; `TrivialLowerBoundaryStandardMonomialDegree` is St001509, relative to the trivial lower boundary.",
  ),
  stat(
    "NoncrossingMergeableSingletonPairs",
    "Pairs of singleton blocks of the path's noncrossing partition that can be merged into one block, leaving the partition noncrossing.",
    nonEmpty(mergeableSingletonPairs),
    "FindStat's St001932, under Biane's bijection (`NoncrossingPartition`): the ups whose matching downs share a run form a block.",
  ),

  // Simple and injective modules of the linear Nakayama algebra of a path, by their projective dimensions.
  stat(
    "NakayamaGlobalDimension",
    "The global dimension of the linear Nakayama algebra of the path: the largest projective dimension of a simple module.",
    overSimples(globalDimension),
    "FindStat's St000684.",
  ),
  stat(
    "FirstSimpleProjectiveDimension",
    "The projective dimension of the first simple module of the path's linear Nakayama algebra.",
    overSimples(at(1, "dims")),
    "FindStat's St001135.",
  ),
  stat(
    "SimpleProjectiveDimensionSum",
    "The sum of the projective dimensions of the simple modules of the path's linear Nakayama algebra.",
    overSimples(["Sum", "dims"]),
  ),
  stat(
    "SimpleProjectiveDimensionProduct",
    "The product of the nonzero projective dimensions of the simple modules of the path's linear Nakayama algebra.",
    overSimples(["Product", forEach("dims", ["If", equals("d", 0), 1, "d"], "d")]),
  ),
  stat(
    "SimplesOfMaximalProjectiveDimension",
    "The simple modules whose projective dimension is the global dimension.",
    overSimples(simplesWhere((d) => equals(d, globalDimension))),
  ),
  stat(
    "SimplesOfProjectiveDimensionTwo",
    "The simple modules of projective dimension two.",
    overSimples(simplesWhere((d) => equals(d, 2))),
  ),
  stat(
    "SimplesOfProjectiveDimensionThree",
    "The simple modules of projective dimension three.",
    overSimples(simplesWhere((d) => equals(d, 3))),
  ),
  stat(
    "SimplesOfProjectiveDimensionFour",
    "The simple modules of projective dimension four.",
    overSimples(simplesWhere((d) => equals(d, 4))),
  ),
  stat(
    "SimplesOfProjectiveDimensionAtMostTwo",
    "The simple modules of projective dimension at most two.",
    overSimples(simplesWhere((d) => atMostValue(d, 2))),
  ),
  stat(
    "SimplesOfProjectiveDimensionAtMostThree",
    "The simple modules of projective dimension at most three.",
    overSimples(simplesWhere((d) => atMostValue(d, 3))),
  ),
  stat(
    "SimplesOfProjectiveDimensionAtMostFour",
    "The simple modules of projective dimension at most four.",
    overSimples(simplesWhere((d) => atMostValue(d, 4))),
  ),
  stat(
    "SimplesOfEvenProjectiveDimension",
    "The simple modules of even projective dimension.",
    overSimples(simplesWhere((d) => equals(["Mod", d, 2], 0))),
  ),
  stat(
    "SimplesOfMaximalEvenProjectiveDimension",
    "The simple modules whose projective dimension is the greatest even one that occurs: the global dimension if it is even, else one less.",
    overSimples(simplesWhere((d) => equals(d, subtract(globalDimension, ["Mod", globalDimension, 2])))),
  ),
  stat(
    "HalfEvenSimpleProjectiveDimensionSum",
    "Half the sum of the projective dimensions of the simple modules that have even projective dimension.",
    overSimples(["Divide", ["Sum", forEach("dims", ["If", equals(["Mod", "d", 2], 0), "d", 0], "d")], 2]),
  ),
  stat(
    "FirstSimpleOfMaximalProjectiveDimension",
    "The first vertex, counting from 0, whose simple module has projective dimension equal to the global dimension.",
    overSimples(subtract(["Min", where(upTo(vertexCount), equals(at("v", "dims"), globalDimension), "v")], 1)),
  ),
  stat(
    "LastSimpleOfMaximalProjectiveDimension",
    "The last vertex, counting from 0, whose simple module has projective dimension equal to the global dimension.",
    overSimples(subtract(["Max", where(upTo(vertexCount), equals(at("v", "dims"), globalDimension), "v")], 1)),
  ),
  stat(
    "PeaksMinusNakayamaGlobalDimension",
    "The peaks of the path less the global dimension of its linear Nakayama algebra.",
    overSimples(subtract(count(upTo(subtract(length(), 1)), and(isUp("i"), isDown(nextIndex))), globalDimension)),
  ),
  stat(
    "InjectiveProjectiveDimensionSum",
    "The sum of the projective dimensions of the indecomposable injective modules of the path's linear Nakayama algebra.",
    overSimplesAndInjectives(["Sum", "injectiveDims"]),
  ),
  stat(
    "InjectivesOfProjectiveDimensionOne",
    "The indecomposable injective modules of projective dimension one.",
    overSimplesAndInjectives(injectivesWhere((d) => equals(d, 1))),
  ),
  stat(
    "InjectivesOfProjectiveDimensionAtMostOne",
    "The indecomposable injective modules of projective dimension at most one.",
    overSimplesAndInjectives(injectivesWhere((d) => atMostValue(d, 1))),
  ),
  stat(
    "InjectivesOfProjectiveDimensionAtMostTwo",
    "The indecomposable injective modules of projective dimension at most two.",
    overSimplesAndInjectives(injectivesWhere((d) => atMostValue(d, 2))),
  ),
  stat(
    "InjectivesOfMaximalProjectiveDimension",
    "The indecomposable injective modules whose projective dimension is the global dimension.",
    overSimplesAndInjectives(injectivesWhere((d) => equals(d, globalDimension))),
  ),
  stat(
    "InjectivesOfProjectiveDimensionOneBelowMaximal",
    "The indecomposable injective modules whose projective dimension is one less than the global dimension.",
    overSimplesAndInjectives(injectivesWhere((d) => equals(d, subtract(globalDimension, 1)))),
  ),
  stat(
    "InjectivesOfEvenProjectiveDimension",
    "The indecomposable injective modules of even projective dimension.",
    overSimplesAndInjectives(injectivesWhere((d) => equals(["Mod", d, 2], 0))),
  ),
  stat(
    "ModulesOfMaximalProjectiveDimension",
    "The indecomposable modules whose projective dimension is the global dimension.",
    overSimples(modulesWhere((d) => equals(d, globalDimension))),
  ),
  stat(
    "ModulesOfProjectiveDimensionAtMostOne",
    "The indecomposable modules of projective dimension at most one.",
    overSimples(modulesWhere((d) => atMostValue(d, 1))),
  ),
  stat(
    "InjectivesOfProjectiveDimensionTwo",
    "The indecomposable injective modules of projective dimension two.",
    overSimplesAndInjectives(injectivesWhere((d) => equals(d, 2))),
  ),
  stat(
    "ModulesOfProjectiveDimensionTwo",
    "The indecomposable modules of projective dimension two.",
    overSimples(modulesWhere((d) => equals(d, 2))),
    "FindStat's St001232 is stated, and crawled, only for algebras of global dimension at most two; the count is the same definition on every path.",
  ),
  stat(
    "TwoDimensionalModulesOfProjectiveDimensionOne",
    "The indecomposable modules of dimension two and projective dimension one.",
    overSimples(modulesOfLengthWhere(2, (d) => equals(d, 1))),
  ),
  stat(
    "ThreeDimensionalModulesOfProjectiveDimensionOne",
    "The indecomposable modules of dimension three and projective dimension one.",
    overSimples(modulesOfLengthWhere(3, (d) => equals(d, 1))),
  ),
  stat(
    "SecondToLastInjectiveProjectiveDimension",
    "The projective dimension of the indecomposable injective module whose socle is the second-to-last simple module.",
    overSimplesAndInjectives(at(subtract(vertexCount, 1), "injectiveDims")),
    "FindStat's St001217, I[n-2] with the simples numbered 0 to n-1.",
  ),
  stat(
    "SimpleSummandsOfSecondRadicalLayer",
    "The simple summands of J^2/J^3 for the Jacobson radical J of the path's linear Nakayama algebra, one for each indecomposable projective of dimension at least three.",
    nonEmpty(bindList("series", kupischSeries, count("series", atLeastValue("d", 3), "d"))),
  ),
  stat(
    "NakayamaDominantDimension",
    "The dominant dimension of the path's linear Nakayama algebra.",
    overInjectiveCodominants(dominantDimension),
    "FindStat's St000685. An algebra and its opposite have the same dominant dimension, which for the opposite is the least codominant dimension of a non-projective indecomposable injective module.",
  ),
  stat(
    "NakayamaGlobalMinusDominantDimension",
    "The global dimension less the dominant dimension of the path's linear Nakayama algebra.",
    overInjectiveCodominants(subtract(globalDimension, dominantDimension)),
  ),
  stat(
    "PeaksMinusNakayamaDominantDimension",
    "The peaks of the path less the dominant dimension of its linear Nakayama algebra.",
    overInjectiveCodominants(
      subtract(count(upTo(subtract(length(), 1)), and(isUp("i"), isDown(nextIndex))), dominantDimension),
    ),
  ),
  stat(
    "InjectivesOfCodominantDimensionEqualToGlobalDimension",
    "The indecomposable injective modules whose codominant dimension is the global dimension.",
    overInjectiveCodominants(count("codominantDims", equals("d", globalDimension), "d")),
    "A projective-injective module has infinite codominant dimension, so it is never counted.",
  ),
  stat(
    "InjectivesOfCodominantDimensionAtLeastTwo",
    "The indecomposable injective modules of codominant dimension at least two.",
    overInjectiveCodominants(count("codominantDims", atLeastValue("d", 2), "d")),
  ),
  stat(
    "NonProjectiveInjectiveCodominantDimensionSum",
    "The sum of the codominant dimensions of the non-projective indecomposable injective modules.",
    overInjectiveCodominants(floored(sumOver(nonProjectiveInjectives, at("v", "codominantDims"), "v"))),
  ),
  stat(
    "ProjectiveMinusCodominantDimensionSum",
    "The sum, over the non-projective indecomposable injective modules, of their projective dimension less their codominant dimension.",
    overInjectiveCodominants(
      floored(sumOver(nonProjectiveInjectives, subtract(at("v", "injectiveDims"), at("v", "codominantDims")), "v")),
    ),
  ),
  stat(
    "SimplesOfNonMaximalProjectiveDimension",
    "The simple modules whose projective dimension is less than the global dimension.",
    overSimples(simplesWhere((d) => less(d, globalDimension))),
    "FindStat's St001170 counts the indecomposable injective modules whose socle is such a simple module: there is one injective for each simple socle.",
  ),
  stat(
    "NonProjectiveInjectiveProjectiveDimensionSpread",
    "The difference between the greatest and the least projective dimension of a non-projective indecomposable injective module.",
    overSimplesAndInjectives(subtract(["Max", "injectiveDims"], ["Min", where("injectiveDims", greater("d", 0), "d")])),
  ),

  // Projective, injective and dominant dimensions of the modules of the path's linear Nakayama algebra.
  stat(
    "ProjectivesOfMaximalInjectiveDimension",
    "The indecomposable projective modules whose injective dimension is the global dimension.",
    overNakayama(
      [simpleProjectiveDimensions, projectiveInjectiveDimensions],
      count("projectiveInjectiveDims", equals("d", globalDimension), "d"),
    ),
    "FindStat's St000999.",
  ),
  stat(
    "SimplesOfEqualProjectiveAndInjectiveDimension",
    "The simple modules whose projective dimension equals their injective dimension.",
    overNakayama(
      [simpleProjectiveDimensions, simpleInjectiveDimensions],
      simplesCountWhere(equals(at("v", "dims"), at("v", "simpleInjectiveDims"))),
    ),
  ),
  stat(
    "ModulesOfMaximalProjectiveAndInjectiveDimension",
    "The indecomposable modules whose projective and injective dimensions both equal the global dimension.",
    overModules(
      modulesWhereBoth((projective, injective) =>
        and(equals(projective, globalDimension), equals(injective, projective)),
      ),
    ),
  ),
  stat(
    "ModulesOfProjectiveAndInjectiveDimensionAtMostOne",
    "The indecomposable modules whose projective and injective dimensions are both at most one.",
    overModules(
      modulesWhereBoth((projective, injective) => and(atMostValue(projective, 1), atMostValue(injective, 1))),
    ),
  ),
  stat(
    "ModulesOfProjectiveOrInjectiveDimensionAtMostOne",
    "The indecomposable modules whose projective dimension or injective dimension is at most one.",
    overModules(modulesWhereBoth((projective, injective) => or(atMostValue(projective, 1), atMostValue(injective, 1)))),
  ),
  stat(
    "ModulesOfProjectiveAndInjectiveDimensionAtLeastTwo",
    "The indecomposable modules whose projective and injective dimensions are both at least two.",
    overModules(
      modulesWhereBoth((projective, injective) => and(atLeastValue(projective, 2), atLeastValue(injective, 2))),
    ),
  ),
  stat(
    "MaximalSimpleProjectiveAndInjectiveDimensionSum",
    "The greatest sum of the projective and the injective dimension of a simple module.",
    overNakayama(
      [simpleProjectiveDimensions, simpleInjectiveDimensions],
      ["Max", forEach(upTo(vertexCount), add(at("v", "dims"), at("v", "simpleInjectiveDims")), "v")],
    ),
  ),
  stat(
    "MaximalModuleProjectiveAndInjectiveDimensionSum",
    "The greatest sum of the projective and the injective dimension of an indecomposable module.",
    overModules(modulesGreatestDimensionSum),
  ),
  stat(
    "SimplesOfSmallInjectiveDimensionOrPositiveDominantDimension",
    "The simple modules whose injective dimension is at most one or whose dominant dimension is at least one.",
    overNakayama(
      [simpleInjectiveDimensions, simpleDominantDimensions],
      simplesCountWhere(
        or(atMostValue(at("v", "simpleInjectiveDims"), 1), atLeastValue(at("v", "simpleDominantDims"), 1)),
      ),
    ),
  ),
  stat(
    "SimplesOfDominantDimensionEqualToGlobalDimension",
    "The simple modules whose dominant dimension is the global dimension.",
    overNakayama(
      [simpleProjectiveDimensions, simpleDominantDimensions],
      count("simpleDominantDims", equals("d", globalDimension), "d"),
    ),
  ),
  stat(
    "SimplesOfDominantDimensionAtLeastThree",
    "The simple modules whose dominant dimension is at least three.",
    overNakayama([simpleDominantDimensions], count("simpleDominantDims", atLeastValue("d", 3), "d")),
  ),
  stat(
    "MaximalSimpleDominantDimension",
    "The greatest dominant dimension of a simple module.",
    overNakayama([simpleDominantDimensions], ["Max", "simpleDominantDims"]),
  ),
  stat(
    "UnitIntervalGraphTwinVertices",
    "The twin vertices of the path's unit interval graph: the indices where the next up step and the next down step each follow directly.",
    atLeast(
      4,
      bindList(
        "ups",
        where(positions, isUp("i")),
        bindList(
          "downs",
          where(positions, isDown("i")),
          count(
            upTo(subtract(semilength, 1)),
            and(
              equals(at(add("i", 1), "ups"), add(at("i", "ups"), 1)),
              equals(at(add("i", 1), "downs"), add(at("i", "downs"), 1)),
            ),
          ),
        ),
      ),
    ),
    "FindStat's St001189, the simple modules of dominant and codominant dimension zero in the Nakayama algebra. Two consecutive vertices are twins when they have the same closed neighborhood.",
  ),
  stat(
    "NonProjectiveInjectiveToNonInjectiveProjectiveHomDimension",
    "The dimension of the homomorphisms from the direct sum of the non-projective indecomposable injective modules to the direct sum of the non-injective indecomposable projective modules.",
    overModuleSets(
      [injectiveModules, projectiveModules],
      pairTotal(injectiveModules, projectiveModules, (top, moduleLength, projectiveTop, projectiveLength) => [
        "Multiply",
        [
          "Multiply",
          ["If", equals(moduleLength, at(add(top, 1), "series")), 0, 1],
          ["If", greater(at(add(projectiveTop, 1), "leftSeries"), projectiveLength), 1, 0],
        ],
        homDimension(top, moduleLength, projectiveTop, projectiveLength),
      ]),
      true,
    ),
    "FindStat's St000687. A projective is injective when the projective before it is no longer than it.",
  ),
  stat(
    "DualRegularModuleFirstExtensionDimension",
    "The dimension of the first extensions of the direct sum of the indecomposable injective modules by the regular module.",
    overSeries(floored(["Sum", forInjectives(firstExtensionWithRegular)])),
    "FindStat's St000951: the dimension of Ext^1(D(A), A). Ext^1 of an interval module is read off the maps from its syzygy and its projective cover.",
  ),
  stat(
    "RadicalEndomorphismDimension",
    "The dimension of the endomorphisms of the Jacobson radical of the path's linear Nakayama algebra.",
    overModuleSets([radicals], pairTotal(radicals, radicals, homDimension)),
    "FindStat's St001228. The radical is the sum of the radicals of the indecomposable projectives.",
  ),
  stat(
    "RadicalSelfExtensionDimension",
    "The dimension of the first extensions of the Jacobson radical by itself.",
    pairExtensions(radicals, radicals),
    "FindStat's St001225.",
  ),
  stat(
    "RadicalToSquaredRadicalExtensionDimension",
    "The dimension of the first extensions of the Jacobson radical by its square.",
    pairExtensions(radicals, squaredRadicals),
    "FindStat's St001229.",
  ),
  stat(
    "SocleToRadicalExtensionDimension",
    "The dimension of the first extensions of the socle of the regular module by the Jacobson radical.",
    pairExtensions(projectiveSocles, radicals),
    "FindStat's St001227.",
  ),
  stat(
    "RegularModuloSocleToRadicalExtensionDimension",
    "The dimension of the first extensions of the regular module modulo its socle by the Jacobson radical.",
    pairExtensions(projectivesModuloSocle, radicals),
    "FindStat's St001254.",
  ),
  stat(
    "MaximalFirstExtensionWithRegularModule",
    "The greatest dimension of the first extensions of an indecomposable module by the regular module.",
    overSeries([
      "Max",
      forEach(
        upTo(["Multiply", vertexCount, vertexCount]),
        bind(
          "v",
          add(["Divide", subtract(subtract("k", 1), ["Mod", subtract("k", 1), vertexCount]), vertexCount], 1),
          bind(
            "y",
            add(["Mod", subtract("k", 1), vertexCount], 1),
            ["If", atMostValue("y", at("v", "series")), firstExtensionWithRegular(subtract("v", 1), "y"), 0],
            "integer",
          ),
          "integer",
        ),
        "k",
      ),
    ]),
    "FindStat's St001210, over the pairs (v, y) of an indecomposable module as one list: a nested maximum would not evaluate.",
  ),
  stat(
    "ModulesOfVanishingFirstExtensionWithRegularModule",
    "The indecomposable modules with no first extension by the regular module.",
    overSeries(
      floored(
        sumOver(
          vertexIndices,
          count(
            forEach(upTo(["Max", at("v", "series"), 1]), firstExtensionWithRegular(subtract("v", 1), "y"), "y"),
            equals("d", 0),
            "d",
          ),
          "v",
        ),
      ),
    ),
    "FindStat's St001213. Every indecomposable module is (top v - 1, length 1 .. the series' entry at v).",
  ),
  stat(
    "SimplesOfVanishingSecondExtensionWithRegularModule",
    "The simple modules with no second extension by the regular module.",
    overSeries(count(simpleSecondExtensions, equals("d", 0), "d")),
    "FindStat's St001211.",
  ),
  stat(
    "MaximalSecondExtensionOfSimplesWithRegularModule",
    "The greatest dimension of the second extensions of a simple module by the regular module.",
    overSeries(["Max", simpleSecondExtensions]),
    "FindStat's St001192.",
  ),
  stat(
    "SimplesOfTwoDimensionalSecondExtensionWithRegularModule",
    "The simple modules whose second extensions by the regular module have dimension two.",
    overSeries(count(simpleSecondExtensions, equals("d", 2), "d")),
    "FindStat's St001221.",
  ),
  stat(
    "InjectivesOfNonVanishingSecondExtensionWithRegularModule",
    "The indecomposable injective modules with a nonzero second extension by the regular module.",
    overSeries(count(forInjectives(secondExtensionWithRegular), greater("d", 0), "d")),
    "FindStat's St001216.",
  ),
  stat(
    "InjectivesOfNonMaximalSocleProjectiveDimensionMinusProjectiveInjectives",
    "The indecomposable injective modules whose socle has projective dimension less than the global dimension, less the indecomposable projective-injective modules.",
    nonEmpty(
      bindList(
        "series",
        kupischSeries,
        bindList(
          "leftSeries",
          leftSeries,
          bindList(
            "dims",
            simpleDimensions,
            subtract(
              simplesWhere((d) => less(d, globalDimension)),
              count(vertexIndices, atMostValue(at("v", "leftSeries"), at("v", "series")), "v"),
            ),
          ),
        ),
      ),
    ),
    "FindStat's St001164. An indecomposable projective is injective when the one before it is no longer than it.",
  ),
  stat(
    "SocleSimplesOfVanishingFirstExtensionWithRegularModule",
    "The simple modules in the socle of the regular module that have no first extension by the regular module.",
    overSeries(
      floored(
        sumOver(
          vertexIndices,
          [
            "Multiply",
            [
              "Min",
              1,
              floored(sumOver(vertexIndices, ["If", equals(add("w", at("w", "series")), add("v", 1)), 1, 0], "w")),
            ],
            ["If", equals(firstExtensionWithRegular(subtract("v", 1), 1), 0), 1, 0],
          ],
          "v",
        ),
      ),
    ),
    "FindStat's St001483. A simple module is in the socle when some indecomposable projective ends at it.",
  ),

  // Grades, extensions with the regular module and dominant dimensions of projectives (batch 9).
  stat(
    "ProjectivesOfInjectiveDimensionAtMostDominantDimension",
    "The indecomposable projective modules whose injective dimension is at most their dominant dimension.",
    overNakayama(
      [projectiveInjectiveDimensions, projectiveDominantDimensions],
      simplesCountWhere(atMostValue(at("v", "projectiveInjectiveDims"), at("v", "projectiveDominantDims"))),
    ),
    "FindStat's St000998, read with the dominant dimension of the module itself: that is the reading its rows follow.",
  ),
  stat(
    "SimplesOfInjectiveDimensionEqualToDominantDimension",
    "The simple modules whose injective dimension equals their dominant dimension.",
    overNakayama(
      [simpleInjectiveDimensions, simpleDominantDimensions],
      simplesCountWhere(equals(at("v", "simpleInjectiveDims"), at("v", "simpleDominantDims"))),
    ),
    "FindStat's St001028, read with the dominant dimension of the module itself: that is the reading its rows follow.",
  ),
  stat(
    "NonInjectiveProjectivesOfDominantDimensionEqualToInjectiveDimension",
    "The indecomposable projective modules that are not injective and whose dominant dimension equals their injective dimension.",
    overNakayama(
      [leftShiftedSeries, projectiveInjectiveDimensions, projectiveDominantDimensions],
      simplesCountWhere(
        and(projectiveNotInjective, equals(at("v", "projectiveInjectiveDims"), at("v", "projectiveDominantDims"))),
      ),
    ),
    "FindStat's St001088.",
  ),
  stat(
    "NonInjectiveProjectivesOfDominantDimensionDifferentFromInjectiveDimension",
    "The indecomposable projective modules that are not injective and whose dominant dimension differs from their injective dimension.",
    overNakayama(
      [leftShiftedSeries, projectiveInjectiveDimensions, projectiveDominantDimensions],
      simplesCountWhere(
        and(projectiveNotInjective, [
          "NotEqual",
          at("v", "projectiveInjectiveDims"),
          at("v", "projectiveDominantDims"),
        ]),
      ),
    ),
    "FindStat's St001089: the non-injective projectives less those counted by NonInjectiveProjectivesOfDominantDimensionEqualToInjectiveDimension.",
  ),
  stat(
    "ProjectivesOfDominantDimensionEqualToGlobalDimensionOrInjective",
    "The indecomposable projective modules that are injective or whose dominant dimension is the global dimension.",
    overNakayama(
      [simpleProjectiveDimensions, leftShiftedSeries, projectiveDominantDimensions],
      simplesCountWhere(
        or(
          atMostValue(at("v", "leftSeries"), at("v", "series")),
          equals(at("v", "projectiveDominantDims"), globalDimension),
        ),
      ),
    ),
    "FindStat's St001166. A projective-injective module has dominant dimension past the global dimension, so the two cases do not overlap.",
  ),
  stat(
    "InjectivesOfGradeAtLeastOne",
    "The indecomposable injective modules of grade at least one: Hom into the regular module vanishes.",
    overSeries(count(injectiveGrades, atLeastValue("d", 1), "d")),
    "FindStat's St001184. The grade of a module M is the least i with Ext^i(M, A) nonzero.",
  ),
  stat(
    "InjectivesOfGradeAtLeastTwo",
    "The indecomposable injective modules of grade at least two.",
    overSeries(count(injectiveGrades, atLeastValue("d", 2), "d")),
    "FindStat's St001185.",
  ),
  stat(
    "InjectivesOfGradeAtLeastThree",
    "The indecomposable injective modules of grade at least three.",
    overSeries(count(injectiveGrades, atLeastValue("d", 3), "d")),
    "FindStat's St001181.",
  ),
  stat(
    "SimplesOfGradeAtLeastTwo",
    "The simple modules of grade at least two.",
    overSeries(count(simpleGrades, atLeastValue("d", 2), "d")),
    "FindStat's St001188, and St001244 (the simples of projective dimension one that are not 1-regular), which has the same values on every path of semilength 8 or less.",
  ),
  stat(
    "SimplesOfGradeAtLeastThree",
    "The simple modules of grade at least three.",
    overSeries(count(simpleGrades, atLeastValue("d", 3), "d")),
    "FindStat's St001186.",
  ),
  stat(
    "SimplesOfGradeAtLeastGlobalDimension",
    "The simple modules of grade at least the global dimension: their extensions with the regular module vanish below it.",
    overSimples(count(simpleGrades, atLeastValue("d", globalDimension), "d")),
    "FindStat's St001191.",
  ),
  stat(
    "DualRegularModuleVanishingExtensionDegrees",
    "The degrees i from 1 to the global dimension at which the extensions of the direct sum of the indecomposable injective modules by the regular module vanish.",
    overSimples(floored(sumOver(upTo(globalDimension), ["If", equals(dualRegularExtensionTotal("i"), 0), 1, 0], "i"))),
    "FindStat's St000954. Ext^i(D(A), A) is Ext^1 of the (i - 1)-th syzygy.",
  ),
  stat(
    "DualRegularModuleNonVanishingExtensionDegrees",
    "The degrees i from 1 to the global dimension at which the extensions of the direct sum of the indecomposable injective modules by the regular module do not vanish.",
    overSimples(floored(sumOver(upTo(globalDimension), ["If", greater(dualRegularExtensionTotal("i"), 0), 1, 0], "i"))),
    "FindStat's St000955.",
  ),
  stat(
    "DualRegularModuleTopExtensionDimension",
    "The dimension of the extensions in the global dimension of the direct sum of the indecomposable injective modules by the regular module.",
    overSimples(dualRegularExtensionTotal(globalDimension)),
    "FindStat's St000964.",
  ),
  stat(
    "NonZeroRadicalsOfProjectivesOfProjectiveAndInjectiveDimensionAtMostOne",
    "The nonzero radicals of the indecomposable projective modules whose projective and injective dimensions are both at most one.",
    overNakayama(
      [radicalProjectiveDimensions, radicalInjectiveDimensions],
      simplesCountWhere(
        and(
          greater(at("v", "series"), 1),
          and(atMostValue(at("v", "radicalProjectiveDims"), 1), atMostValue(at("v", "radicalInjectiveDims"), 1)),
        ),
      ),
    ),
    "FindStat's St001241. The radical of the projective at vertex v starts at v + 1.",
  ),
  stat(
    "ProjectiveSquaredRadicalsOfInjectiveDimensionAtMostOne",
    "The indecomposable projective modules whose square radical, zero included, has injective dimension at most one.",
    overNakayama(
      [squaredRadicalInjectiveDimensions],
      simplesCountWhere(or(atMostValue(at("v", "series"), 2), atMostValue(at("v", "squaredRadicalInjectiveDims"), 1))),
    ),
    "FindStat's St001240: the modules e_i J^2, the zero ones included.",
  ),
  stat(
    "SimplesOfInjectiveAndDominantDimensionOneWithDualProperty",
    "The simple modules whose injective and dominant dimensions are both one and whose projective and codominant dimensions are both one.",
    overNakayama(
      [
        leftShiftedSeries,
        simpleProjectiveDimensions,
        simpleInjectiveDimensions,
        simpleDominantDimensions,
        simpleCodominantDimensions,
      ],
      simplesCountWhere(
        and(
          and(equals(at("v", "simpleInjectiveDims"), 1), equals(at("v", "simpleDominantDims"), 1)),
          and(equals(at("v", "dims"), 1), equals(at("v", "simpleCodominantDims"), 1)),
        ),
      ),
    ),
    "FindStat's St001230.",
  ),
  stat(
    "SimplesOfNonVanishingSecondExtensionWithRegularModule",
    "The simple modules with a nonzero second extension by the regular module.",
    overSeries(count(simpleSecondExtensions, greater("d", 0), "d")),
    "FindStat's St001212.",
  ),
  stat(
    "SimplesOfOneDimensionalSecondExtensionWithRegularModule",
    "The simple modules whose second extensions by the regular module have dimension one.",
    overSeries(count(simpleSecondExtensions, equals("d", 1), "d")),
    "FindStat's St001222.",
  ),
  stat(
    "SimpleModulesSecondExtensionWithRegularModuleDimension",
    "The dimension of the second extensions of the direct sum of the simple modules by the regular module.",
    overSeries(floored(["Sum", simpleSecondExtensions])),
    "FindStat's St001215.",
  ),
  stat(
    "NakayamaFinitisticDominantDimension",
    "The greatest finite dominant dimension of an indecomposable module.",
    overSeries([
      "Max",
      forEach(
        vertexIndices,
        [
          "Max",
          forEach(
            moduleLengths,
            bindList(
              "size",
              "y",
              bindList(
                "dominant",
                dominantDimensionOfModule(subtract("v", 1), "size"),
                ["If", less("dominant", vertexCount), "dominant", 0],
                "integer",
              ),
              "integer",
            ),
            "y",
          ),
        ],
        "v",
      ),
    ]),
    "FindStat's St000686. A dominant dimension reaching the vertex count is the infinite one the fold caps at.",
  ),
  stat(
    "OneRegularSimpleModules",
    "The simple modules of projective dimension one, grade one and one-dimensional first extension by the regular module.",
    regularSimples(1),
    "FindStat's St001126. A simple module is k-regular when its projective dimension is k, Ext^k(S, A) is one-dimensional and Ext^i(S, A) vanishes below k.",
  ),
  stat("TwoRegularSimpleModules", "The simple modules that are 2-regular.", regularSimples(2), "FindStat's St001125."),
  stat(
    "ThreeRegularSimpleModules",
    "The simple modules that are 3-regular.",
    regularSimples(3),
    "FindStat's St001137.",
  ),
  stat(
    "SphericalSimpleModules",
    "The simple modules with Ext^i(S, A) zero for 0 < i < the projective dimension of S; those of projective dimension at most one count.",
    overSimples(
      floored(
        sumOver(
          vertexIndices,
          [
            "If",
            atMostValue(at("v", "dims"), 1),
            1,
            [
              "If",
              equals(
                floored(
                  sumOver(
                    upTo(semilength),
                    ["If", less("i", at("v", "dims")), extensionWithRegularAt(subtract("v", 1), 1, "i"), 0],
                    "i",
                  ),
                ),
                0,
              ),
              1,
              0,
            ],
          ],
          "v",
        ),
      ),
    ),
    "FindStat's St001994.",
  ),
  stat(
    "ProjectiveRadicalsOfVanishingFirstExtensionFromJacobsonRadical",
    "The indecomposable projective modules whose radical, zero included, has no first extension by the Jacobson radical.",
    overModuleSets(
      [radicals],
      add(
        1,
        floored(
          sumOver(
            upTo(semilength),
            [
              "If",
              equals(
                floored(
                  sumOver(
                    upTo(semilength),
                    firstExtensionDimension(
                      at("j", "radicalTops"),
                      at("j", "radicalLengths"),
                      at("i", "radicalTops"),
                      at("i", "radicalLengths"),
                    ),
                    "j",
                  ),
                ),
                0,
              ),
              1,
              0,
            ],
            "i",
          ),
        ),
      ),
    ),
    "FindStat's St001226: the number of i with Ext^1(J, e_i J) zero. The last projective is simple, so its radical is zero and counts.",
  ),
  stat(
    "RegularModuleSecondInjectiveTermProjectiveDimension",
    "The greatest projective dimension of the second term of the minimal injective coresolution of an indecomposable projective module.",
    coresolutionTermProjectiveDimension(1),
    "FindStat's St001273, which calls this the first term: its rows count the injective hull as the zeroth term, the injective hull of the first cosyzygy as the first.",
  ),
  stat(
    "RegularModuleThirdInjectiveTermProjectiveDimension",
    "The greatest projective dimension of the third term of the minimal injective coresolution of an indecomposable projective module.",
    coresolutionTermProjectiveDimension(2),
    "FindStat's St001275, which calls this the second term; see RegularModuleSecondInjectiveTermProjectiveDimension.",
  ),
  stat(
    "SimplesNotInSocleOrOfVanishingFirstExtensionWithRegularModule",
    "The simple modules that are not in the socle of the regular module or have no first extension by the regular module.",
    overSeries(
      floored(
        sumOver(
          vertexIndices,
          [
            "If",
            equals(
              floored(sumOver(vertexIndices, ["If", equals(add("w", at("w", "series")), add("v", 1)), 1, 0], "w")),
              0,
            ),
            1,
            ["If", equals(firstExtensionWithRegular(subtract("v", 1), 1), 0), 1, 0],
          ],
          "v",
        ),
      ),
    ),
    "FindStat's St001492. A simple module is in the socle when some indecomposable projective ends at it.",
  ),
  stat(
    "CornerAlgebraGlobalDimension",
    "The global dimension of the corner algebra eAe of the path's linear Nakayama algebra, e the idempotent of its minimal faithful projective-injective module.",
    overDerivedSeries(cornerSeries, [], withSimpleDimensions(["Max", "dims"])),
    "FindStat's St001197.",
  ),
  stat(
    "NakayamaGlobalMinusCornerGlobalDimension",
    "The global dimension of the path's linear Nakayama algebra less that of its corner algebra eAe.",
    overDerivedSeries(
      cornerSeries,
      [
        ["dims", simpleDimensions],
        ["fullGlobal", ["Max", "dims"], "integer"],
      ],
      withSimpleDimensions(subtract("fullGlobal", ["Max", "dims"])),
    ),
    "FindStat's St001196.",
  ),
  stat(
    "CornerAlgebraSimplesOfProjectiveDimensionAtMostOne",
    "The simple modules of the corner algebra eAe of projective dimension at most one.",
    cornerSimplesWhere((d) => atMostValue(d, 1)),
    "FindStat's St001198.",
  ),
  stat(
    "CornerAlgebraSimplesOfProjectiveDimensionAtMostTwo",
    "The simple modules of the corner algebra eAe of projective dimension at most two.",
    cornerSimplesWhere((d) => atMostValue(d, 2)),
    "FindStat's St001200.",
  ),
  stat(
    "CornerAlgebraNonSimpleProjectiveInjectives",
    "The indecomposable projective-injective modules of the corner algebra eAe that are not simple.",
    overDerivedSeries(
      cornerSeries,
      [],
      count(vertexIndices, and(projectiveInjectiveAt("v"), greater(at("v", "series"), 1)), "v"),
    ),
    "FindStat's St001205.",
  ),
  stat(
    "CornerAlgebraLongestProjective",
    "The greatest dimension of an indecomposable projective module of the corner algebra eAe, the height of its Dyck path.",
    overDerivedSeries(cornerSeries, [], ["Max", "series"]),
    "FindStat's St001206. The towers, whose corner algebra is the field, have 1.",
  ),
  stat(
    "FaithfulQuotientGlobalDimension",
    "The global dimension of the quotient A/AfA of the path's linear Nakayama algebra by the ideal of the idempotent f of its minimal faithful projective-injective left module.",
    overDerivedSeries(quotientSeries, [], withSimpleDimensions(["Max", "dims"])),
    "FindStat's St001195. A vertex f keeps is an isolated simple projective here, which has projective dimension 0. The left module Af is the one whose socles are the socles of the right projective-injective modules.",
  ),
  stat(
    "NakayamaFrobeniusDimension",
    "The dimension of the space of homomorphisms from the injective cogenerator D(A) to the regular module of the path's linear Nakayama algebra.",
    overSeries(floored(["Sum", forInjectives(homWithRegular)])),
    "FindStat's St001643, which counts over a field with three elements; the dimension does not depend on the field.",
  ),
  stat(
    "NakayamaCoxeterMatrixEntrySum",
    "The absolute value of the sum of the entries of the Coxeter matrix of the path's linear Nakayama algebra.",
    overSeries(coxeterEntrySum),
    "FindStat's St001473, the Coxeter matrix being -C^-1 C^T for the Cartan matrix C, which is lower unitriangular, so the matrix is integral.",
  ),
  stat(
    "TrivialLowerBoundaryStandardMonomialDegree",
    "The degree of the standard monomial of the path relative to the trivial lower boundary.",
    nonEmpty(["At", lowerStandardMonomialDegree, 3]),
    "FindStat's St001509, as its Sage code walks the path: the blockers are the positions after the first half, spent in order.",
  ),
  stat(
    "NonProjectiveReflexiveModules",
    "The indecomposable non-projective modules that are reflexive, in the path's linear Nakayama algebra.",
    overChains(floored(["Sum", nonProjectiveWhere("Sum", isReflexive, () => 1)])),
    "FindStat's St001253. A module is reflexive when Ext^i(D(A), tau M) vanishes for i = 1, 2.",
  ),
  stat(
    "SimpleReflexiveModules",
    "The simple modules of the path's linear Nakayama algebra that are reflexive.",
    overChains(count(vertexIndices, isReflexive(subtract("v", 1), 1), "v")),
    "FindStat's St001066.",
  ),
  stat(
    "ThreeTorsionfreeSimpleModules",
    "The simple modules of the path's linear Nakayama algebra that are 3-torsionfree: Ext^i(D(A), tau S) vanishes for i = 1, 2, 3.",
    overChains(count(vertexIndices, equals(torsionfreeUpTo(subtract("v", 1), 1, 3), 1), "v")),
    "FindStat's St001063.",
  ),
  stat(
    "LargestNonProjectiveReflexiveModule",
    "The greatest dimension of an indecomposable non-projective reflexive module of the path's linear Nakayama algebra.",
    overChains(["Max", nonProjectiveWhere("Max", isReflexive, (_top, extent) => extent)]),
    "FindStat's St001266.",
  ),
  stat(
    "NonProjectiveTorsionlessModules",
    "The indecomposable non-projective modules that are torsionless: submodules of a projective module.",
    overChains(floored(["Sum", nonProjectiveWhere("Sum", isTorsionless, () => 1)])),
    "FindStat's St001278, which also reads it as the modules fixed by tau Omega^1 composed with its inverse.",
  ),
  stat(
    "NonProjectiveReflexiveModuleTops",
    "The simple modules that are the top of an indecomposable non-projective reflexive module.",
    overChains(
      count(
        nonProjectiveWhere("Max", isReflexive, () => 1),
        greater("d", 0),
        "d",
      ),
    ),
    "FindStat's St001167.",
  ),
  stat(
    "NonInjectiveProjectivesWithReflexiveSequences",
    "The indecomposable projective non-injective modules whose Auslander-Reiten sequence has only reflexive terms.",
    projectivesWithReflexiveSequence(1),
    "FindStat's St001113.",
  ),
  stat(
    "NonInjectiveProjectivesWithNonReflexiveSequences",
    "The indecomposable projective non-injective modules whose Auslander-Reiten sequence has a term that is not reflexive.",
    projectivesWithReflexiveSequence(0),
    "FindStat's St001297, which counts the non-injective projectives less those with reflexive sequences.",
  ),
  stat(
    "SimplesWithReflexiveSequences",
    "The non-projective simple modules whose Auslander-Reiten sequence ending at them has only reflexive terms.",
    overChains(
      floored(
        sumOver(
          vertexIndices,
          [
            "If",
            greater(at("v", "series"), 1),
            bindList(
              "head",
              subtract("v", 1),
              allReflexive([
                [add("head", 1), 1],
                ["head", 2],
                ["head", 1],
              ]),
              "integer",
            ),
            0,
          ],
          "v",
        ),
      ),
    ),
    "FindStat's St001219. The sequence 0 -> tau S -> E -> S -> 0 has the middle term the module of length two on S.",
  ),
  stat(
    "LargestSimpleDoubleDualDimension",
    "The greatest dimension of the double dual of a simple module of the path's linear Nakayama algebra.",
    overSeries(["Max", simpleDoubleDualDimensions]),
    "FindStat's St001239. The dual of a module is the maps into the regular module, and the double dual the maps from that into it.",
  ),
  stat(
    "SimpleDoubleDualDimensionSum",
    "The dimension of the double dual of the top A/J of the path's linear Nakayama algebra, J the Jacobson radical.",
    overSeries(floored(["Sum", simpleDoubleDualDimensions])),
    "FindStat's St001255.",
  ),
  stat(
    "InjectiveDoubleDualDimensionSum",
    "The dimension of the double dual of D(A), the direct sum of the indecomposable injectives of the path's linear Nakayama algebra.",
    overSeries(floored(["Sum", forInjectives(doubleDualDimension)])),
    "FindStat's St001259.",
  ),
  stat(
    "SimpleDoubleDualDominantDimension",
    "The dominant dimension of the double dual of A/J, the least among its nonzero summands, for the path's linear Nakayama algebra A with Jacobson radical J.",
    overSeries([
      "Min",
      forEach(
        vertexIndices,
        bindList("dual", doubleDualVertices(subtract("v", 1), 1), [
          "If",
          greater(length("dual"), 0),
          dominantDimensionOfModule(subtract(["Min", "dual"], 1), length("dual")),
          1000,
        ]),
        "v",
      ),
    ]),
    "FindStat's St001257. A projective-injective summand counts every step up to the vertex count.",
  ),
  stat(
    "ResolutionQuiverDepth",
    "The greatest number of steps from a vertex to a cycle in the resolution quiver of the path's linear Nakayama algebra, where each vertex goes to its own index plus its Kupisch entry, around the vertices.",
    overResolutionQuiver(resolutionQuiverDepth),
    "FindStat's St001503.",
  ),
  stat(
    "ResolutionQuiverMergingIndegreeSum",
    "The sum of the indegrees of the vertices of the resolution quiver of the path's linear Nakayama algebra that have indegree at least two.",
    overResolutionQuiver(
      floored(
        sumOver(
          vertexIndices,
          bindList(
            "target",
            "v",
            bindList(
              "indegree",
              count("image", equals("u", "target"), "u"),
              ["If", atLeastValue("indegree", 2), "indegree", 0],
              "integer",
            ),
            "integer",
          ),
          "v",
        ),
      ),
    ),
    "FindStat's St001504.",
  ),
  stat(
    "ResolutionQuiverMonoidSize",
    "The number of elements of the monoid generated by the map of the resolution quiver of the path's linear Nakayama algebra: the depth plus the least common multiple of its cycle lengths.",
    overResolutionQuiver(
      add(
        resolutionQuiverDepth,
        fold(
          "cycleVertices",
          1,
          bindList(
            "onCycle",
            visiting,
            ["LCM", "a", ["Min", where(vertexIndices, equals(imagePower("onCycle", "k"), "onCycle"), "k")]],
            "integer",
          ),
        ),
      ),
    ),
    "FindStat's St001505: the powers of the map are distinct until the depth and then repeat with the period.",
  ),
  stat(
    "TwoRegularModules",
    "The indecomposable modules of projective dimension 2 whose only nonvanishing Ext group with the regular module is Ext^2, one-dimensional.",
    overSeries(regularModules(2)),
    "FindStat's St001276.",
  ),
  stat(
    "MaximalSimpleTorsionfreeIndex",
    "The greatest r for which a non-projective simple module is r-torsionfree, up to the global dimension.",
    overChainsAndSimples([
      "Max",
      forEach(vertexIndices, ["If", greater(at("v", "series"), 1), torsionfreeIndex(subtract("v", 1), 1), 0], "v"),
    ]),
    "FindStat's St001294. Ext^i(D(A), tau S) never vanishes for every i up to the global dimension on a path of semilength 6 or less, so the cap is not reached.",
  ),
  stat(
    "MaximalTorsionfreeIndex",
    "The greatest r for which an indecomposable non-projective module is r-torsionfree, up to the global dimension.",
    overChainsAndSimples(["Max", nonProjective("Max", torsionfreeIndex)]),
    "FindStat's St001296.",
  ),
  stat(
    "ThreeSyzygySimpleModules",
    "The simple modules that are 3-syzygy modules: kernels of a chain of three maps between projectives.",
    overSeries(count(vertexIndices, equals(isSyzygyModule(3, subtract("v", 1), 1), 1), "v")),
    "FindStat's St001064. A projective module is a syzygy of every order.",
  ),
  stat(
    "TopQuotientRegularExtensionDimension",
    "The dimension of Ext^1(A/AeA, A) for the path's linear Nakayama algebra A and e the idempotent at the tops of its projective-injective modules.",
    overSeriesAndLeft(topQuotientExtensions),
    "FindStat's St001193. The quotient's projective at a vertex is the one of A cut where the next kept vertex begins.",
  ),
  stat(
    "SocleQuotientInjectiveDimension",
    "The injective dimension of A/AfA for the path's linear Nakayama algebra A and f the idempotent at the socles of its projective-injective modules.",
    overSeriesAndLeft(socleQuotientInjectiveDimension),
    "FindStat's St001194, read as the greatest injective dimension over A of the projectives of the quotient that f does not remove.",
  ),
  stat(
    "NakayamaGorensteinDegree",
    "The greatest k for which the path's linear Nakayama algebra is k-Gorenstein, capped at the global dimension.",
    overSimples(gorensteinDegree),
    "FindStat's St000930: the first terms of the minimal injective coresolution of A have projective dimension at most their index.",
  ),
  stat(
    "NakayamaDepth",
    "The depth of the path's linear Nakayama algebra: the greatest grade of a simple module.",
    overSeries(["Max", simpleGrades]),
    "FindStat's St001530.",
  ),
  stat(
    "CornerAlgebraDominantDimension",
    "The dominant dimension of the corner algebra eAe of the path's linear Nakayama algebra, e the idempotent of its minimal faithful projective-injective module.",
    overDerivedSeries(
      cornerSeries,
      [],
      bindList(
        "dims",
        simpleDimensions,
        bindList(
          "injectiveDims",
          injectiveDimensions,
          bindList("codominantDims", injectiveCodominantDimensions, [
            "If",
            greater(length(nonProjectiveInjectives), 0),
            dominantDimension,
            "PositiveInfinity",
          ]),
        ),
      ),
    ),
    "FindStat's St001199. A corner algebra with no non-projective injective module is self-injective, and has infinite dominant dimension: the towers, whose corner algebra is the field.",
  ),
  stat(
    "CyclicNakayamaGlobalDimension",
    "The global dimension of the cyclic Nakayama algebra got from the path's linear Nakayama algebra by adding the first Kupisch entry to the last.",
    overCyclicSeries(["Max", forEach(vertexIndices, cyclicProjectiveDimension(subtract("v", 1), 1), "v")]),
    "FindStat's St000969. A cyclic algebra of N simples has global dimension below 2N when it is finite, so a simple still unresolved after that many syzygies makes it infinite.",
  ),
  stat(
    "CyclicNakayamaDominantDimension",
    "The dominant dimension of the cyclic Nakayama algebra got from the path's linear Nakayama algebra by adding the first Kupisch entry to the last: the least codominant dimension of a non-projective injective module.",
    overCyclicSeries(
      bindList(
        "widest",
        ["Max", "cyclicSeries"],
        bindList(
          "least",
          [
            "Min",
            forEach(
              vertexIndices,
              bindList("module", cyclicInjective(subtract("v", 1)), [
                "If",
                less(at(2, "module"), at(add(at(1, "module"), 1), "cyclicSeries")),
                cyclicCodominantDimension(at(1, "module"), at(2, "module")),
                1000,
              ]),
              "v",
            ),
          ],
          ["If", less("least", 1000), "least", "PositiveInfinity"],
          "integer",
        ),
        "integer",
      ),
    ),
    "FindStat's St000968. The algebra is self-injective, with infinite dominant dimension, when no injective module is non-projective.",
  ),
];
