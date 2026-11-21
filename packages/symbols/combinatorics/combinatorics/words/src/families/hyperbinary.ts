// HyperbinaryWords(n) in Epsil: the hyperbinary representations of n, n = Σ dᵢ 2ⁱ with every digit
// 0, 1 or 2, written most significant digit first with no leading 0 (the empty word for n = 0).
// There are b(n) = s(n + 1) of them, s Stern's diatomic sequence: 1, 1, 2, 1, 3, 2, 3, 1, 4, …
//
// The last digit decides the rest. An odd n ends in 1, over a representation of (n − 1)/2. An even n
// ends in 0 over one of n/2, or in 2 over one of n/2 − 1, so b(2m) = b(m) + b(m − 1), b(2m + 1) = b(m).
// The words are listed by their last digit first, 0 before 1 before 2, and then by the rest.
import type { EpsilFamily } from "../../../collections/src/families/epsil.ts";
import {
  add,
  and,
  at,
  equal,
  floorLog2,
  fold,
  iff,
  less,
  lets,
  mul,
  quotient,
  sub,
  upTo,
} from "../../../collections/src/families/tables.ts";

type MathJSON = unknown;
const N = "_n";

const odd = (m: MathJSON): MathJSON => equal(["Mod", m, 2], 1);

/** b(0..n), entry m + 1 holding b(m). */
const counts = fold(
  [
    "Join",
    "bt",
    [
      "List",
      iff(
        odd("bm"),
        at("bt", add(quotient("bm", 2), 1)),
        add(at("bt", add(quotient("bm", 2), 1)), at("bt", quotient("bm", 2))),
      ),
    ],
  ],
  "bt",
  "bm",
  ["List", 1],
  upTo(1, N),
  "list<integer>",
);
const b = (m: MathJSON): MathJSON => at("_tables", add(m, 1));

// Unrank's state: [m, r, digits so far, most significant first]. Each step takes the last digit of
// what is left of n and puts it in front; once m is 0 a step changes nothing.
const S = "us";
const unrank = iff(
  equal(N, 0),
  ["List"],
  [
    "Drop",
    fold(
      iff(
        equal(at(S, 1), 0),
        S,
        iff(
          odd(at(S, 1)),
          ["Join", ["List", quotient(at(S, 1), 2), at(S, 2), 1], ["Drop", S, 2]],
          lets(
            [["uh", quotient(at(S, 1), 2), "integer"]],
            iff(
              less(at(S, 2), b("uh")),
              ["Join", ["List", "uh", at(S, 2), 0], ["Drop", S, 2]],
              ["Join", ["List", sub("uh", 1), sub(at(S, 2), b("uh")), 2], ["Drop", S, 2]],
            ),
          ),
        ),
      ),
      S,
      "ui",
      ["List", N, "_r"],
      upTo(1, add(floorLog2(N), 1)),
    ),
    2,
  ],
);

// Rank: the digits from the front, the state [value so far, rank]. A final 2 skips the words that end
// in 0 over the same prefix, b(value + 1) of them, value being that prefix.
const rank = at(
  fold(
    [
      "List",
      add(mul(2, at("rs", 1)), "rd"),
      iff(equal("rd", 2), add(at("rs", 2), b(add(at("rs", 1), 1))), at("rs", 2)),
    ],
    "rs",
    "rd",
    ["List", 0, 0],
    "_x",
  ),
  2,
);

const digits = fold(and("vok", ["LessEqual", 0, "vd"], ["LessEqual", "vd", 2]), "vok", "vd", "True", "_x");
const value = fold(add(mul(2, "vv"), "vw"), "vv", "vw", 0, "_x");

export const hyperbinaryWords: EpsilFamily = {
  head: "HyperbinaryWords",
  carrier: "HyperbinaryWord",
  paramCount: 1,
  kind: "ints",
  params: [N],
  epsil: {
    tables: counts,
    count: b(N),
    unrank,
    rank,
    valid: and(digits, equal(value, N), iff(equal(["Length", "_x"], 0), "True", ["NotEqual", at("_x", 1), 0])),
  },
};

export const entries = [hyperbinaryWords];
