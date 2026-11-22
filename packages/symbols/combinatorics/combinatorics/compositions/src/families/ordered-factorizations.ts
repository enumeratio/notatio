// OrderedFactorizations(n) in Epsil: the ways to write n as a product of factors greater than 1,
// the order kept (A074206: 1, 1, 1, 1, 2, 1, 3, 1, 4, 2, 3, 1, 8, …). n = 1 has the empty product;
// n = 0 has none. They are listed lexicographically.
//
// h(m) counts the factorizations of m: h(1) = 1 and h(m) = Σ_{f | m, 1 < f} h(m / f), the first
// factor f leaving a factorization of m / f. A list's rank adds, for each factor x, the
// h(m / f) of the smaller first factors f that divide m, m the part of n still to write.
import type { EpsilFamily } from "../../../collections/src/families/epsil.ts";
import type { Declared } from "../../../collections/src/families/types.ts";
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

const divides = (f: MathJSON, m: MathJSON): MathJSON => equal(["Mod", m, f], 0);

/** h(0..n), entry m + 1 holding h(m). */
const counts = fold(
  [
    "Join",
    "ht",
    [
      "List",
      fold(
        add("hs", iff(divides("hf", "hm"), at("ht", add(quotient("hm", "hf"), 1)), 0)),
        "hs",
        "hf",
        0,
        upTo(2, "hm"),
      ),
    ],
  ],
  "ht",
  "hm",
  ["List", 0, 1],
  upTo(2, N),
  "list<integer>",
);
const h = (m: MathJSON): MathJSON => at("_tables", add(m, 1));

// Unrank's state: [r, m, x₁ …]. Once m is 1 a step changes nothing.
const U = "us";
const unrank = (() => {
  const [r, m] = [at(U, 1), at(U, 2)];
  // [rank left, the factor chosen], 0 until one is.
  const pick = fold(
    iff(
      ["Or", ["NotEqual", at("uq", 2), 0], ["Not", divides("uf", m)]],
      "uq",
      lets(
        [["uz", h(quotient(m, "uf")), "integer"]],
        iff(less(at("uq", 1), "uz"), ["List", at("uq", 1), "uf"], ["List", sub(at("uq", 1), "uz"), 0]),
      ),
    ),
    "uq",
    "uf",
    ["List", r, 0],
    upTo(2, m),
  );
  const step = iff(
    equal(m, 1),
    U,
    lets(
      [["up", pick, "list<integer>"]],
      ["Join", ["List", at("up", 1), quotient(m, at("up", 2))], ["Drop", U, 2], ["List", at("up", 2)]],
    ),
  );
  return iff(less(N, 1), ["List"], ["Drop", fold(step, U, "ui", ["List", "_r", N], upTo(1, floorLog2(N))), 2]);
})();

// Rank's state: [rank, m].
const R = "rs";
const rank = (() => {
  const m = at(R, 2);
  const below = fold(add("rb", iff(divides("rf", m), h(quotient(m, "rf")), 0)), "rb", "rf", 0, upTo(2, sub("rx", 1)));
  return at(fold(["List", add(at(R, 1), below), quotient(m, "rx")], R, "rx", ["List", 0, N], "_x"), 1);
})();

// Membership's state: [ok, the product].
const V = "vs";
const valid = (() => {
  const result = fold(
    ["List", iff(and(equal(at(V, 1), 1), ["LessEqual", 2, "vx"]), 1, 0), mul(at(V, 2), "vx")],
    V,
    "vx",
    ["List", 1, 1],
    "_x",
  );
  return and(equal(at(result, 1), 1), equal(at(result, 2), N));
})();

/** What Plausible reads: counting and indexing walk a table, polynomial in n. */
const declared: Declared = {
  carrier: "OrderedFactorization",
  params: [{ name: "size", role: "axis", min: 0 }],
  cost: { count: "polynomial", unrank: "polynomial", rank: "polynomial", valid: "polynomial" },
};

export const orderedFactorizations: EpsilFamily = {
  declared,
  head: "OrderedFactorizations",
  carrier: "OrderedFactorization",
  paramCount: 1,
  kind: "ints",
  params: [N],
  epsil: {
    tables: counts,
    count: h(N),
    unrank,
    rank,
    valid,
  },
};

export const entries = [orderedFactorizations];
