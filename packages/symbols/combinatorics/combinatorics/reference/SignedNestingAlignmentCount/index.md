---
name: SignedNestingAlignmentCount
domain: Signed permutation statistics
signature: SignedNestingAlignmentCount(signedPermutation)
summary: Pairs (i, j) of 1 .. n with -i < -j < -p(j) < -p(i), -i < j <= p(j) < -p(i), or i < j <= p(j) < p(i).
catalog:
  - system: findstat
    identity: St001866
    url: https://www.findstat.org/St001866
    on: SignedPermutation
statOn:
  - SignedPermutation
signatures:
  - call: SignedNestingAlignmentCount(signedPermutation)
    description: Pairs (i, j) of 1 .. n with -i < -j < -p(j) < -p(i), -i < j <= p(j) < -p(i), or i < j <= p(j) < p(i).
    library: enumeratio-combinatorics
    type: (signed_permutation) -> number
---

- Defined over `SignedPermutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `SignedPermutation` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001866.
