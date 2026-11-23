// FactoradicNumerals(n) in Epsil: the factoradic numerals of n digits, as the numerals package's
// `factoradic()` writes them: most significant digit first, the digit at place k at most k (so the
// last is always 0), and no leading 0 except in the numeral 0 itself, [0]. A numeral of n ≥ 2 digits
// has a value in [(n − 1)!, n!), so there are n! − (n − 1)! of them, 1 for n = 1 and none for n = 0.
// They are listed by value, which is their lexicographic order: the rank is the value less the
// least value of n digits.
import type { EpsilFamily } from "../../../collections/src/families/epsil.ts";
import type { Declared } from "../../../collections/src/families/types.ts";
import { add, all, equal, fold, iff, less, map, mul, sub, upTo } from "../../../collections/src/families/tables.ts";
import { between, digit, element, hasLength } from "./core.ts";

const N = "_n";

/** The least value of n digits: (n − 1)! from two digits on, 0 for the numeral [0]. */
const least = iff(equal(N, 1), 0, ["Factorial", sub(N, 1)]);

const declared: Declared = {
  carrier: "FactoradicNumeral",
  params: [{ name: "n", role: "axis", min: 0 }],
  cost: { count: "closed", unrank: "polynomial", rank: "polynomial", valid: "polynomial" },
};

export const factoradicNumerals: EpsilFamily = {
  head: "FactoradicNumerals",
  carrier: "FactoradicNumeral",
  paramCount: 1,
  declared,
  kind: "ints",
  params: [N],
  epsil: {
    count: iff(less(N, 1), 0, iff(equal(N, 1), 1, sub(["Factorial", N], ["Factorial", sub(N, 1)]))),
    unrank: map(digit(N, N, add("_r", least), "j"), "j", upTo(1, N)),
    // Horner over the places' radices: digit j has place n − j, so it is read in radix n − j + 1.
    rank: sub(fold(add(mul("fr", add(sub(N, "fj"), 1)), element("fj")), "fr", "fj", 0, upTo(1, N)), least),
    valid: iff(
      less(N, 1),
      "False",
      hasLength("_x", N, [
        "And",
        all((j) => between(element(j), 0, sub(N, j)), upTo(1, N), "fj"),
        iff(equal(N, 1), "True", ["NotEqual", element(1), 0]),
      ]),
    ),
  },
};

export const entries = [factoradicNumerals];
