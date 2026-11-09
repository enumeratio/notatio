// Mp00321: the 2-conjugate of an integer partition. Every non-zero remainder mod 2 is 1, so the remainder sequence
// is a run of ones, one for each odd part. A state is `w` rows of the reduced partition (the parts halved), then the
// rows of the odd parts, then, going forward only, each odd part's flag: 0 (yellow) when it sits directly under the
// odd part before it, else 1 (green). A list holds the entries of all three segments, one after another.

import { fold } from "../../collections/src/families/tables.ts";
import { lets, type MathJSON } from "../../src/map-helpers.ts";

const LIST = "list<integer>";
const plus = (...terms: MathJSON[]): MathJSON => ["Add", ...terms];
const minus = (a: MathJSON, b: MathJSON): MathJSON => ["Subtract", a, b];
const upTo = (m: MathJSON): MathJSON => ["Range", 1, m, 1];
const item = (list: MathJSON, index: MathJSON): MathJSON => ["At", list, index];
const eachOf = (over: MathJSON, body: MathJSON, variable: string): MathJSON => [
  "Map",
  ["Function", body, variable],
  over,
];
const when = (test: MathJSON, then: MathJSON, otherwise: MathJSON): MathJSON => ["If", test, then, otherwise];
/** How many of `over` pass `test`, which reads the loop variable `v`. */
const tally = (over: MathJSON, test: MathJSON, v: string, acc: string): MathJSON => [
  "Fold",
  ["Function", when(test, plus(acc, 1), acc), acc, v],
  0,
  over,
];

/** `w` rows of the diagram, `r` odd parts; the state `s` read by segment. */
const w = "tc_w";
const r = "tc_r";
const rowsOf = (s: string, q: MathJSON): MathJSON => item(s, q);
const rowOfOdd = (s: string, j: MathJSON): MathJSON => item(s, plus(w, j));
const flagOf = (s: string, j: MathJSON): MathJSON => item(s, plus(w, r, j));

/** One forward step of the construction at the odd parts 1 .. k + 1: the rows of the first k odd parts gain a cell;
 *  a yellow part k + 1 hands each its predecessor's row plus one, and a green part moves each down one row. */
const forwardStep = (s: string, k: string): MathJSON =>
  lets(
    [["tc_y", when(["Equal", flagOf(s, plus(k, 1)), 0], 1, 0), "integer"]],
    eachOf(
      upTo(plus(w, r, r)),
      when(
        ["LessEqual", "tc_t", w],
        plus(rowsOf(s, "tc_t"), tally(upTo(k), ["Equal", rowOfOdd(s, "tc_j"), minus("tc_t", 1)], "tc_j", "tc_c")),
        when(
          ["LessEqual", "tc_t", plus(w, r)],
          lets(
            [["tc_p", minus("tc_t", w), "integer"]],
            when(
              ["Equal", "tc_y", 1],
              when(
                ["Equal", "tc_p", 1],
                0,
                when(["LessEqual", "tc_p", plus(k, 1)], plus(rowOfOdd(s, minus("tc_p", 1)), 1), rowOfOdd(s, "tc_p")),
              ),
              when(["LessEqual", "tc_p", k], plus(rowOfOdd(s, "tc_p"), 1), rowOfOdd(s, "tc_p")),
            ),
          ),
          lets(
            [["tc_p", minus("tc_t", plus(w, r)), "integer"]],
            when(
              ["Equal", "tc_y", 1],
              when(["LessEqual", "tc_p", plus(k, 1)], 1, flagOf(s, "tc_p")),
              when(["LessEqual", "tc_p", k], 1, flagOf(s, "tc_p")),
            ),
          ),
        ),
      ),
      "tc_t",
    ),
  );

/** One backward step at the odd parts 1 .. k + 1 (a state of the rows only): a yellow step (the first odd part in
 *  row 0) takes each row from the next odd part's less one, a green step takes its own less one; the new rows lose a
 *  cell. */
