---
name: SignedNorthEastAlignmentCount
domain: Signed permutation statistics
signature: SignedNorthEastAlignmentCount(signedPermutation)
summary: Pairs (i, j) of 1 .. n with p(i) < i < j <= p(j).
catalog:
  - system: findstat
    identity: St001868
    url: https://www.findstat.org/St001868
    on: SignedPermutation
statOn:
  - SignedPermutation
signatures:
  - call: SignedNorthEastAlignmentCount(signedPermutation)
    description: Pairs (i, j) of 1 .. n with p(i) < i < j <= p(j).
    library: enumeratio-combinatorics
    type: (signed_permutation) -> number
---

- Defined over `SignedPermutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `SignedPermutation` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001868, the alignments of type NE.
