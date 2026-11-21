// MultiplicativePartitions(n) in Epsil: the ways to write n as a product of factors greater than 1
// with the order forgotten, as the nonincreasing list of factors (A001055: 1, 1, 1, 2, 1, 2, 1, 3,
// 2, 2, 1, 4, …). n = 1 has the empty product; n = 0 has none. They are listed lexicographically.
//
// g(m, b) counts the factorizations of m into factors at most b: g(1, b) = 1 and, for m > 1,
// g(m, b) = g(m, b − 1) + [b | m] g(m / b, b), the factorizations without a factor b and those
// whose largest factor is b. Lexicographically the lists with first factor below f are g(m, f − 1)
// of the g(m, m), so a first factor is the least f with g(m, f) past the rank left, and a list's
// rank adds g(m, x − 1) for each factor x, m the part of n still to write.
import type { EpsilFamily } from "../../../collections/src/families/epsil.ts";
import type { Declared } from "../../../collections/src/families/types.ts";
import {
  add,
  and,
  at,
  cell,
  equal,
  floorLog2,
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

const table = rowTable(
  "mp",
  add(N, 1),
  add(N, 1),
  () => 0,
  (prev, s, c, here) =>
    iff(
      equal(s, 1),
      1,
      iff(less(c, 2), 0, add(here(sub(c, 1)), iff(equal(["Mod", s, c], 0), prev(quotient(s, c), c), 0))),
    ),
);
/** g(m, b). */
const g = (m: MathJSON, b: MathJSON): MathJSON => cell("_tables", add(N, 1))(m, b);

// Unrank's state: [r, m, b, x₁ …], b the last factor chosen. Once m is 1 a step changes nothing.
const U = "us";
const unrank = (() => {
  const [r, m, b] = [at(U, 1), at(U, 2), at(U, 3)];
  // The least f from 2 with g(m, f) past r: 2 and one for each f below it, g being nondecreasing.
  const first = add(2, fold(add("uc", iff(["LessEqual", g(m, "uf"), r], 1, 0)), "uc", "uf", 0, upTo(2, b)));
  const step = iff(equal(m, 1), U, [
    "Join",
    ["List", sub(r, g(m, sub("uh", 1))), quotient(m, "uh"), "uh"],
    ["Drop", U, 3],
    ["List", "uh"],
  ]);
  return iff(
    less(N, 1),
    ["List"],
    ["Drop", fold(lets([["uh", first, "integer"]], step), U, "ui", ["List", "_r", N, N], upTo(1, floorLog2(N))), 3],
  );
})();

// Rank's state: [rank, m].
const R = "rs";
const rank = at(
  fold(["List", add(at(R, 1), g(at(R, 2), sub("rx", 1))), quotient(at(R, 2), "rx")], R, "rx", ["List", 0, N], "_x"),
  1,
);

// Membership's state: [ok, the last factor, the product].
const V = "vs";
const valid = (() => {
  const result = fold(
    [
      "List",
      iff(and(equal(at(V, 1), 1), ["LessEqual", 2, "vx"], ["LessEqual", "vx", at(V, 2)]), 1, 0),
      "vx",
      mul(at(V, 3), "vx"),
    ],
    V,
    "vx",
    ["List", 1, N, 1],
    "_x",
  );
  return and(equal(at(result, 1), 1), equal(at(result, 3), N));
})();

/** What Plausible reads: counting and indexing walk a table, polynomial in n. */
const declared: Declared = {
  carrier: "MultiplicativePartition",
  params: [{ name: "size", role: "axis", min: 0 }],
  cost: { count: "polynomial", unrank: "polynomial", rank: "polynomial", valid: "polynomial" },
};

export const multiplicativePartitions: EpsilFamily = {
  declared,
  head: "MultiplicativePartitions",
  carrier: "MultiplicativePartition",
  paramCount: 1,
  kind: "ints",
  params: [N],
  epsil: {
    tables: table,
    count: g(N, N),
    unrank,
    rank,
    valid,
  },
};

export const entries = [multiplicativePartitions];
