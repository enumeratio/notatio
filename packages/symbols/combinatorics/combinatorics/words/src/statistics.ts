// Binary-word statistics, over `_x` = the letters of the word, each 0 or 1.
//
// Most are a fold with a small state: the run of ones in progress, a running height.

import { fold as typedFold } from "../../collections/src/families/tables.ts";
import type { Definition, MathJSON } from "../../src/statistics/types.ts";
import {
  add,
  adjacent,
  and,
  at,
  atLeast,
  atLeastValue,
  atMostValue,
  bind,
  bindList,
  carried,
  count,
  equals,
  fallsAfter,
  floored,
  fold,
  forEach,
  greater,
  hasPair,
  here,
  length,
  less,
  max,
  min,
  next,
  nonEmpty,
  or,
  positions,
  risesAfter,
  subtract,
  sumOver,
  upTo,
  visiting,
  where,
  x,
} from "../../src/statistics/vocabulary.ts";

const on = "BinaryWord";
const stat = (head: string, summary: string, expr: MathJSON, note?: string): Definition => ({
  head,
  on,
  summary,
  expr,
  ...(note ? { note } : {}),
});

const k = length();
/** A fold whose accumulator is a typed list of integers. */
const listFold = (...args: Parameters<typeof typedFold>): MathJSON => typedFold(...args) as MathJSON;
const list = (...items: MathJSON[]): MathJSON => ["List", ...items];
const times = (a: MathJSON, b: MathJSON): MathJSON => ["Multiply", a, b];
/** The last field of a fold's state, which holds the answer. */
const result = (state: MathJSON): MathJSON => at(2, state);
/** `a` and `b` differ. */
const differ = (a: MathJSON, b: MathJSON): MathJSON => greater(["Abs", subtract(a, b)], 0);

const ones: MathJSON = floored(["Sum", x]);

/** The run of ones in progress after this letter: one longer on a 1, gone on a 0. */
const runAfter: MathJSON = times(add(carried(1), 1), visiting);

/** Leading ones: the state is whether every letter so far is a 1, and how many there were. */
const leadingOnes: MathJSON = result(
  fold(x, list(1, 0), list(times(carried(1), visiting), add(carried(2), times(carried(1), visiting)))),
);

/** Runs of ones of odd length: a trailing 0 closes the last run; the state is the run in progress and the odd runs closed. */
const oddOneRuns: MathJSON = result(
  fold(
    ["Join", x, list(0)],
    list(0, 0),
    list(runAfter, add(carried(2), times(subtract(1, visiting), ["Mod", carried(1), 2]))),
  ),
);

const longestOneRun: MathJSON = result(fold(x, list(0, 0), list(runAfter, ["Max", carried(2), runAfter])));

/** Leading zeros: the state is whether every letter so far is a 0, and how many there were. */
const leadingZeros: MathJSON = result(
  fold(
    x,
    list(1, 0),
    list(times(carried(1), subtract(1, visiting)), add(carried(2), times(carried(1), subtract(1, visiting)))),
  ),
);

/** The longest run of equal letters; the state is the previous letter, the run ending here and the longest run. */
const constantRunAfter: MathJSON = ["If", equals(visiting, carried(1)), add(carried(2), 1), 1];
const longestConstantRun: MathJSON = at(
  3,
  fold(x, list(-1, 0, 0), list(visiting, constantRunAfter, ["Max", carried(3), constantRunAfter])),
);

/** The longest factor whose neighboring letters all differ; the state is as for the constant runs. */
const alternatingRunAfter: MathJSON = ["If", equals(visiting, carried(1)), 1, add(carried(2), 1)];
const longestAlternatingFactor: MathJSON = at(
  3,
  fold(x, list(-1, 0, 0), list(visiting, alternatingRunAfter, ["Max", carried(3), alternatingRunAfter])),
);

/** The zeros less the ones among the letters so far, with the 0 as a step up. */
const heightAfter: MathJSON = add(carried(1), subtract(1, times(2, visiting)));
const depth: MathJSON = result(fold(x, list(0, 0), list(heightAfter, ["Max", carried(2), heightAfter])));

/** The ones less the zeros among the letters so far; a prefix is balanced when it is back at 0. */
const balanceAfter: MathJSON = add(carried(1), subtract(times(2, visiting), 1));
const balancedPrefixes: MathJSON = result(
  fold(x, list(0, 0), list(balanceAfter, add(carried(2), ["If", equals(balanceAfter, 0), 1, 0]))),
);

/** The letter opposite position `i`. */
const mirrored: MathJSON = at(subtract(add(k, 1), "i"));

/** `from .. to` in steps of 1. */
const span = (from: MathJSON, to: MathJSON): MathJSON => ["Range", from, to, 1];
const power = (base: number, exponent: MathJSON): MathJSON => ["Power", base, exponent];

