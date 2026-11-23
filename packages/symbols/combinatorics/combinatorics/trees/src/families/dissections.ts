// Dissections(n) in Epsil: the dissections of a convex (n + 2)-gon, vertices 1..n + 2, by non-crossing
// diagonals, A001003: 1, 1, 3, 11, 45, … Written as the diagonals' endpoints, flat, [i₁, j₁, i₂, j₂, …]
// with i < j − 1, in the order of start and then longest first (preorder); the carrier holds them
// with the number of sides, n + 2. A dissection is a bracketing of the n + 1 sides but the first
// (./bracketings.ts), a bracket over sides a..b the diagonal (a, b + 1), and the family lists
// them in the order of those bracketings, which TotalPartitions(n + 1) does too.
import type { EpsilFamily } from "../../../collections/src/families/epsil.ts";
import type { Declared } from "../../../collections/src/families/types.ts";
import {
  add,
  all,
  and,
  at,
  equal,
  iff,
  less,
  lets,
  quotient,
  sub,
  upTo,
} from "../../../collections/src/families/tables.ts";
import { bracketings } from "./bracketings.ts";

const N = "_n";
const sides = add(N, 2);
const b = bracketings(add(N, 1));

const pairs = quotient(["Length", "_x"], 2);
const start = (p: unknown): unknown => at("_x", sub(["Multiply", 2, p], 1));
const end = (p: unknown): unknown => at("_x", ["Multiply", 2, p]);

/** Each chord inside the polygon and not a side or the whole, every two in order and not crossing. */
const members = and(
  all(
    (p) =>
      and(
        ["GreaterEqual", start(p), 1],
        ["GreaterEqual", end(p), add(start(p), 2)],
        ["LessEqual", end(p), sides],
        ["Not", and(equal(start(p), 1), equal(end(p), sides))],
      ),
    upTo(1, pairs),
    "vp",
  ),
  all(
    (p) =>
      all(
        (q) =>
          and(
            ["Or", less(start(p), start(q)), and(equal(start(p), start(q)), ["Greater", end(p), end(q)])],
            ["Not", and(less(start(p), start(q)), less(start(q), end(p)), less(end(p), end(q)))],
          ),
        upTo(add(p, 1), pairs),
        "vq",
      ),
    upTo(1, pairs),
    "vr",
  ),
);

const declared: Declared = {
  carrier: "Dissection",
  params: [{ name: "n", role: "axis", min: 0 }],
  cost: { count: "polynomial", unrank: "polynomial", rank: "polynomial", valid: "polynomial" },
};

export const dissections: EpsilFamily = {
  head: "Dissections",
  carrier: "Dissection",
  // The carrier's value is (diagonals, sides); the element is the diagonals.
  carrierCodec: {
    encode: (element, p) => ["Tuple", ["List", ...(element as number[])], p[0]! + 2],
    decode: (contents) => {
      const diagonals = (contents as unknown as { ops?: readonly { ops?: readonly { re?: number }[] }[] }).ops?.[0];
      return (diagonals?.ops ?? []).map((v) => Number(v.re));
    },
  },
  paramCount: 1,
  declared,
  kind: "ints",
  params: [N],
  epsil: {
    count: iff(less(N, 0), 0, b.count),
    tables: b.tables,
    unrank: b.unrankChords,
    rank: lets([["cx", "_x", "list<integer>"]], b.rankChords),
    valid: iff(less(N, 0), "False", iff(equal(["Mod", ["Length", "_x"], 2], 0), members, "False")),
  },
};
