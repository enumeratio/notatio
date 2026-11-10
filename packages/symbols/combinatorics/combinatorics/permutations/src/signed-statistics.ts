// More signed-permutation statistics, over `_x` = the word of signed entries p(1) ... p(n). The points
// -n .. n are read through `q`, the list p(-n), ..., p(-1), p(0), p(1), ..., p(n) with p(-k) = -p(k)
// and p(0) = 0, so that p(k) is entry k + n + 1 of it.

import type { Definition, MathJSON } from "../../src/statistics/types.ts";
import {
  add,
  at,
  atLeastValue,
  atMostValue,
  bind,
  bindList,
  count,
  equals,
  floored,
  fold,
  forEach,
  greater,
  here,
  length,
  less,
  max,
  nonEmpty,
  positions,
  subtract,
  sumOver,
  where,
  x,
} from "../../src/statistics/vocabulary.ts";

const signed = (head: string, summary: string, expr: MathJSON, note?: string): Definition => ({
  head,
  on: "SignedPermutation",
  summary,
  expr,
  ...(note ? { note } : {}),
});

const n = length();
const negate = (value: MathJSON): MathJSON => ["Negate", value];
const times = (a: MathJSON, b: MathJSON): MathJSON => ["Multiply", a, b];
/** All of `conditions`, as a variadic And. */
const all = (...conditions: MathJSON[]): MathJSON => ["And", ...conditions];
/** Any of `conditions`, as a variadic Or. */
const any = (...conditions: MathJSON[]): MathJSON => ["Or", ...conditions];
const negativeEntries = count(positions, less(here, 0));

/** The points -n .. -1 and 1 .. n. */
const points: MathJSON = ["Join", ["Range", negate(n), -1], ["Range", 1, n]];
/** p(k) for k in -n .. n, read from `q`. */
const p = (k: MathJSON): MathJSON => at(add(k, add(n, 1)), "q");
/** `body` with `q` bound to the values p(-n) .. p(n). */
const withPoints = (body: MathJSON): MathJSON =>
  bindList(
    "q",
    forEach(
      ["Range", negate(n), n],
      ["If", greater("k", 0), at("k"), ["If", equals("k", 0), 0, negate(at(negate("k")))]],
      "k",
    ),
    body,
  );

/** Pairs (i, j) of `over` meeting `relation`. */
const pairsOf = (over: MathJSON, relation: MathJSON): MathJSON => floored(sumOver(over, count(over, relation, "j")));
/** p(i) and p(j) of the pair (i, j). */
const a: MathJSON = p("i");
const b: MathJSON = p("j");

/** Half of m, rounded down. */
const halfFloor = (m: MathJSON): MathJSON => ["Divide", subtract(m, ["Mod", m, 2]), 2];

/** i is a cut: the first i entries are the values 1 .. i up to sign. */
const isCut = (i: MathJSON): MathJSON => equals(max(forEach(["Range", 1, i], ["Abs", at("m")], "m")), i);
/** The negative entries among the first i, none for i = 0. */
const negativesUpTo = (i: MathJSON): MathJSON => count(positions, all(atMostValue("m", i), less(at("m"), 0)), "m");
/** The last cut below e, 0 when e is the first. */
const cutBefore = (e: MathJSON): MathJSON =>
  max(["Join", ["List", 0], forEach(positions, ["If", all(less("c", e), isCut("c")), "c", 0], "c")]);
/** The direct summands with an odd number of signs: each cut e closes the block after the cut before it. */
const oddBlocks: MathJSON = floored(
  sumOver(
    positions,
    ["If", all(isCut("e"), equals(["Mod", subtract(negativesUpTo("e"), negativesUpTo(cutBefore("e"))), 2], 1)), 1, 0],
    "e",
  ),
);

/** One step of the Sparre Andersen walk: 2^|p(t)|, signed as the entry at position |p(t)|. Doubling the usual weights 2^(|p(t)| - 1) keeps every sum an integer. */
const walkStep = (t: MathJSON): MathJSON =>
  times(doubling(["Abs", at(t)]), ["If", greater(at(["Abs", at(t)]), 0), 1, -1]);
