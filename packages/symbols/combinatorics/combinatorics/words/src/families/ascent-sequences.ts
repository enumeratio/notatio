// AscentSequences(n) in Epsil: the sequences x₁ … xₙ with x₁ = 0 and 0 ≤ xᵢ ≤ 1 + asc(x₁ … xᵢ₋₁),
// asc counting the positions j with xⱼ < xⱼ₊₁. There are the Fishburn numbers (A022493) of them:
// 1, 1, 2, 5, 15, 53, 217, … They are listed lexicographically.
//
// What a sequence may do next is fixed by its ascent count a and its last entry ℓ, and ℓ ≤ a always
// (an ascent to xᵢ = 1 + a raises a to match it; anything else stays at or below the last entry).
// T(s, a, ℓ) counts the ways to put s more entries after a prefix in that state:
// T(0, a, ℓ) = 1 and T(s, a, ℓ) = Σ_{v = 0}^{a + 1} T(s − 1, a + [v > ℓ], v). The state (a, ℓ) is
// the one column a (n + 1) + ℓ of the table.
import type { EpsilFamily } from "../../../collections/src/families/epsil.ts";
import type { Declared } from "../../../collections/src/families/types.ts";
import {
  add,
  and,
  at,
  cell,
  equal,
  fold,
  iff,
  less,
  lets,
  mul,
  quotient,
  rowTable,
  sub,
  upTo,
} from "../../../collections/src/families/tables.ts";

type MathJSON = unknown;
const N = "_n";
const D = add(N, 1);
const WIDTH = mul(D, D);

/** 1 when v > l: the entry v is an ascent over l. */
const ascent = (l: MathJSON, v: MathJSON): MathJSON => iff(less(l, v), 1, 0);
/** The column of the state (a, l). */
const column = (a: MathJSON, l: MathJSON): MathJSON => add(mul(a, D), l);

const table = rowTable(
  "as",
  D,
  WIDTH,
  () => 1,
  (prev, s, c) =>
    lets(
      [
        ["ta", quotient(c, D), "integer"],
        ["tl", ["Mod", c, D], "integer"],
      ],
      iff(
        less("ta", N),
        fold(
          add("ts", prev(sub(s, 1), column(add("ta", ascent("tl", "tv")), "tv"))),
          "ts",
          "tv",
          0,
          upTo(0, add("ta", 1)),
        ),
        0,
      ),
    ),
);
/** T(s, a, l). */
const t = (s: MathJSON, a: MathJSON, l: MathJSON): MathJSON => cell("_tables", WIDTH)(s, column(a, l));

// Unrank's state: [r, a, ℓ, x₁ … xᵢ].
const U = "us";
const unrank = (() => {
  const [r, a, l] = [at(U, 1), at(U, 2), at(U, 3)];
  const left = sub(N, "ui");
  // [rank left, the entry chosen], −1 until one is.
  const pick = fold(
    iff(
      ["GreaterEqual", at("uq", 2), 0],
      "uq",
      lets(
        [["uz", t(left, add(a, ascent(l, "uv")), "uv"), "integer"]],
        iff(less(at("uq", 1), "uz"), ["List", at("uq", 1), "uv"], ["List", sub(at("uq", 1), "uz"), -1]),
      ),
    ),
    "uq",
    "uv",
    ["List", r, -1],
    upTo(0, add(a, 1)),
  );
  const step = lets(
    [["up", pick, "list<integer>"]],
    ["Join", ["List", at("up", 1), add(a, ascent(l, at("up", 2))), at("up", 2)], ["Drop", U, 3], ["List", at("up", 2)]],
  );
  return iff(equal(N, 0), ["List"], ["Drop", fold(step, U, "ui", ["List", "_r", 0, 0, 0], upTo(2, N)), 3]);
})();

// Rank's state: [rank, a, ℓ].
const R = "rs";
const rank = (() => {
  const [a, l] = [at(R, 2), at(R, 3)];
  const x = at("_x", "ri");
  const below = fold(add("rb", t(sub(N, "ri"), add(a, ascent(l, "rv")), "rv")), "rb", "rv", 0, upTo(0, sub(x, 1)));
  const step = ["List", add(at(R, 1), below), add(a, ascent(l, x)), x];
  return iff(equal(N, 0), 0, at(fold(step, R, "ri", ["List", 0, 0, 0], upTo(2, N)), 1));
})();

// Membership's state: [ok, a], the sequence in range so far and its ascent count.
const V = "vs";
const valid = (() => {
  const x = (i: MathJSON): MathJSON => at("_x", i);
  const step = [
    "List",
    iff(and(equal(at(V, 1), 1), ["LessEqual", 0, x("vi")], ["LessEqual", x("vi"), add(at(V, 2), 1)]), 1, 0),
    add(at(V, 2), ascent(x(sub("vi", 1)), x("vi"))),
  ];
  const run = iff(equal(x(1), 0), equal(at(fold(step, V, "vi", ["List", 1, 0], upTo(2, N)), 1), 1), "False");
  return iff(equal(["Length", "_x"], N), iff(equal(N, 0), "True", run), "False");
})();

/** What Plausible reads: counting and indexing walk a table, polynomial in n. */
const declared: Declared = {
  carrier: "AscentSequence",
  params: [{ name: "size", role: "axis", min: 0 }],
  cost: { count: "polynomial", unrank: "polynomial", rank: "polynomial", valid: "polynomial" },
};

export const ascentSequences: EpsilFamily = {
  declared,
  head: "AscentSequences",
  carrier: "AscentSequence",
  paramCount: 1,
  kind: "ints",
  params: [N],
  epsil: {
    tables: table,
    count: iff(equal(N, 0), 1, t(sub(N, 1), 0, 0)),
    unrank,
    rank,
    valid,
  },
};

export const entries = [ascentSequences];
