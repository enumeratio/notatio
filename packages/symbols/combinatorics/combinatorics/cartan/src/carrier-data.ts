// Carrier data for the finite Cartan types. A type is `CartanType(Tuple("A", 3))`: the letter and the rank,
// FindStat's `['A', 3]`.

import type { Carrier } from "@enumeratio/structures";

export const CARTAN_CARRIERS: readonly Carrier[] = [
  {
    name: "CartanType",
    type: "cartan_type",
    shape: "tuple<string, integer>",
    id: "cartan_type",
    plural: "FiniteCartanTypes",
  },
];

/** The letters of the irreducible finite types, in the order their codes number them (A is 1, G is 7). */
export const CARTAN_LETTERS = ["A", "B", "C", "D", "E", "F", "G"] as const;