/** Entry s + 1 is the walk after s steps, for s = 0 .. n, raised by 2^(n + 1) so that none is negative. */
/** 2^k for k >= 1, as k doublings: an integer the compiler can type, which Power with an exponent that might be negative is not. */
const doubling = (k: MathJSON): MathJSON => fold(["Range", 1, k], 1, times("a", 2));
const raise: MathJSON = doubling(add(n, 1));
const raisedWalk: MathJSON = forEach(
  ["Range", 0, n],
  floored(add(raise, sumOver(positions, ["If", atMostValue("t", "s"), walkStep("t"), 0], "t"))),
  "s",
);

export const FINDSTAT_SIGNED_PERMUTATION_STATISTICS_2: readonly Definition[] = [
  signed(
    "BastidasHohlwegSaliolaExcedanceCount",
    "The entries p(i) > i, plus half the negative entries, rounded up.",
    nonEmpty(add(count(positions, greater(here, "i")), halfFloor(add(negativeEntries, 1)))),
    "FindStat's St001907, half the flag excedances rounded up: floor((2 exc + neg + 1) / 2).",
  ),
  signed(
    "SignedCrossingCount",
    "Pairs i < j with j <= p(i) < p(j), pairs with j <= -p(i) < p(j), and pairs j < i with j > p(i) > p(j).",
    nonEmpty(
      add(
        add(
          pairsOf(positions, all(greater("j", "i"), atMostValue("j", here), less(here, at("j")))),
          pairsOf(positions, all(atMostValue("j", negate(here)), less(negate(here), at("j")))),
        ),
        pairsOf(positions, all(less("j", "i"), greater("j", here), greater(here, at("j")))),
      ),
    ),
    "FindStat's St001862, the crossings of the type B arc diagram. Not Crossings, which reads an unsigned permutation.",
  ),
  signed(
    "SignedSymmetricAlignmentCount",
    "Pairs -n <= i < j <= n, neither 0, with one of four alignment shapes of (i, p(i)) and (j, p(j)), where p(-k) = -p(k).",
    nonEmpty(
      withPoints(
        pairsOf(
          points,
          all(
            less("i", "j"),
            any(
              // i < j <= b < a, and j > 0 if j is a fixed point.
              all(atMostValue("j", b), less(b, a), any(less("j", b), greater("j", 0))),
              // b < a <= i < j, and i < 0 if i is a fixed point.
              all(less(b, a), atMostValue(a, "i"), any(less(a, "i"), less("i", 0))),
              // i <= a < b <= j, with i > 0 if i is fixed and j < 0 if j is fixed.
              all(
                atMostValue("i", a),
                less(a, b),
                atMostValue(b, "j"),
                any(less("i", a), greater("i", 0)),
                any(less(b, "j"), less("j", 0)),
              ),
              // a <= i < j <= b, with i < 0 if i is fixed and j > 0 if j is fixed.
              all(
                atMostValue(a, "i"),
                atMostValue("j", b),
                any(less(a, "i"), less("i", 0)),
                any(less("j", b), greater("j", 0)),
              ),
            ),
          ),
        ),
      ),
    ),
    "FindStat's St001865. A pair meeting more than one shape counts once. Not SignedAlignmentCount, which is St001822.",
  ),
  signed(
    "SignedNestingAlignmentCount",
    "Pairs (i, j) of 1 .. n with -i < -j < -p(j) < -p(i), -i < j <= p(j) < -p(i), or i < j <= p(j) < p(i).",
    nonEmpty(
      withPoints(
        pairsOf(
          positions,
          any(
            all(less(negate("i"), negate("j")), less(negate("j"), negate(b)), less(negate(b), negate(a))),
            all(less(negate("i"), "j"), atMostValue("j", b), less(b, negate(a))),
            all(less("i", "j"), atMostValue("j", b), less(b, a)),
          ),
        ),
      ),
    ),
    "FindStat's St001866.",
  ),
  signed(
    "SignedEastNorthAlignmentCount",
    "Pairs (i, j) of 1 .. n with -i < 0 < -p(i) < p(j) < j, or i <= p(i) < p(j) < j.",
    nonEmpty(
      withPoints(
        pairsOf(
          positions,
          any(
            all(less(negate("i"), 0), less(0, negate(a)), less(negate(a), b), less(b, "j")),
            all(atMostValue("i", a), less(a, b), less(b, "j")),
          ),
        ),
      ),
    ),
    "FindStat's St001867, the alignments of type EN.",
  ),
  signed(
    "SignedNorthEastAlignmentCount",
    "Pairs (i, j) of 1 .. n with p(i) < i < j <= p(j).",
    nonEmpty(withPoints(pairsOf(positions, all(less(a, "i"), less("i", "j"), atMostValue("j", b))))),
    "FindStat's St001868, the alignments of type NE.",
  ),
  signed(
    "TypeBPatternTwoThreeOneCount",
    "Triples -n <= i < j < k <= n, with 1 <= j, with p(j) > p(i) and p(i) one more than p(k), or 1 when p(k) = -1.",
    nonEmpty(
      withPoints(
        floored(
          sumOver(
            points,
            floored(
              sumOver(
                positions,
                count(
                  positions,
                  all(
                    greater("j", "i"),
                    greater("k", "j"),
                    greater(b, a),
                    equals(a, ["If", equals(p("k"), -1), 1, add(p("k"), 1)]),
                  ),
                  "k",
                ),
                "j",
              ),
            ),
          ),
        ),
      ),
    ),
    "FindStat's St001882. The last two points of the triple are positive.",
  ),
  signed(
    "OddSignBlockCount",
    "The blocks of the direct sum decomposition with an odd number of negative entries.",
    nonEmpty(oddBlocks),
    "FindStat's St001895. The blocks end at the cuts, the places i where the first i entries are 1 .. i up to sign.",
  ),
  signed(
    "SignedPermutationDepth",
    "The sum of p(i) - i over the entries p(i) > i, plus the absolute values of the negative entries, plus half the odd blocks less the negative entries.",
    nonEmpty(
      add(
        add(
          floored(sumOver(positions, ["If", greater(here, "i"), subtract(here, "i"), 0])),
          floored(sumOver(positions, ["If", less(here, 0), negate(here), 0])),
        ),
        ["Divide", subtract(oddBlocks, negativeEntries), 2],
      ),
    ),
    "FindStat's St001894. The odd blocks and the negative entries have the same parity, so the half is an integer.",
  ),
  signed(
    "SparreAndersenPositiveCount",
    "The steps at which the walk x_t = sum of 2^(|p(s)| - 1) sign(p(|p(s)|)) over s <= t is positive.",
    nonEmpty(bindList("w", raisedWalk, count(positions, greater(at(add("t", 1), "w"), raise), "t"))),
    "FindStat's St001927. The walk is read as the list w of its values, doubled and raised by 2^(n + 1).",
  ),
  signed(
    "SparreAndersenMaximumPosition",
    "The last step, from 0 to n, at which the walk of SparreAndersenPositiveCount is largest.",
    nonEmpty(
      bindList(
        "w",
        raisedWalk,
        max(forEach(["Range", 0, n], ["If", equals(at(add("s", 1), "w"), max("w")), "s", 0], "s")),
      ),
    ),
    "FindStat's St001926. The walk starts at 0, so the answer is 0 when it never rises.",
  ),
  signed(
    "SignedConnectivitySetSize",
    "1 when no entry is negative, plus the i < n for which the first i entries are 1 .. i in some order.",
    nonEmpty(
      add(
        ["If", equals(negativeEntries, 0), 1, 0],
        count(
          positions,
          all(
            less("i", n),
            equals(
              count(positions, all(atMostValue("j", "i"), greater(at("j"), 0), atMostValue(at("j"), "i")), "j"),
              "i",
            ),
          ),
        ),
      ),
    ),
    "FindStat's St001889: n less the number of generators in a reduced word, the sign change being the last generator. The generator s_i is absent when the first i entries are 1 .. i in order of no sign, and the sign change when no entry is negative.",
  ),
];