/** The `size` letters from position `from`, read as a base-3 numeral with the letters 0 and 1 as the digits 1 and 2: it names the factor, and no two factors share one, whatever their lengths. */
const factorNumeral = (from: MathJSON, size: MathJSON): MathJSON =>
  floored(sumOver(span(1, size), times(add(at(add(from, subtract("m", 1))), 1), power(3, subtract(size, "m"))), "m"));
/** The numeral of the same letters read from the last to the first. */
const reversedNumeral = (from: MathJSON, size: MathJSON): MathJSON =>
  floored(sumOver(span(1, size), times(add(at(add(from, subtract("m", 1))), 1), power(3, subtract("m", 1))), "m"));
/** The last `size` letters. */
const suffixNumeral = (size: MathJSON): MathJSON => factorNumeral(add(subtract(k, size), 1), size);

/** The lengths 1 .. n - 1 of the proper prefixes that are also suffixes. */
const borderLengths: MathJSON = where(span(1, subtract(k, 1)), equals(factorNumeral(1, "l"), suffixNumeral("l")), "l");

/** The value of the word read as a binary numeral. */
const binaryValue: MathJSON = floored(sumOver(positions, times(here, power(2, subtract(k, "i")))));

/** Pairs `i < j` weighted by `j - i` where the letters satisfy `relation`. */
const weightedPairs = (relation: MathJSON): MathJSON =>
  hasPair(
    floored(
      sumOver(adjacent, floored(sumOver(span(add("i", 1), k), times(subtract("j", "i"), ["If", relation, 1, 0]), "j"))),
    ),
  );

/** The ones among the `size` letters from position `from`. */
const onesFrom = (from: MathJSON, size: MathJSON): MathJSON =>
  floored(sumOver(span(from, subtract(add(from, size), 1)), at("j"), "j"));

/** The `size` letters from position `from` read the same backwards. */
const isPalindrome = (from: MathJSON, size: MathJSON): MathJSON =>
  equals(factorNumeral(from, size), reversedNumeral(from, size));

/** A list over the prefixes of the word, built by `typedFold` from `initial`: entry j + 1 holds the value for the first j letters; `entry` reads the list so far as `a` and the last letter's position as `b`. */
const prefixTable = (initial: readonly MathJSON[], entry: MathJSON): MathJSON =>
  listFold(["Join", "a", list(entry)], "a", "b", list(...initial), positions, "list<integer>");
/** Entry `j` of a prefix table, `j` letters in. */
const tableAt = (table: MathJSON, letters: MathJSON): MathJSON => at(add(letters, 1), table);

/** The latest position before `j` holding the letter at `j`, or 0. */
const lastSame = (j: MathJSON): MathJSON =>
  max(["Join", list(0), forEach(span(1, subtract(j, 1)), ["If", equals(at("p"), at(j)), "p", 0], "p")]);

const max2 = (a: MathJSON, b: MathJSON): MathJSON => ["Max", a, b];
const ifThen = (condition: MathJSON): MathJSON => ["If", condition, 1, 0];

/** The ones less the zeros among the first `letters` letters. */
const heightAfterLetters = (letters: MathJSON): MathJSON => subtract(times(2, onesFrom(1, letters)), letters);

/** The heights after 0, 1, ... n letters, with the 1 as a step up. */
const heights: MathJSON = prefixTable([0], add(at(["Length", "a"], "a"), subtract(times(2, at(visiting)), 1)));

/** 1 when position `j` is a critical step of the Catalan factorization: a 0 that reaches a new low, or a 1 after which the height stays above where it was. The other letters make up the Dyck words. */
const criticalStep = (j: MathJSON): MathJSON => [
  "If",
  equals(at(j), 0),
  ifThen(less(tableAt("h", j), min(forEach(span(0, subtract(j, 1)), tableAt("h", "m"), "m")))),
  ifThen(less(tableAt("h", subtract(j, 1)), min(forEach(span(j, k), tableAt("h", "m"), "m")))),
];

/** All of `conditions`; a lone one stands alone, as a one-operand `And` doesn't read back. */
const allOf = (conditions: readonly MathJSON[]): MathJSON =>
  conditions.length === 1 ? conditions[0]! : ["And", ...conditions];

/** The distinct words `u` with `copies` copies of `u` side by side in the word, counted length by length. */
const repeatedFactors = (copies: number): MathJSON =>
  atLeast(
    copies,
    floored(
      sumOver(
        span(1, ["Divide", subtract(k, ["Mod", k, copies]), copies]),
        floored(
          sumOver(
            [
              "Unique",
              forEach(span(1, add(subtract(k, times(copies, "l")), 1)), [
                "If",
                allOf(
                  Array.from({ length: copies - 1 }, (_, c) =>
                    equals(factorNumeral("i", "l"), factorNumeral(add("i", times(c + 1, "l")), "l")),
                  ),
                ),
                factorNumeral("i", "l"),
                0,
              ]),
            ],
            ifThen(greater("n", 0)),
            "n",
          ),
        ),
        "l",
      ),
    ),
  );

