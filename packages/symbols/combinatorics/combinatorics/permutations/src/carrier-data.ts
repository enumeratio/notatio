// Carrier data for the permutations area (https://github.com/enumeratio/notatio/wiki/Speculative-Combinatorics-Layering-and-Plausible §4 step 4). Hand-maintained: split from the retired domains/scripts/extract.ts
// generator, one-time, from the last generated domain-data.ts. Families for this area move
// here in step 5.

import type { Carrier } from "@notatio/structures";

export const PERMUTATIONS_CARRIERS: readonly Carrier[] = [
  {
    name: "AffinePermutation",
    readable: true,
    type: "affine_permutation",
    shape: "list<integer>",
    id: "affine_permutation",
    plural: "AffinePermutations",
  },
  {
    name: "Arrangement",
    readable: true,
    type: "arrangement",
    shape: "list<integer>",
    id: "arrangement",
    plural: "Arrangements",
  },
  {
    name: "ColoredPermutation",
    readable: true,
    type: "colored_permutation",
    shape: "tuple<list<integer>, list<integer>>",
    id: "colored_permutation",
    plural: "ColoredPermutations",
  },
  {
    name: "CycleDecomposition",
    type: "cycle_decomposition",
    shape: "list<list<integer>>",
    id: "cycle_decomposition",
    plural: "PermutationsAsCycles",
  },
  {
    name: "DecoratedPermutation",
    readable: true,
    type: "decorated_permutation",
    shape: "list<integer>",
    id: "decorated_permutation",
    plural: "DecoratedPermutations",
  },
  {
    name: "FactoradicNumeral",
    readable: true,
    type: "factoradic_numeral",
    shape: "list<integer>",
    id: "factoradic_numeral",
    plural: "FactoradicNumerals",
  },
  {
    name: "Permutation",
    readable: true,
    type: "permutation",
    shape: "list<integer>",
    id: "permutation",
    plural: "Permutations",
  },
  {
    name: "PermutationInversion",
    readable: true,
    type: "permutation_inversion",
    shape: "list<integer>",
    id: "permutation_inversion",
    plural: "PermutationInversions",
  },
  {
    name: "RookPlacement",
    readable: true,
    type: "rook_placement",
    shape: "list<integer>",
    id: "rook_placement",
    plural: "RookPlacements",
  },
  {
    name: "SignedPermutation",
    readable: true,
    type: "signed_permutation",
    shape: "list<integer>",
    id: "signed_permutation",
    plural: "SignedPermutations",
  },
  {
    name: "SubexcedantSeq",
    type: "subexcedant_seq",
    shape: "list<integer>",
    id: "subexcedant_seq",
    plural: "SubexcedantSeqs",
  },
];