// ── Coxeter reflections and the inverse ──────────────────────────────────────────────────

/** The signed point p(w) for a point w of -n .. n, in the word bound to `word`. */
const imageIn = (word: string, w: MathJSON): MathJSON => ["If", less(w, 0), negate(at(negate(w), word)), at(w, word)];
/** Where the word `word` takes the point `from` after `steps` steps. */
const walkIn = (word: string, from: MathJSON, steps: MathJSON): MathJSON => [
  "Fold",
  ["Function", imageIn(word, "s"), "s", "r"],
  from,
  ["Range", 1, steps, 1],
];
/** Whether i is the least point of its cycle, forgetting signs, in the word bound to `word`. */
const leadsCycleIn = (word: string, i: MathJSON): MathJSON =>
  equals(count(positions, less(["Abs", walkIn(word, i, "m")], i), "m"), 0);
/** Whether the cycle of i never reaches -i: it is a positive cycle. */
const staysPositiveIn = (word: string, i: MathJSON): MathJSON =>
  equals(count(positions, equals(walkIn(word, i, "m"), negate(i)), "m"), 0);
/** The positive cycles of the word bound to `word`. */
const positiveCyclesIn = (word: string): MathJSON =>
  count(positions, all(leadsCycleIn(word, "i"), staysPositiveIn(word, "i")));