/** The largest e such that the word is e copies of one word; 0 for the empty word. */
const repetitionExponent: MathJSON = nonEmpty(
  hasPair(
    [
      "Divide",
      k,
      min([
        "Join",
        list(k),
        where(
          span(1, subtract(k, 1)),
          [
            "If",
            equals(["Mod", k, "q"], 0),
            equals(factorNumeral(1, subtract(k, "q")), suffixNumeral(subtract(k, "q"))),
            "False",
          ],
          "q",
        ),
      ]),
    ],
    1,
  ),
);

/** The position of the word among its distinct cyclic shifts in lexicographic order, from 0; 0 for the empty word. */
const cyclicShiftIndex: MathJSON = nonEmpty(
  bindList(
    "v",
    prefixTable(
      [power(2, k)],
      floored(
        sumOver(
          positions,
          times(at(add(["Mod", add(visiting, subtract("m", 2)), k], 1)), power(2, subtract(k, "m"))),
          "m",
        ),
      ),
    ),
    floored(sumOver(["Unique", "v"], ifThen(less("n", tableAt("v", 1))), "n")),
  ),
);

/** Lattice paths of the word's length weakly above the word, read with a 1 as a step up and a 0 as a step across: counted by the height `d` of the path over the word (never below 0). The list holds the counts for d = -1 .. n + 1, the two ends always 0. */
const pathsAboveByHeight: MathJSON = listFold(
  [
    "Join",
    list(0),
    forEach(
      span(2, add(k, 2)),
      [
        "If",
        equals(visiting, 1),
        add(at("j", "a"), at(add("j", 1), "a")),
        add(at(subtract("j", 1), "a"), at("j", "a")),
      ],
      "j",
    ),
    list(0),
  ],
  "a",
  "b",
  ["Join", list(0, 1), forEach(span(1, add(k, 1)), 0, "z")],
  x,
  "list<integer>",
);

/** The half lengths 1 .. n/2 of the even factors. */
const halfLengths: MathJSON = span(1, ["Divide", subtract(k, ["Mod", k, 2]), 2]);
/** 1 when the `2h` letters from `i` are their own reverse complement: letter m and letter 2h + 1 - m are different for every m. */
const isReverseComplement = (i: MathJSON, h: MathJSON): MathJSON =>
  equals(
    floored(
      sumOver(
        span(1, h),
        ifThen(equals(add(at(add(i, subtract("m", 1))), at(add(i, subtract(times(2, h), "m")))), 1)),
        "m",
      ),
    ),
    h,
  );
/** The largest half length of an even factor that is its own reverse complement, over the starts `i` that satisfy `starts`. */
const reverseComplementHalfLength = (starts: (i: MathJSON) => MathJSON): MathJSON =>
  hasPair(
    max([
      "Join",
      list(0),
      forEach(
        halfLengths,
        times(
          "h",
          max(
            forEach(
              span(1, add(subtract(k, times(2, "h")), 1)),
              ifThen(and(starts("i"), isReverseComplement("i", "h"))),
              "i",
            ),
          ),
        ),
        "h",
      ),
    ]),
  );

/** The permutations of 1 .. N whose descent word is the word: by inclusion-exclusion over the descents kept, N! times the sum, over the coarsenings, of (-1)^(descents merged away) over the product of the blocks' factorials. A 1 is appended so that N is a cut. Entry j of the list is N! times that sum for the cut j (0 where j is not a cut), each entry an integer. */
const descentWordPreimages: MathJSON = bindList(
  "y",
  ["Join", x, list(1)],
  bindList(
    "c",
    listFold(
      ["Join", "a", list(add(at(["Length", "a"], "a"), at(visiting, "y")))],
      "a",
      "b",
      list(0),
      upTo(add(k, 1)),
      "list<integer>",
    ),
    at(
      add(k, 2),
      listFold(
        [
          "Join",
          "a",
          list([
            "If",
            equals(at(visiting, "y"), 1),
            floored(
              sumOver(
                span(0, subtract(visiting, 1)),
                [
                  "Divide",
                  times(["Power", -1, subtract(at(visiting, "c"), at(add("i", 1), "c"))], at(add("i", 1), "a")),
                  ["Product", span(1, subtract(visiting, "i"))],
                ],
                "i",
              ),
            ),
            0,
          ]),
        ],
        "a",
        "b",
        list(["Product", span(1, add(k, 1))]),
        upTo(add(k, 1)),
        "list<integer>",
      ),
    ),
  ),
);

/** Whether the first n - d letters of the factor of length `l` from `i` equal its last: it has period d. */
const hasPeriod = (i: MathJSON, l: MathJSON, d: MathJSON): MathJSON =>
  equals(factorNumeral(i, subtract(l, d)), factorNumeral(add(i, d), subtract(l, d)));
/** 1 when the factor of length `l` from `i` is primitive: no proper divisor d of l is a period. */
const isPrimitive = (i: MathJSON, l: MathJSON): MathJSON =>
  equals(
    floored(
      sumOver(
        span(1, l),
        ["If", less("d", l), ["If", equals(["Mod", l, "d"], 0), ifThen(hasPeriod(i, l, "d")), 0], 0],
        "d",
      ),
    ),
    0,
  );

