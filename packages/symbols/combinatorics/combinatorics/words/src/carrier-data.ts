// Carrier data for the words area (https://github.com/enumeratio/notatio/wiki/Speculative-Combinatorics-Layering-and-Plausible §4 step 4). Hand-maintained: split from the retired domains/scripts/extract.ts
// generator, one-time, from the last generated domain-data.ts. Families for this area move
// here in step 5.

import type { Carrier } from "@notatio/structures";

export const WORDS_CARRIERS: readonly Carrier[] = [
  {
    name: "AscentSequence",
    type: "ascent_sequence",
    shape: "list<integer>",
    id: "ascent_sequence",
    plural: "AscentSequences",
  },
  {
    name: "BinaryWord",
    type: "binary_word",
    shape: "list<integer>",
    id: "binary_word",
    plural: "BinaryWords",
  },
  {
    name: "Endofunction",
    readable: true,
    type: "endofunction",
    shape: "list<integer>",
    id: "endofunction",
    plural: "Endofunctions",
  },
  {
    name: "HyperbinaryWord",
    readable: true,
    type: "hyperbinary_word",
    shape: "list<integer>",
    id: "hyperbinary_word",
    plural: "HyperbinaryWords",
  },
  {
    name: "HypernumeraryWord",
    type: "hypernumerary_word",
    shape: "list<integer>",
    id: "hypernumerary_word",
    plural: "HypernumeraryWords",
  },
  {
    name: "ParkingFunction",
    readable: true,
    type: "parking_function",
    shape: "list<integer>",
    id: "parking_function",
    plural: "ParkingFunctions",
  },
  {
    name: "StirlingPermutation",
    readable: true,
    type: "stirling_permutation",
    shape: "list<integer>",
    id: "stirling_permutation",
    plural: "StirlingPermutations",
  },
  {
    name: "TernaryGrayCode",
    readable: true,
    type: "ternary_gray_code",
    shape: "list<integer>",
    id: "ternary_gray_code",
    plural: "TernaryGrayCodes",
  },
  {
    name: "Word",
    readable: true,
    type: "word",
    shape: "list<integer>",
    id: "word",
    plural: "Words",
  },
];