/** The least m >= 1 with p^m(i) = i as a signed point: the cycle of i, counted twice when it is negative. */
const cycleLengthIn = (word: string, i: MathJSON): MathJSON => [
  "Min",
  where(["Range", 1, times(2, n), 1], equals(walkIn(word, i, "m"), i), "m"),
];

/** The Coxeter length of the word bound to `word`, when the last generator negates the last entry (Sage's): the type B length of the word read backward with each |entry| replaced by n + 1 less it. */
const lengthIn = (word: string): MathJSON => {
  const entry = at(subtract(add(n, 1), "k"), word);
  return bindList(
    "c",
    forEach(positions, ["If", greater(entry, 0), subtract(add(n, 1), entry), subtract(negate(add(n, 1)), entry)], "k"),
    floored(
      sumOver(
        positions,
        add(
          count(positions, all(greater("j", "i"), greater(at("i", "c"), at("j", "c"))), "j"),
          count(positions, all(atLeastValue("j", "i"), greater(negate(at("i", "c")), at("j", "c"))), "j"),
        ),
      ),
    ),
  );
};

/** The word with entries u and v swapped. */
const swapped = (u: MathJSON, v: MathJSON): MathJSON => ["ReplaceAt", ["ReplaceAt", x, u, at(v)], v, at(u)];
/** The word with entries u and v swapped and negated. */
const swappedNegated = (u: MathJSON, v: MathJSON): MathJSON => [
  "ReplaceAt",
  ["ReplaceAt", x, u, negate(at(v))],
  v,
  negate(at(u)),
];
/** The word with entry u negated. */
const negatedAt = (u: MathJSON): MathJSON => ["ReplaceAt", x, u, negate(at(u))];

/** The reflections t of the group, n of them for each sign change and n(n - 1) for the transpositions, with `holds` of the word of p t, `holds` reading it as the list `q`. */
const reflectionsWhere = (holds: (word: string) => MathJSON): MathJSON => {
  const meets = (word: MathJSON): MathJSON => ["If", bindList("q", word, holds("q")), 1, 0];
  return add(
    floored(sumOver(positions, meets(negatedAt("u")), "u")),
    floored(
      sumOver(
        positions,
        floored(
          sumOver(
            where(positions, greater("v", "u"), "v"),
            add(meets(swapped("u", "v")), meets(swappedNegated("u", "v"))),
            "v",
          ),
        ),
        "u",
      ),
    ),
  );
};

/** The inverse of the word at `k`: the position of the entry k or -k, negative when the entry is -k. The position is a floored sum over the entries equal to k in absolute value. */
export const inverseAt = (k: MathJSON): MathJSON => [
  "Multiply",
  subtract(1, ["Multiply", 2, count(positions, equals(here, negate(k)), "i")]),
  floored(sumOver(positions, ["If", equals(["Abs", here], k), "i", 0])),
];