const BINARY_WORD_STATISTICS: readonly Definition[] = [
  stat("HammingWeight", "The number of ones.", ones),
  stat("LeadingOnesCount", "The number of ones before the first 0.", leadingOnes),
  stat(
    "OnePositionSum",
    "The sum of the positions of the ones.",
    nonEmpty(floored(sumOver(positions, times(here, "i")))),
  ),
  stat(
    "OneRunCount",
    "The number of maximal runs of ones.",
    nonEmpty(add(at(1), hasPair(count(adjacent, risesAfter)))),
    "A run starts at the first letter if it is a 1, and after each 0 followed by a 1.",
  ),
  stat("OddOneRunCount", "The number of maximal runs of ones of odd length.", oddOneRuns),
  stat("LongestRunOfOnes", "The length of the longest run of ones.", longestOneRun),
  stat(
    "ChangeCount",
    "The positions i where the letters i and i + 1 differ.",
    hasPair(count(adjacent, differ(here, next))),
  ),
  stat(
    "PathDepth",
    "The most zeros less ones among the prefixes.",
    depth,
    "Reads the word as a path with a 0 a step up and a 1 a step down; the empty prefix counts, so the depth is at least 0.",
  ),
  stat("OnesMinusZeros", "The number of ones less the number of zeros.", subtract(times(2, ones), k)),
  stat(
    "BalancedPrefixCount",
    "The nonempty prefixes with as many 0s as 1s.",
    balancedPrefixes,
    "The returns of the word, read as a lattice path, to the main diagonal.",
  ),
  stat(
    "SymmetryDegree",
    "The positions i up to half the length where the letters i and n + 1 - i agree.",
    nonEmpty(count(positions, and(atMostValue(times(2, "i"), k), equals(here, mirrored)))),
  ),
  stat("Ascents", "Positions i with w(i) < w(i+1).", hasPair(count(adjacent, risesAfter))),
  stat(
    "Inversions",
    "Pairs i < j with w(i) > w(j).",
    hasPair(sumOver(adjacent, count(["Range", add("i", 1), k, 1], greater(here, at("j")), "j"))),
  ),
  stat("MajorIndex", "The sum of the positions i with w(i) > w(i+1).", hasPair(["Sum", where(adjacent, fallsAfter)])),
  stat("LongestConstantRun", "The length of the longest run of equal letters.", longestConstantRun),
  stat(
    "LongestAlternatingFactor",
    "The length of the longest factor in which every two neighboring letters differ.",
    longestAlternatingFactor,
  ),
  stat(
    "FirstOnePositionAfterAppendedOne",
    "The position of the first 1 once a 1 is appended to the word: one more than the leading zeros.",
    add(leadingZeros, 1),
  ),
  stat(
    "DecimalRepresentation",
    "The word read as a binary numeral.",
    nonEmpty(binaryValue),
    "FindStat's St000289. The first letter is the most significant digit.",
  ),
  stat(
    "DecimalRepresentationWithLeadingOne",
    "The word with a 1 put in front, read as a binary numeral.",
    nonEmpty(add(power(2, k), binaryValue), 1),
    "FindStat's St000827.",
  ),
  stat(
    "DistinctFactorCount",
    "The distinct factors, the empty one included: the subword complexity.",
    nonEmpty(
      add(
        1,
        floored(
          sumOver(
            span(1, k),
            ["Length", ["Unique", forEach(span(1, add(subtract(k, "l"), 1)), factorNumeral("i", "l"))]],
            "l",
          ),
        ),
      ),
      1,
    ),
    "FindStat's St000294.",
  ),
  stat(
    "BorderLength",
    "The length of the longest proper prefix that is also a suffix; 0 for none.",
    nonEmpty(hasPair(max(["Join", list(0), borderLengths]))),
    "FindStat's St000295.",
  ),
  stat(
    "SymmetricBorderLength",
    "The length of the longest prefix whose reverse is a suffix.",
    nonEmpty(
      result(
        fold(
          positions,
          list(1, 0),
          list(
            times(carried(1), ["If", equals(at(visiting), at(subtract(add(k, 1), visiting))), 1, 0]),
            add(carried(2), times(carried(1), ["If", equals(at(visiting), at(subtract(add(k, 1), visiting))), 1, 0])),
          ),
        ),
      ),
    ),
    "FindStat's St000296. The longest prefix that is a suffix read backwards is the run of leading positions i with w(i) = w(n + 1 - i).",
  ),
  stat(
    "InversionSum",
    "The sum of j - i over the pairs i < j with w(i) > w(j).",
    weightedPairs(greater(at("i"), at("j"))),
    "FindStat's St000347.",
  ),
  stat(
    "NonInversionSum",
    "The sum of j - i over the pairs i < j with w(i) < w(j).",
    weightedPairs(less(at("i"), at("j"))),
    "FindStat's St000348.",
  ),
  stat(
    "StrictlyIncreasingRuns",
    "The maximal runs of strictly increasing letters.",
    nonEmpty(add(1, hasPair(count(adjacent, atLeastValue(here, next))))),
    "FindStat's St000393: one more than the weak descents.",
  ),
  stat(
    "MinimalPeriod",
    "The least p with w(i) = w(i + p) wherever both are letters.",
    nonEmpty(subtract(k, hasPair(max(["Join", list(0), borderLengths])))),
    "FindStat's St000626: the length less the longest border.",
  ),
  stat(
    "BorderCount",
    "The prefixes shorter than the word that are also suffixes, the empty one included.",
    nonEmpty(hasPair(add(1, ["Count", borderLengths]), 1)),
    "FindStat's St001884.",
  ),
  {
    ...stat(
      "WeakMajorIndex",
      "The sum of the positions i with w(i) >= w(i+1).",
      hasPair(["Sum", where(adjacent, atLeastValue(here, next))]),
      "FindStat's St001930.",
    ),
  },
  stat(
    "DistinctSubsequenceCount",
    "The distinct subsequences, the empty one included.",
    nonEmpty(
      at(
        add(k, 2),
        prefixTable([0, 1], subtract(times(2, at(["Length", "a"], "a")), tableAt("a", lastSame(visiting)))),
      ),
      1,
    ),
    "FindStat's St000518. With d(j) the count for the first j letters, d(j) = 2 d(j - 1) less d(p - 1), where p is the latest earlier position holding the same letter, if any.",
  ),
  stat(
    "RepetitionExponent",
    "The largest e such that the word is e copies of one word.",
    repetitionExponent,
    "FindStat's St000627, also called the frequency. The word is copies of a word of length q when q divides n and the first n - q letters are the last n - q.",
  ),
  stat(
    "Balance",
    "The least q such that any two factors of one length differ by at most q ones.",
    nonEmpty(
      max(
        forEach(
          span(1, k),
          bindList("c", forEach(span(1, add(subtract(k, "l"), 1)), onesFrom("i", "l")), subtract(max("c"), min("c"))),
          "l",
        ),
      ),
    ),
    "FindStat's St000628.",
  ),
  stat(
    "ShortestPalindromicDecompositionLength",
    "The fewest palindromic factors the word is a concatenation of.",
    nonEmpty(
      at(
        add(k, 1),
        prefixTable(
          [0],
          min(
            forEach(span(0, subtract(visiting, 1)), [
              "If",
              isPalindrome(add("i", 1), subtract(visiting, "i")),
              add(tableAt("a", "i"), 1),
              add(k, 1),
            ]),
          ),
        ),
      ),
    ),
    "FindStat's St000630. The table holds the fewest pieces for each prefix.",
  ),
  stat(
    "PalindromicDecompositionCount",
    "The ways to write the word as a concatenation of palindromic factors.",
    nonEmpty(
      at(
        add(k, 1),
        prefixTable(
          [1],
          floored(
            sumOver(span(0, subtract(visiting, 1)), [
              "If",
              isPalindrome(add("i", 1), subtract(visiting, "i")),
              tableAt("a", "i"),
              0,
            ]),
          ),
        ),
      ),
      1,
    ),
    "FindStat's St000631. The table holds the ways for each prefix.",
  ),
  stat(
    "LongestCatalanFactorSemilength",
    "The semilength of the longest Dyck word in the Catalan factorization.",
    nonEmpty(
      bindList(
        "h",
        heights,
        bindList(
          "g",
          listFold(
            bind(
              "c",
              criticalStep(visiting),
              list(times(subtract(1, "c"), add(carried(1), 1)), max2(carried(2), times("c", carried(1)))),
              "integer",
            ),
            "a",
            "b",
            list(0, 0),
            positions,
            "list<integer>",
          ),
          ["Divide", max2(at(1, "g"), at(2, "g")), 2],
        ),
      ),
    ),
    "FindStat's St000875. Every word is (D 0)^l D (1 D)^m with the D Dyck words; the longest D lies between two critical steps, or an end of the word and one.",
  ),
  stat(
    "CatalanFactorCount",
    "The factors in the Catalan factorization: the critical steps, and the middle Dyck word if it is not empty.",
    nonEmpty(
      bindList(
        "h",
        heights,
        bind(
          "low",
          min("h"),
          add(subtract(tableAt("h", k), times(2, "low")), [
            "If",
            greater(floored(sumOver(span(0, k), ifThen(equals(tableAt("h", "j"), "low")), "j")), 1),
            1,
            0,
          ]),
          "integer",
        ),
      ),
    ),
    "FindStat's St000876. The middle word is not empty when the height reaches its lowest value more than once.",
  ),
  stat(
    "CriticalStepCount",
    "The critical steps l + m in the Catalan factorization (D 0)^l D (1 D)^m.",
    nonEmpty(bindList("h", heights, subtract(tableAt("h", k), times(2, min("h"))))),
    "FindStat's St000885. The word ends at height m - l, and l is the least height reached below 0.",
  ),
  stat(
    "InternalInversions",
    "The pairs i < j with w(i) > w(j) that lie in the same block of the sorted word.",
    hasPair(
      bind(
        "z",
        subtract(k, ones),
        floored(
          sumOver(
            adjacent,
            floored(
              sumOver(
                span(add("i", 1), k),
                ifThen(and(greater(at("i"), at("j")), or(atMostValue("j", "z"), greater("i", "z")))),
                "j",
              ),
            ),
          ),
        ),
        "integer",
      ),
    ),
    "FindStat's St000921. The sorted word is the zeros then the ones, so a pair is internal when both positions are among the first z or both after.",
  ),
  stat(
    "UniqueFactorLength",
    "The least length for which all factors of that length are different.",
    nonEmpty(
      min(
        where(
          positions,
          equals(
            ["Length", ["Unique", forEach(span(1, add(subtract(k, "l"), 1)), factorNumeral("i", "l"))]],
            add(subtract(k, "l"), 1),
          ),
          "l",
        ),
      ),
    ),
    "FindStat's St000922.",
  ),
  stat(
    "LyndonFactorizationLength",
    "The factors in the Lyndon factorization.",
    nonEmpty(
      hasPair(
        bindList(
          "v",
          prefixTable(
            [power(3, k)],
            floored(
              sumOver(
                span(1, add(subtract(k, visiting), 1)),
                times(add(at(add(visiting, subtract("m", 1))), 1), power(3, subtract(k, "m"))),
                "m",
              ),
            ),
          ),
          add(
            1,
            floored(
              sumOver(span(2, k), ifThen(less(tableAt("v", "i"), min(forEach(span(1, "i"), at("m", "v"), "m")))), "i"),
            ),
          ),
        ),
        1,
      ),
    ),
    "FindStat's St001267. A factor starts at each position whose suffix is smaller than every earlier suffix; the table starts with a numeral above any suffix's, and pads a suffix with the digit 0, which is smaller than a letter, so the numerals order the suffixes.",
  ),
  stat(
    "LongestYamanouchiPrefix",
    "The length of the longest prefix in which no prefix has more ones than zeros.",
    nonEmpty(subtract(min(["Join", list(add(k, 1)), where(positions, greater(heightAfterLetters("j"), 0), "j")]), 1)),
    "FindStat's St001371.",
  ),
  stat(
    "LongestPalindromicPrefix",
    "The length of the longest prefix that reads the same backwards.",
    nonEmpty(max(where(positions, isPalindrome(1, "l"), "l"))),
    "FindStat's St001415.",
  ),
  stat(
    "LongestPalindromicFactor",
    "The length of the longest factor that reads the same backwards.",
    nonEmpty(
      max(
        forEach(
          positions,
          times("l", max(forEach(span(1, add(subtract(k, "l"), 1)), ifThen(isPalindrome("i", "l")), "i"))),
          "l",
        ),
      ),
    ),
    "FindStat's St001416.",
  ),
  stat(
    "LongestPalindromicSubsequence",
    "The length of the longest subsequence that reads the same backwards.",
    nonEmpty(
      at(
        add(k, 1),
        listFold(
          [
            "Join",
            list(0),
            forEach(
              positions,
              max2(
                tableAt("a", "j"),
                max([
                  "Join",
                  list(0),
                  forEach(
                    span(1, "j"),
                    ["If", equals(at(visiting), at(subtract(add(k, 1), "jp"))), add(at("jp", "a"), 1), 0],
                    "jp",
                  ),
                ]),
              ),
              "j",
            ),
          ],
          "a",
          "b",
          ["Map", ["Function", 0, "z"], span(0, k)],
          positions,
          "list<integer>",
        ),
      ),
    ),
    "FindStat's St001417: the longest common subsequence of the word and its reverse. After the first i letters, entry j + 1 holds that for the first j letters of the reverse.",
  ),
  stat(
    "DistinctCubeCount",
    "The distinct nonempty words u with uuu a factor.",
    repeatedFactors(3),
    "FindStat's St001423.",
  ),
  stat(
    "DistinctSquareCount",
    "The distinct nonempty words u with uu a factor.",
    repeatedFactors(2),
    "FindStat's St001424.",
  ),
  stat(
    "CyclicShiftIndex",
    "The position of the word among its distinct cyclic shifts in lexicographic order, from 0.",
    cyclicShiftIndex,
    "FindStat's St001436. The shifts are compared as binary numerals, which orders words of one length lexicographically; the table starts with a numeral above every shift's.",
  ),
  stat(
    "DescentWordPreimageCount",
    "The permutations whose descent word is this word.",
    nonEmpty(descentWordPreimages),
    "FindStat's St000529, the size of the preimage of the descent word map. The word has length N - 1; the count is by inclusion-exclusion over the descents.",
  ),
  stat(
    "LatticePathsAboveWordCount",
    "The paths of the word's length, ending anywhere, that stay weakly above the path the word gives.",
    nonEmpty(floored(["Sum", pathsAboveByHeight])),
    "FindStat's St001365. A 1 is a step up and a 0 a step across; a path is above when it has made at least as many steps up after every step. The fold counts the paths by how many steps up they are ahead.",
  ),
  stat(
    "SameEndpointPathsAboveWordCount",
    "The paths with the word's number of ones and zeros that stay weakly above the path the word gives.",
    nonEmpty(at(2, pathsAboveByHeight)),
    "FindStat's St001313, the count of St001365 that end where the word does: ahead by 0 steps up.",
  ),
  stat(
    "EvenPalindromicPrefixHalfLength",
    "Half the length of the longest palindromic prefix of even length.",
    hasPair(max(["Join", list(0), forEach(halfLengths, times("h", ifThen(isPalindrome(1, times(2, "h")))), "h")])),
    "FindStat's St001413.",
  ),
  stat(
    "OddPalindromicPrefixHalfLength",
    "The largest j such that the prefix of length 2 j + 1 is a palindrome.",
    nonEmpty(
      max(
        forEach(
          span(0, ["Divide", subtract(subtract(k, 1), ["Mod", subtract(k, 1), 2]), 2]),
          times("h", ifThen(isPalindrome(1, add(times(2, "h"), 1)))),
          "h",
        ),
      ),
    ),
    "FindStat's St001414.",
  ),
  stat(
    "LongestPalindromicFactorStartingWithOne",
    "The length of the longest palindromic factor that begins with a 1.",
    nonEmpty(
      max(
        forEach(
          positions,
          times(
            "l",
            max(
              forEach(span(1, add(subtract(k, "l"), 1)), ifThen(and(equals(at("i"), 1), isPalindrome("i", "l"))), "i"),
            ),
          ),
          "l",
        ),
      ),
    ),
    "FindStat's St001419.",
  ),
  stat(
    "ReverseComplementFactorHalfLength",
    "Half the length of the longest factor that is its own reverse complement.",
    reverseComplementHalfLength(() => "True"),
    "FindStat's St001420. Such a factor has even length: its middle letter would be its own complement.",
  ),
  stat(
    "ReverseComplementFactorHalfLengthStartingWithOne",
    "Half the length of the longest factor that is its own reverse complement and begins with a 1.",
    reverseComplementHalfLength((i) => equals(at(i), 1)),
    "FindStat's St001421.",
  ),
  stat(
    "Flex",
    "The product of the word's lex (its position among its distinct cyclic shifts, from 1) and its frequency.",
    nonEmpty(times(add(cyclicShiftIndex, 1), repetitionExponent)),
    "FindStat's St001437: St001436 plus 1, times St000627.",
  ),
  stat(
    "ModularMajorIndex",
    "The major index modulo the length of the word.",
    nonEmpty(["Mod", hasPair(["Sum", where(adjacent, fallsAfter)]), k]),
    "FindStat's St001485.",
  ),
  stat(
    "ValleyFillingDegree",
    "The number of times every valley 01 must be swapped for a peak 10, and a trailing 0 made a 1, to leave no zeros.",
    nonEmpty(
      max2(
        0,
        fold(positions, -1, ["If", equals(at(subtract(add(k, 1), visiting)), 0), max2(add("a", 2), visiting), "a"]),
      ),
    ),
    "FindStat's St001721.",
  ),
  stat(
    "BaselineCrossings",
    "The times the path, a 1 a step up and a 0 a step down, crosses the baseline.",
    hasPair(
      bindList(
        "h",
        heights,
        floored(
          sumOver(
            adjacent,
            ifThen(and(equals(here, next), equals(tableAt("h", subtract("i", 1)), subtract(1, times(2, here))))),
          ),
        ),
      ),
    ),
    "FindStat's St001730.",
  ),
  stat(
    "PrimitiveFactorCount",
    "The distinct nonempty factors that are not a power of a shorter word.",
    nonEmpty(
      floored(
        sumOver(
          positions,
          floored(
            sumOver(
              [
                "Unique",
                forEach(
                  span(1, add(subtract(k, "l"), 1)),
                  ["If", isPrimitive("i", "l"), factorNumeral("i", "l"), 0],
                  "i",
                ),
              ],
              ifThen(greater("n", 0)),
              "n",
            ),
          ),
          "l",
        ),
      ),
    ),
    "FindStat's St001838.",
  ),
];

