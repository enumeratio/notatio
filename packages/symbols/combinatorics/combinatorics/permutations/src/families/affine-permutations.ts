// AffinePermutations(n, r) in Epsil: the affine permutations of period n, in window notation
// [w(1), …, w(n)], whose radius max |w(i) − i| is at most r. An affine permutation is a bijection w of
// the integers with w(i + n) = w(i) + n, so its window has distinct residues mod n and the sum
// n(n + 1)/2 (Σ (w(i) − i) = 0). With δᵢ = w(i) − i ∈ [−r, r] the window is read position by position,
// listed lexicographically (δ₁ first, ascending).
//
// The completions C(s, used, d): s positions to go, `used` the set of residues taken (a bit mask,
// bit ρ for the residue ρ) and d the sum of the δ so far, in [−nr, nr]; one table, as the walks
// are. A position i with offset δ takes the residue (i + δ) mod n, free and with d + δ in range.
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
const [N, R] = ["_n", "_rad"];

/** The width of a row: a mask and a running sum d + nr in 0..2nr. */
const spread = add(mul(2, N, R), 1);
const width = mul(["Power", 2, N], spread);
const column = (mask: MathJSON, d: MathJSON): MathJSON => add(mul(mask, spread), d, mul(N, R));
const bit = (residue: MathJSON): MathJSON => ["Power", 2, residue];
const residueOf = (position: MathJSON, delta: MathJSON): MathJSON => [
  "Mod",
  add(position, delta, mul(N, add(R, 1))),
  N,
];
const free = (mask: MathJSON, residue: MathJSON): MathJSON => equal(["Mod", quotient(mask, bit(residue)), 2], 0);
const inRange = (d: MathJSON): MathJSON => and(["GreaterEqual", d, mul(-1, N, R)], ["LessEqual", d, mul(N, R)]);
const deltas = ["Range", mul(-1, R), R, 1];

const table = rowTable(
  "af",
  add(N, 1),
  width,
  (c) => iff(equal(["Mod", c, spread], mul(N, R)), 1, 0),
  (prev, s, c) =>
    lets(
      [
        ["af_m", quotient(c, spread), "integer"],
        ["af_d", sub(["Mod", c, spread], mul(N, R)), "integer"],
      ],
      fold(
        add(
          "af_a",
          iff(
            and(free("af_m", residueOf(sub(add(N, 1), s), "af_k")), inRange(add("af_d", "af_k"))),
            prev(sub(s, 1), column(add("af_m", bit(residueOf(sub(add(N, 1), s), "af_k"))), add("af_d", "af_k"))),
            0,
          ),
        ),
        "af_a",
        "af_k",
        0,
        deltas,
      ),
    ),
);
const completions = (s: MathJSON, mask: MathJSON, d: MathJSON): MathJSON =>
  cell("_tables", width)(s, add(mul(mask, spread), d, mul(N, R)));

/** The completions of position i after taking offset δ from (mask, d). */
const after = (i: MathJSON, mask: MathJSON, d: MathJSON, delta: MathJSON): MathJSON =>
  iff(
    and(free(mask, residueOf(i, delta)), inRange(add(d, delta))),
    completions(sub(N, i), add(mask, bit(residueOf(i, delta))), add(d, delta)),
    0,
  );

// Unrank's state: [rank left, mask, d, window…].
const unrank = (() => {
  const [rest, mask, d] = [at("us", 1), at("us", 2), at("us", 3)];
  const step = lets(
    [
      ["ur", rest, "integer"],
      ["um", mask, "integer"],
      ["ud", d, "integer"],
      // [rank left in the block, the offset, found].
      [
        "ufound",
        fold(
          iff(
            equal(at("uf", 3), 1),
            "uf",
            iff(
              less(at("uf", 1), after("ui", "um", "ud", "uk")),
              ["List", at("uf", 1), "uk", 1],
              ["List", sub(at("uf", 1), after("ui", "um", "ud", "uk")), "uk", 0],
            ),
          ),
          "uf",
          "uk",
          ["List", "ur", 0, 0],
          deltas,
        ),
        "list<integer>",
      ],
      ["uo", at("ufound", 2), "integer"],
    ],
    [
      "ReplaceAt",
      [
        "ReplaceAt",
        ["ReplaceAt", ["ReplaceAt", "us", 1, at("ufound", 1)], 2, add("um", bit(residueOf("ui", "uo")))],
        3,
        add("ud", "uo"),
      ],
      add(3, "ui"),
      add("ui", "uo"),
    ],
  );
  return ["Drop", fold(step, "us", "ui", ["Join", ["List", "_r", 0, 0], map(0, "uz", upTo(1, N))], upTo(1, N)), 3];
})();

// Rank's state: [rank, mask, d].
const rank = (() => {
  const step = lets(
    [
      ["rm", at("rs", 2), "integer"],
      ["rd", at("rs", 3), "integer"],
      ["ro", sub(at("_x", "ri"), "ri"), "integer"],
    ],
    [
      "List",
      add(
        at("rs", 1),
        fold(add("rb", after("ri", "rm", "rd", "rk")), "rb", "rk", 0, ["Range", mul(-1, R), sub("ro", 1), 1]),
      ),
      add("rm", bit(residueOf("ri", "ro"))),
      add("rd", "ro"),
    ],
  );
  return at(fold(step, "rs", "ri", ["List", 0, 0, 0], upTo(1, N)), 1);
})();

const window = (j: MathJSON): MathJSON => at("_x", j);
const valid = hasLength(
  "_x",
  N,
  iff(
    fold(
      and("vok", ["LessEqual", sub(window("vj"), "vj"), R], ["GreaterEqual", sub(window("vj"), "vj"), mul(-1, R)]),
      "vok",
      "vj",
      "True",
      upTo(1, N),
    ),
    and(
      distinctIn(N, N, (j) => add(["Mod", sub(add(window(j), mul(N, add(R, 1))), 1), N], 1), "vd"),
      equal(fold(add("vs", window("vk")), "vs", "vk", 0, upTo(1, N)), quotient(mul(N, add(N, 1)), 2)),
    ),
    "False",
  ),
);

const declared: Declared = {
  carrier: "AffinePermutation",
  params: [
    { name: "n", role: "axis", min: 1 },
    { name: "radius", role: "axis", min: 0 },
  ],
  cost: { count: "polynomial", unrank: "polynomial", rank: "polynomial", valid: "polynomial" },
};

export const affinePermutations: EpsilFamily = {
  head: "AffinePermutations",
  carrier: "AffinePermutation",
  paramCount: 2,
  declared,
  kind: "ints",
  params: [N, R],
  epsil: {
    tables: table,
    count: iff(["Or", less(N, 1), less(R, 0)], 0, completions(N, 0, 0)),
    unrank,
    rank,
    valid: iff(["Or", less(N, 1), less(R, 0)], "False", valid),
  },
};

export const entries = [affinePermutations];
