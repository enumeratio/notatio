---
name: NegativeSumPairCount
domain: Permutation statistics
signature: NegativeSumPairCount(p)
summary: Pairs i < j with p(i) + p(j) < 0.
catalog:
  - system: findstat
    identity: St001434
    url: https://www.findstat.org/St001434
    on: SignedPermutation
statOn:
  - SignedPermutation
signatures:
  - call: NegativeSumPairCount(p)
    description: Pairs i < j with p(i) + p(j) < 0.
    library: enumeratio-combinatorics
    type: (signed_permutation) -> number
---

- Defined over `SignedPermutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `SignedPermutation` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
