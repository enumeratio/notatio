---
name: PositiveBeforeLargerNegativePairCount
domain: Permutation statistics
signature: PositiveBeforeLargerNegativePairCount(p)
summary: "Pairs i < j with 0 < p(i) < -p(j): the occurrences of the signed pattern 1-2."
catalog:
  - system: findstat
    identity: St001771
    url: https://www.findstat.org/St001771
    on: SignedPermutation
statOn:
  - SignedPermutation
signatures:
  - call: PositiveBeforeLargerNegativePairCount(p)
    description: "Pairs i < j with 0 < p(i) < -p(j): the occurrences of the signed pattern 1-2."
    library: enumeratio-combinatorics
    type: (signed_permutation) -> number
---

- Defined over `SignedPermutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `SignedPermutation` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001771. A positive entry followed, later, by a negative entry of larger absolute value.
