// RookPlacements(n) in Epsil: the ways to put any number of non-attacking rooks on an n × n board,
// each as the column of its row's rook, 0 for a row with none, so a nonzero column is used once.
// They are the partial injections of [n], Σₖ C(n, k)² k! of them (the matchings of K(n, n)),
// listed in lexicographic order, 0 before any column.
//
// The completions f(m, c), the placements of m rows in c free columns, are one table:
// f(m, c) = f(m − 1, c) + c · f(m − 1, c − 1), the first row empty or in one of the c columns.
// A row with m rows after it and c columns free has f(m, c) placements with no rook there and
// f(m, c − 1) for each free column.
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
  "rk",
  add(N, 1),
  add(N, 1),
  () => 1,
  (prev, s, c) => add(prev(sub(s, 1), c), iff(equal(c, 0), 0, mul(c, prev(sub(s, 1), sub(c, 1))))),
);
/** f(m, c), 0 for no free column to give. */
const f = (m: MathJSON, c: MathJSON): MathJSON => iff(less(c, 0), 0, cell("_tables", add(N, 1))(m, c));

/** The placements of the rows after row j when row j holds no rook, and when it holds a given free column. */
const without = (j: MathJSON, k: MathJSON): MathJSON => f(sub(N, j), sub(N, k));
const within = (j: MathJSON, k: MathJSON): MathJSON => f(sub(N, j), sub(sub(N, k), 1));

/** How many of the columns below `column` are free, given the used marks at `offset` in `state`. */
const freeBelow = (state: MathJSON, offset: number, column: MathJSON): MathJSON =>
  fold(add("fb_s", iff(equal(at(state, add(offset, "fb_c")), 0), 1, 0)), "fb_s", "fb_c", 0, upTo(1, sub(column, 1)));

/** The (d + 1)-th free column, 1-based, given the used marks at `offset` in `state`. */
const nthFree = (state: MathJSON, offset: number, d: MathJSON): MathJSON =>
  at(
    fold(
      iff(
        ["Or", ["NotEqual", at("nf_s", 2), 0], ["NotEqual", at(state, add(offset, "nf_c")), 0]],
        "nf_s",
        iff(
          equal(at("nf_s", 1), d),
          ["List", add(at("nf_s", 1), 1), "nf_c"],
          ["List", add(at("nf_s", 1), 1), at("nf_s", 2)],
        ),
      ),
      "nf_s",
      "nf_c",
      ["List", 0, 0],
      upTo(1, N),
    ),
    2,
  );

// Unrank's state: [r, k, used₁..used_n, out₁..out_n], k the rooks placed so far.
const U = "us";
const unrank = (() => {
  const [r, k] = [at(U, 1), at(U, 2)];
  const row = "uj";
  const step = lets(
    [
      ["uz", without(row, k), "integer"],
      ["up", ["Max", within(row, k), 1], "integer"],
    ],
    iff(
      less(r, "uz"),
      U,
      lets(
        [
          ["ud", quotient(sub(r, "uz"), "up"), "integer"],
          ["uv", nthFree(U, 2, "ud"), "integer"],
        ],
        [
          "ReplaceAt",
          ["ReplaceAt", ["ReplaceAt", ["ReplaceAt", U, 1, ["Mod", sub(r, "uz"), "up"]], 2, add(k, 1)], add(2, "uv"), 1],
          add(2, N, row),
          "uv",
        ],
      ),
    ),
  );
  const start = ["Join", ["List", "_r", 0], map(0, "uz0", upTo(1, mul(2, N)))];
  return ["Drop", fold(step, U, row, start, upTo(1, N)), add(2, N)];
})();

// Rank's state: [rank, k, used₁..used_n].
const R = "rs";
const rank = (() => {
  const [r, k] = [at(R, 1), at(R, 2)];
  const row = "rj";
  const entry = at("_x", row);
  const step = iff(equal(entry, 0), R, [
    "ReplaceAt",
    [
      "ReplaceAt",
      ["ReplaceAt", R, 1, add(r, without(row, k), mul(freeBelow(R, 2, entry), within(row, k)))],
      2,
      add(k, 1),
    ],
    add(2, entry),
    1,
  ]);
  return at(fold(step, R, row, ["Join", ["List", 0, 0], map(0, "rz0", upTo(1, N))], upTo(1, N)), 1);
})();

/** Entries in 0..n, the nonzero ones distinct: a list over the columns marks each as seen, in place,
 *  and its last slot collects a repeat or an entry out of range. */
const distinctRooks = (() => {
  const [seen, j, v] = ["rv_seen", "rv_j", at("_x", "rv_j")];
  const mark = (slot: MathJSON): MathJSON => ["ReplaceAt", seen, slot, 1];
  const bad = mark(add(N, 1));
  const step = iff(
    and(["LessEqual", 0, v], ["LessEqual", v, N]),
    iff(equal(v, 0), seen, iff(equal(at(seen, v), 0), mark(v), bad)),
    bad,
  );
  const marked = fold(step, seen, j, map(0, "rv_z", upTo(1, add(N, 1))), upTo(1, N));
  return equal(at(marked, add(N, 1)), 0);
})();

const declared: Declared = {
  carrier: "RookPlacement",
  params: [{ name: "n", role: "axis", min: 0 }],
  cost: { count: "polynomial", unrank: "polynomial", rank: "polynomial", valid: "polynomial" },
};

export const rookPlacements: EpsilFamily = {
  head: "RookPlacements",
  carrier: "RookPlacement",
  paramCount: 1,
  declared,
  kind: "ints",
  params: [N],
  epsil: {
    tables: table,
    count: f(N, N),
    unrank,
    rank,
    valid: hasLength("_x", N, distinctRooks),
  },
};

export const entries = [rookPlacements];