// ── parking functions ────────────────────────────────────────────────────────────────────
//
// `_x` is the preferences: car i prefers spot `_x(i)`, and the spots are 1 .. n.

const parkingStat = (head: string, summary: string, expr: MathJSON, note?: string): Definition => ({
  head,
  on: "ParkingFunction",
  summary,
  expr,
  ...(note ? { note } : {}),
});

/** 1 when spot `s` is taken once the first `m` cars have parked, else 0: the cars preferring a spot of a stretch `a .. s` park in it or past it, so `s` is taken exactly when some stretch ending at `s` holds at least as many of those preferences as it has spots. */
const spotTaken = (m: MathJSON, s: MathJSON): MathJSON => [
  "If",
  atLeastValue(
    max(
      forEach(
        upTo(s),
        subtract(
          floored(
            sumOver(
              positions,
              ["If", and(atMostValue("j", m), and(atLeastValue(at("j"), "a"), atMostValue(at("j"), s))), 1, 0],
              "j",
            ),
          ),
          subtract(add(s, 1), "a"),
        ),
        "a",
      ),
    ),
    0,
  ),
  1,
  0,
];
/** Car i's spot is free when it arrives: the cars before it have not taken the spot it prefers. */
const carIsLucky: MathJSON = ["If", equals(spotTaken(subtract("i", 1), at("i")), 0), 1, 0];
/** How far car i drives on from its preferred spot: the offset of the first free spot at or after it. */
const carDisplacement: MathJSON = min(
  forEach(
    ["Range", 0, subtract(length(), at("i"))],
    ["If", equals(spotTaken(subtract("i", 1), add(at("i"), "t")), 0), "t", length()],
    "t",
  ),
);
/** The entries before position i that are at least the entry at i. */
const earlierNotSmaller: MathJSON = floored(
  sumOver(positions, ["If", and(less("j", "i"), atLeastValue(at("j"), at("i"))), 1, 0], "j"),
);
const entriesWhere = (test: MathJSON): MathJSON => floored(sumOver(positions, ["If", test, 1, 0], "j"));
/** The first i + 1 entries rise strictly: none of the first i neighboring pairs fails to. */
const prefixIsIncreasing: MathJSON = equals(
  floored(sumOver(adjacent, ["If", and(atMostValue("j", "i"), atLeastValue(at("j"), at(add("j", 1)))), 1, 0], "j")),
  0,
);

