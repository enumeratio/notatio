// Combinatorial maps whose `from` carrier is `poset` (conventions as in `permutations/src/maps.ts`). The poset is `_raw`, its
// list of lower covers: entry i holds the elements element i + 1 covers.

import type { CombinatorialMap } from "../../src/map-helpers.ts";
import { canonicalPosetBody } from "./canonical-definitions.ts";
import { canonicalPoset, isReduced, MAX_CODED } from "./canonical.ts";

/** The kernel answers through MAX_CODED elements; past it, or for a value that is no poset, it leaves the call to the guard. */
const canonicalKernel = (raw: unknown): unknown =>
  isReduced(raw) && raw.length <= MAX_CODED ? canonicalPoset(raw) : undefined;

/** The definition builds a table of every permutation: compiled it takes 0.6 s at 7 elements and a minute at 8, and
 *  interpreted it takes 22 s at 6 and runs out of memory at 7. It answers only what the kernel leaves to it (a value that
 *  is no poset), and only through this many elements. */
const DEFINITION_LIMIT = 6;

export const POSETS_MAPS: readonly CombinatorialMap[] = [
  {
    name: "CanonicalPoset",
    from: "poset",
    to: "poset",
    body: canonicalPosetBody,
    guard: ["LessEqual", ["Length", "_raw"], DEFINITION_LIMIT],
    kernel: canonicalKernel,
    summary: "The poset relabeled by the natural labeling with the least code, the one value of its isomorphism class.",
    note: "A natural labeling has a below b only when a < b as labels, and a poset's code is the rank of its comparability graph in LabeledGraphs(n): the pairs (a, b), a < b, numbered in lex order from 1, pair k the bit k - 1, set when a is below b. Two posets are isomorphic exactly when their canonical forms are equal, and the members of Posets(n) are the posets that are their own canonical forms. The definition tries every natural relabeling; the kernel that answers instead chooses the element for label n, then n - 1, down to 1, keeping the candidates whose block of pairs is least, and answers through 10 elements. That limit is what the checks cover, and the last size a code fits a double: the definition's body, run without its guard, gives the kernel's answer on a fixed sample at every size through 10 (all of it through 7, and past 7 with its table of permutations supplied), the properties of a canonical form hold on a sample through 10, and an independent brute force over every natural labeling finds the same least code on posets of 9 and 10. Past 10 the call is left unevaluated, as it is for a value that is no poset past 6.",
  },
];
