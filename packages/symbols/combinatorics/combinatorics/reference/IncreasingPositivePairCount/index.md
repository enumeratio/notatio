---
name: IncreasingPositivePairCount
domain: Permutation statistics
signature: IncreasingPositivePairCount(p)
summary: "Pairs i < j with 0 < p(i) < p(j): the occurrences of the signed pattern 12."
catalog:
  - system: findstat
    identity: St001772
    url: https://www.findstat.org/St001772
    on: SignedPermutation
statOn:
  - SignedPermutation
signatures:
  - call: IncreasingPositivePairCount(p)
    description: "Pairs i < j with 0 < p(i) < p(j): the occurrences of the signed pattern 12."
    library: enumeratio-combinatorics
    type: (signed_permutation) -> number
---

- Defined over `SignedPermutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `SignedPermutation` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001772. Both entries positive and increasing.
