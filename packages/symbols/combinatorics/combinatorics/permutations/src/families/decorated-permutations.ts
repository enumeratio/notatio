// DecoratedPermutations(n) in Epsil: the permutations of 1..n whose fixed points each carry a sign,
// as the one-line list with a fixed point j written −j or +j and every other entry positive.
// There are Σₖ C(n, k) (n − k)! of them (A000522): 1, 2, 5, 16, 65, 326, …
//
// They are listed by the permutation of absolute values in lexicographic order, −j before +j.
//
// The completions h(m, f) count the m positions left when f of them can still be fixed (their own
// value is unused), each fixed point worth two. Weighting a fixed point 2 = 1 + 1 gives
// h(m, f) = Σᵢ C(f, i) (m − i)!, so h(m, 0) = m! and h(m, f) = h(m, f − 1) + h(m − 1, f − 1).
// At position j, with m = n − j positions after it and F of those still fixable, an unused value
// u ≠ j leaves h(m, F − [u > j]) completions (u > j takes its own position away), and u = j
// leaves h(m, F) for each of its two signs.
import type { EpsilFamily } from "../../../collections/src/families/epsil.ts";
import type { Declared } from "../../../collections/src/families/types.ts";
import {
  add,
  and,
  at,
  cell,
  distinctIn,
  equal,
  fold,
  iff,
  less,
  lets,
  map,
  mul,
  quotient,
  rowTable,
  sub,
  upTo,
} from "../../../collections/src/families/tables.ts";
import { hasLength } from "./core.ts";

type MathJSON = unknown;
const N = "_n";

const table = rowTable(
  "dp",
  add(N, 1),
  add(N, 1),
  (c) => iff(equal(c, 0), 1, 0),
  (prev, s, c, here) => iff(equal(c, 0), mul(s, prev(sub(s, 1), 0)), add(here(sub(c, 1)), prev(sub(s, 1), sub(c, 1)))),
);
/** h(m, f). */
const h = (m: MathJSON, f: MathJSON): MathJSON => cell("_tables", add(N, 1))(m, f);

/** How many positions after row j are still fixable, given the used marks at `offset` in `state`. */
const fixable = (state: MathJSON, offset: number, j: MathJSON): MathJSON =>
  fold(add("fx_s", iff(equal(at(state, add(offset, "fx_p")), 0), 1, 0)), "fx_s", "fx_p", 0, upTo(add(j, 1), N));

/** The completions left by an unused absolute value `u` at row j (both signs of a fixed point). */
const block = (u: MathJSON, j: MathJSON, free: MathJSON): MathJSON => {
  const m = sub(N, j);
  return iff(equal(u, j), mul(2, h(m, free)), h(m, sub(free, iff(less(j, u), 1, 0))));
};

// Unrank's state: [r, used₁..used_n, out₁..out_n].
const U = "us";
const unrank = (() => {
  const row = "uj";
  const m = sub(N, row);
  // [rank left, the value chosen], the value 0 until one is.
  const pick = fold(
    iff(
      ["Or", ["NotEqual", at("uq", 2), 0], ["NotEqual", at(U, add(1, "uu")), 0]],
      "uq",
      iff(
        less(at("uq", 1), block("uu", row, "uf")),
        ["List", at("uq", 1), "uu"],
        ["List", sub(at("uq", 1), block("uu", row, "uf")), 0],
      ),
    ),
    "uq",
    "uu",
    ["List", at(U, 1), 0],
    upTo(1, N),
  );
  const step = lets(
    [
      ["uf", fixable(U, 1, row), "integer"],
      ["up", pick, "list<integer>"],
    ],
    lets(
      [
        ["uv", at("up", 2), "integer"],
        ["ut", h(m, "uf"), "integer"],
      ],
      [
        "ReplaceAt",
        [
          "ReplaceAt",
          ["ReplaceAt", U, 1, iff(equal("uv", row), ["Mod", at("up", 1), "ut"], at("up", 1))],
          add(1, "uv"),
          1,
        ],
        add(1, N, row),
        iff(equal("uv", row), iff(less(quotient(at("up", 1), "ut"), 1), ["Negate", row], row), "uv"),
      ],
    ),
  );
  const start = ["Join", ["List", "_r"], map(0, "uz0", upTo(1, mul(2, N)))];
  return ["Drop", fold(step, U, row, start, upTo(1, N)), add(1, N)];
})();

// Rank's state: [rank, used₁..used_n].
const R = "rs";
const rank = (() => {
  const row = "rj";
  const entry = at("_x", row);
  const below = fold(
    add("rb", iff(["NotEqual", at(R, add(1, "rw")), 0], 0, block("rw", row, "rf"))),
    "rb",
    "rw",
    0,
    upTo(1, sub("ru", 1)),
  );
  const step = lets(
    [
      ["rf", fixable(R, 1, row), "integer"],
      ["ru", ["Abs", entry], "integer"],
    ],
    [
      "ReplaceAt",
      [
        "ReplaceAt",
        R,
        1,
        add(at(R, 1), below, iff(and(equal("ru", row), ["Greater", entry, 0]), h(sub(N, row), "rf"), 0)),
      ],
      add(1, "ru"),
      1,
    ],
  );
  return at(fold(step, R, row, ["Join", ["List", 0], map(0, "rz0", upTo(1, N))], upTo(1, N)), 1);
})();

const element = (j: MathJSON): MathJSON => at("_x", j);
/** A positive entry, or −j at row j: the only fixed points that can be negative. */
const signsFit = fold(
  and("sk", ["Or", ["Greater", element("sj"), 0], equal(element("sj"), ["Negate", "sj"])]),
  "sk",
  "sj",
  "True",
  upTo(1, N),
);

/** What Plausible reads: counting and indexing walk a table, polynomial in n. */
const declared: Declared = {
  carrier: "DecoratedPermutation",
  params: [{ name: "size", role: "axis", min: 0 }],
  cost: { count: "polynomial", unrank: "polynomial", rank: "polynomial", valid: "polynomial" },
};

export const decoratedPermutations: EpsilFamily = {
  declared,
  head: "DecoratedPermutations",
  carrier: "DecoratedPermutation",
  paramCount: 1,
  kind: "ints",
  params: [N],
  epsil: {
    tables: table,
    count: h(N, N),
    unrank,
    rank,
    valid: hasLength(
      "_x",
      N,
      and(
        signsFit,
        distinctIn(N, N, (j) => ["Abs", element(j)]),
      ),
    ),
  },
};

export const entries = [decoratedPermutations];
