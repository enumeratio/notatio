// Combinatorial maps whose `from` carrier is `poset` (conventions as in `permutations/src/maps.ts`). The poset is `_raw`, its
// list of lower covers: entry i holds the elements element i + 1 covers.

import type { CombinatorialMap } from "../../src/map-helpers.ts";
import { canonicalPosetBody } from "./canonical-definitions.ts";
import { canonicalPoset, isReduced, MAX_CODED } from "./canonical.ts";

/** The kernel answers through MAX_CODED elements; past it, or for a value that is no poset, it leaves the call to the guard. */
const canonicalKernel = (raw: unknown): unknown =>
  isReduced(raw) && raw.length <= MAX_CODED ? canonicalPoset(raw) : undefined;

export const POSETS_MAPS: readonly CombinatorialMap[] = [
  {
    name: "CanonicalPoset",
    from: "poset",
    to: "poset",
    body: canonicalPosetBody,
    guard: ["LessEqual", ["Length", "_raw"], MAX_CODED],
    kernel: canonicalKernel,
    summary: "The poset relabeled by the natural labeling with the least code, the one value of its isomorphism class.",
    note: "A natural labeling has a below b only when a < b as labels; a poset's code is the rank of its comparability graph in LabeledGraphs(n). Two posets are isomorphic exactly when their canonical forms are equal.",
  },
];
