---
name: TypeBPatternTwoThreeOneCount
domain: Signed permutation statistics
signature: TypeBPatternTwoThreeOneCount(signedPermutation)
summary: Triples -n <= i < j < k <= n, with 1 <= j, with p(j) > p(i) and p(i) one more than p(k), or 1 when p(k) = -1.
catalog:
  - system: findstat
    identity: St001882
    url: https://www.findstat.org/St001882
    on: SignedPermutation
statOn:
  - SignedPermutation
signatures:
  - call: TypeBPatternTwoThreeOneCount(signedPermutation)
    description: Triples -n <= i < j < k <= n, with 1 <= j, with p(j) > p(i) and p(i) one more than p(k), or 1 when p(k) = -1.
    library: enumeratio-combinatorics
    type: (signed_permutation) -> number
---

- Defined over `SignedPermutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `SignedPermutation` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001882. The last two points of the triple are positive.
