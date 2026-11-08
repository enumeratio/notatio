---
name: SignedCrossingCount
domain: Signed permutation statistics
signature: SignedCrossingCount(signedPermutation)
summary: Pairs i < j with j <= p(i) < p(j), pairs with j <= -p(i) < p(j), and pairs j < i with j > p(i) > p(j).
catalog:
  - system: findstat
    identity: St001862
    url: https://www.findstat.org/St001862
    on: SignedPermutation
statOn:
  - SignedPermutation
signatures:
  - call: SignedCrossingCount(signedPermutation)
    description: Pairs i < j with j <= p(i) < p(j), pairs with j <= -p(i) < p(j), and pairs j < i with j > p(i) > p(j).
    library: enumeratio-combinatorics
    type: (signed_permutation) -> number
---

- Defined over `SignedPermutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `SignedPermutation` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001862, the crossings of the type B arc diagram. Not Crossings, which reads an unsigned permutation.