/** Whether the point of `at(i, "s")` (a signed position) is the negative one. */
const inverseNegative = (i: MathJSON): MathJSON => less(at(i, "s"), 0);
/** The sum, over the positive roots sent negative by the inverse, of their heights in type B: e_i has n + 1 - i, e_i - e_j has j - i and e_i + e_j has j - i + 2(n + 1 - j), with i < j. */
const atomicLength: MathJSON = bindList(
  "s",
  forEach(positions, inverseAt("k"), "k"),
  floored(
    add(
      sumOver(positions, ["If", inverseNegative("i"), subtract(add(n, 1), "i"), 0]),
      floored(
        sumOver(
          positions,
          floored(
            sumOver(
              where(positions, greater("j", "i"), "j"),
              [
                "If",
                less(["Abs", at("i", "s")], ["Abs", at("j", "s")]),
                ["If", inverseNegative("i"), add(times(2, subtract("j", "i")), times(2, subtract(add(n, 1), "j"))), 0],
                add(
                  ["If", greater(at("j", "s"), 0), subtract("j", "i"), 0],
                  ["If", inverseNegative("j"), add(subtract("j", "i"), times(2, subtract(add(n, 1), "j"))), 0],
                ),
              ],
              "j",
            ),
          ),
        ),
      ),
    ),
  ),
);

/** The factor 2k a signed cycle of k points adds to the centralizer: its length as a signed point, doubled when it is positive. */
const cycleFactor = (i: MathJSON): MathJSON => times(cycleLengthIn("_x", i), ["If", staysPositiveIn("_x", i), 2, 1]);
/** The cycles led by a point up to i that look like the cycle of i: the same length, both positive or both negative. */
const likeCycles = (i: MathJSON): MathJSON =>
  count(
    where(positions, atMostValue("e", i), "e"),
    all(
      leadsCycleIn("_x", "e"),
      all(
        equals(cycleLengthIn("_x", "e"), cycleLengthIn("_x", i)),
        equals(staysPositiveIn("_x", "e"), staysPositiveIn("_x", i)),
      ),
    ),
    "e",
  );
/** The size of the class: 2^n n! over the centralizer's order, the product over the cycles of 2k times the number of cycles of each kind and length before it. */
const classSize: MathJSON = [
  "Divide",
  times(doubling(n), ["Product", ["Range", 1, n]]),
  ["Product", forEach(positions, ["If", leadsCycleIn("_x", "i"), times(cycleFactor("i"), likeCycles("i")), 1])],
];

const reflectionLengthDrop: MathJSON = bind(
  "target",
  subtract(lengthIn("_x"), 1),
  reflectionsWhere((word) => equals(lengthIn(word), "target")),
  "integer",
);
const positiveCycleDrop: MathJSON = bind(
  "target",
  subtract(positiveCyclesIn("_x"), 1),
  reflectionsWhere((word) => equals(positiveCyclesIn(word), "target")),
  "integer",
);

export const FINDSTAT_SIGNED_PERMUTATION_STATISTICS_3: readonly Definition[] = [
  signed(
    "SignedConjugacyClassSize",
    "The signed permutations of the same signed cycle type: 2^n n! over the product of 2k for each cycle of k points and the factorials of the numbers of cycles of each length and sign.",
    nonEmpty(classSize, 1),
    "FindStat's St001852. A cycle and its negative are one signed cycle; it is positive when it never reaches its own negative. Not ConjugacyClassSize, which reads an unsigned permutation.",
  ),
  signed(
    "AtomicLength",
    "The sum of the heights, in type B, of the positive roots the inverse sends to negative ones.",
    nonEmpty(atomicLength),
    "FindStat's St001848, the atomic length of a Weyl group element.",
  ),
  signed(
    "BruhatLowerCoverCount",
    "The reflections t, a sign change of one entry or a swap of two, possibly with both negated, whose product p t is one shorter in the Coxeter length whose last generator negates the last entry.",
    nonEmpty(reflectionLengthDrop),
    "FindStat's St001861. The lower covers of p in Bruhat order are the p t shorter by exactly 1.",
  ),
  signed(
    "AbsoluteOrderCoverCount",
    "The reflections t, a sign change of one entry or a swap of two, possibly with both negated, whose product p t has one fewer positive cycle.",
    nonEmpty(positiveCycleDrop),
    "FindStat's St001858. The reflection length n less the positive cycles rises by 1 exactly when the positive cycles fall by 1: the elements covering p in absolute order are the p t of one more reflection length.",
  ),
];