const PARKING_FUNCTION_STATISTICS: readonly Definition[] = [
  parkingStat(
    "LuckyCars",
    "The cars that park in the spot they prefer.",
    nonEmpty(floored(sumOver(positions, carIsLucky))),
    "FindStat's St000135.",
  ),
  parkingStat(
    "TotalParkingDisplacement",
    "The sum, over the cars, of the spots they drive past: the sum of i - p(i).",
    nonEmpty(floored(sumOver(positions, subtract("i", at("i"))))),
    "FindStat's St000188, which is also the area of the Dyck path of the parking function. Each car's displacement is its spot less its preference and the spots are 1 .. n, so the total is n (n + 1) / 2 less the preferences' sum.",
  ),
  parkingStat(
    "MaximalParkingDisplacement",
    "The most spots any car drives past its preferred spot.",
    nonEmpty(max(forEach(positions, carDisplacement))),
    "FindStat's St000943.",
  ),
  parkingStat(
    "SumLessLength",
    "The sum of the preferences less their number.",
    nonEmpty(subtract(floored(["Sum", x]), length())),
    "FindStat's St000540.",
  ),
  parkingStat(
    "CriticalLeftToRightMaxima",
    "The entries p that are left to right maxima with exactly p - 1 entries smaller and n - p larger.",
    nonEmpty(
      floored(
        sumOver(positions, [
          "If",
          and(
            and(equals(earlierNotSmaller, 0), equals(entriesWhere(less(at("j"), at("i"))), subtract(at("i"), 1))),
            equals(entriesWhere(greater(at("j"), at("i"))), subtract(length(), at("i"))),
          ),
          1,
          0,
        ]),
      ),
    ),
    "FindStat's St000942. A left to right maximum is larger than every entry before it.",
  ),
  parkingStat(
    "Deficiencies",
    "Positions i with p(i) < i.",
    nonEmpty(count(positions, less(here, "i"))),
    "FindStat's St001905.",
  ),
  parkingStat(
    "InitialIncreasingSegmentLength",
    "The length of the initial strictly increasing segment.",
    hasPair(add(1, floored(sumOver(adjacent, ["If", prefixIsIncreasing, 1, 0]))), length()),
    "FindStat's St001904. The first i + 1 entries increase exactly when none of the first i neighboring pairs fails to rise.",
  ),
  parkingStat(
    "Ties",
    "Positions i with p(i) = p(i+1).",
    hasPair(count(adjacent, equals(here, next))),
    "FindStat's St001947.",
  ),
  parkingStat(
    "CenterSize",
    "The length of the longest subsequence a(1), ..., a(k) with a(i) <= i.",
    nonEmpty(fold(x, 0, add("a", ["If", atMostValue("b", add("a", 1)), 1, 0]))),
    "FindStat's St001937. Taking each entry that fits the next index is the longest such subsequence.",
  ),
];

export const WORD_STATISTICS: readonly Definition[] = [...BINARY_WORD_STATISTICS, ...PARKING_FUNCTION_STATISTICS];