const backwardStep = (s: string, k: string): MathJSON =>
  lets(
    [["tc_y", when(["Equal", rowOfOdd(s, 1), 0], 1, 0), "integer"]],
    eachOf(
      upTo(plus(w, r)),
      when(
        ["LessEqual", "tc_t", w],
        minus(
          rowsOf(s, "tc_t"),
          tally(
            upTo(k),
            [
              "Equal",
              minus(when(["Equal", "tc_y", 1], rowOfOdd(s, plus("tc_j", 1)), rowOfOdd(s, "tc_j")), 1),
              minus("tc_t", 1),
            ],
            "tc_j",
            "tc_c",
          ),
        ),
        lets(
          [["tc_p", minus("tc_t", w), "integer"]],
          when(
            ["LessEqual", "tc_p", k],
            minus(when(["Equal", "tc_y", 1], rowOfOdd(s, plus("tc_p", 1)), rowOfOdd(s, "tc_p")), 1),
            rowOfOdd(s, "tc_p"),
          ),
        ),
      ),
      "tc_t",
    ),
  );

/** The partition `_raw` run through the forward construction, conjugated, the construction undone, and the parts
 *  rebuilt: twice each reduced row, plus one for each odd part in it. */
export const twoConjugateBody: MathJSON = lets(
  [
    ["tc_n", ["Fold", ["Function", plus("tc_a", "tc_p"), "tc_a", "tc_p"], 0, "_raw"], "integer"],
    [w, plus(["Multiply", 2, "tc_n"], 2), "integer"],
    [
      "tc_odd",
      eachOf(
        ["Filter", upTo(["Length", "_raw"]), ["Function", ["Equal", ["Mod", item("_raw", "tc_i"), 2], 1], "tc_i"]],
        minus("tc_i", 1),
        "tc_i",
      ),
      LIST,
    ],
    [r, ["Length", "tc_odd"], "integer"],
    [
      "tc_s0",
      [
        "Join",
        eachOf(
          upTo(w),
          when(["LessEqual", "tc_q", ["Length", "_raw"]], ["Floor", ["Divide", item("_raw", "tc_q"), 2]], 0),
          "tc_q",
        ),
        "tc_odd",
        eachOf(
          upTo(r),
          when(
            ["Equal", "tc_j", 1],
            1,
            when(["Equal", item("tc_odd", "tc_j"), plus(item("tc_odd", minus("tc_j", 1)), 1)], 0, 1),
          ),
          "tc_j",
        ),
      ],
      LIST,
    ],
    ["tc_s1", fold(forwardStep("tc_a", "tc_k"), "tc_a", "tc_k", "tc_s0", upTo(minus(r, 1)), LIST) as MathJSON, LIST],
    [
      "tc_s2",
      [
        "Join",
        eachOf(upTo(w), tally(upTo(w), ["GreaterEqual", item("tc_s1", "tc_u"), "tc_q"], "tc_u", "tc_c"), "tc_q"),
        eachOf(upTo(r), item("tc_s1", plus(item("tc_s1", plus(w, minus(plus(r, 1), "tc_j"))), 1)), "tc_j"),
      ],
      LIST,
    ],
    [
      "tc_s3",
      fold(
        lets([["tc_k2", minus(r, "tc_m"), "integer"]], backwardStep("tc_b", "tc_k2")),
        "tc_b",
        "tc_m",
        "tc_s2",
        upTo(minus(r, 1)),
        LIST,
      ) as MathJSON,
      LIST,
    ],
  ],
  [
    "Filter",
    eachOf(
      upTo(w),
      plus(
        ["Multiply", 2, item("tc_s3", "tc_q")],
        tally(upTo(r), ["Equal", item("tc_s3", plus(w, "tc_j")), minus("tc_q", 1)], "tc_j", "tc_c"),
      ),
      "tc_q",
    ),
    ["Function", ["Greater", "tc_x", 0], "tc_x"],
  ],
);
