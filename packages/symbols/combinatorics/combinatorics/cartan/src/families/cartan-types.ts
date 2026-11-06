// FiniteCartanTypes(n): the irreducible finite Cartan types of rank n, in FindStat's order (A, B, C, D, E, F, G).
// Its kernels read a type as the integers [code, n] (A is 1, G is 7); the carrier writes it `CartanType(Tuple("A", n))`.
//   A_n for n ≥ 1;  B_n for n ≥ 2;  C_n for n ≥ 3 (C_2 is B_2);  D_n for n ≥ 4;
//   E_n for n = 6, 7, 8;  F_4;  G_2.
import type { Boxed } from "../../../collections/src/families/types.ts";
import type { EpsilFamily } from "../../../collections/src/families/epsil.ts";
import { add, and, at, equal, iff, len, less, upTo } from "../../../collections/src/families/tables.ts";
import type { Declared } from "../../../collections/src/families/types.ts";
import { CARTAN_LETTERS } from "../carrier-data.ts";

type MathJSON = unknown;

/** Whether the letter with code `c` has a type of rank `_n`. */
const present = (c: MathJSON): MathJSON =>
  iff(
    equal(c, 1),
    ["GreaterEqual", "_n", 1],
    iff(
      equal(c, 2),
      ["GreaterEqual", "_n", 2],
      iff(
        equal(c, 3),
        ["GreaterEqual", "_n", 3],
        iff(
          equal(c, 4),
          ["GreaterEqual", "_n", 4],
          iff(
            equal(c, 5),
            and(["GreaterEqual", "_n", 6], ["LessEqual", "_n", 8]),
            iff(equal(c, 6), equal("_n", 4), equal("_n", 2)),
          ),
        ),
      ),
    ),
  );

/** The codes of the letters that have a type of rank `_n`, ascending. */
const letters: MathJSON = ["Filter", upTo(1, 7), ["Function", present("c"), "c"]];

const declared: Declared = {
  carrier: "CartanType",
  params: [{ name: "rank", role: "axis", min: 1 }],
  cost: { count: "closed", unrank: "closed", rank: "closed", valid: "closed" },
};

export const finiteCartanTypes: EpsilFamily = {
  head: "FiniteCartanTypes",
  carrier: "CartanType",
  carrierCodec: {
    encode: (element) => {
      const [code, rank] = element as [number, number];
      return ["Tuple", `'${CARTAN_LETTERS[code - 1]}'`, rank];
    },
    decode: (contents) => {
      const [letter, rank] = (contents as { ops?: readonly Boxed[] }).ops ?? [];
      const code = CARTAN_LETTERS.indexOf((letter as unknown as { string?: string }).string as never) + 1;
      return [code, Number((rank as unknown as { re?: number }).re)];
    },
  },
  paramCount: 1,
  declared,
  kind: "ints",
  params: ["_n"],
  epsil: {
    count: ["Length", letters],
    unrank: ["List", at(letters, add("_r", 1)), "_n"],
    rank: ["Length", ["Filter", letters, ["Function", less("c", at("_x", 1)), "c"]]],
    valid: iff(
      equal(len, 2),
      and(equal(at("_x", 2), "_n"), [
        "GreaterEqual",
        ["Length", ["Filter", letters, ["Function", equal("c", at("_x", 1)), "c"]]],
        1,
      ]),
      "False",
    ),
  },
};
