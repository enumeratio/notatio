// Posets(n): the posets on n elements up to isomorphism, one canonical value each, in ascending canonical code. The Epsil
// definitions (../canonical-definitions.ts) are the meaning; the kernel (../canonical.ts) generates the classes on first
// use, a size from the one below, and is the fast path through MAX_LISTED elements.
import type { EpsilFamily } from "../../../collections/src/families/epsil.ts";
import { posetsDefinitions } from "../canonical-definitions.ts";
import { isPosetMember, MAX_LISTED, posetAt, posetCount, posetRank } from "../canonical.ts";

/** What the definitions scan at n elements: every code below 2^C(n, 2). Past MAX_LISTED the figure is only held under 2^4096,
 *  which is as far over the enumeration limit as any answer needs. */
const codesScanned = (n: number): bigint => 2n ** BigInt(Math.min((n * (n - 1)) / 2, 4096));

export const posets: EpsilFamily = {
  head: "Posets",
  carrier: "Poset",
  paramCount: 1,
  kind: "blocks",
  params: ["_n"],
  // Past MAX_LISTED the list is not generated and the definitions would scan 2^C(n, 2) codes: the count declines at once.
  declinePastDoubles: "count",
  early: { pastDoubles: ([n]) => n > MAX_LISTED },
  declared: {
    carrier: "Poset",
    params: [{ name: "n", role: "axis", min: 0, max: MAX_LISTED }],
    cost: { count: "enumerative", unrank: "enumerative", rank: "enumerative", valid: "polynomial" },
    work: ([n]) => (n <= MAX_LISTED ? BigInt(posetCount(n)) : codesScanned(n)),
  },
  epsil: posetsDefinitions,
  fast: {
    count: ([n]) => posetCount(n),
    unrank: ([n], r) => posetAt(n, r),
    rank: (element) => posetRank(element),
    valid: (element, [n]) => isPosetMember(element, n),
  },
};
