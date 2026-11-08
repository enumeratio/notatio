---
name: SignedEastNorthAlignmentCount
domain: Signed permutation statistics
signature: SignedEastNorthAlignmentCount(signedPermutation)
summary: Pairs (i, j) of 1 .. n with -i < 0 < -p(i) < p(j) < j, or i <= p(i) < p(j) < j.
catalog:
  - system: findstat
    identity: St001867
    url: https://www.findstat.org/St001867
    on: SignedPermutation
statOn:
  - SignedPermutation
signatures:
  - call: SignedEastNorthAlignmentCount(signedPermutation)
    description: Pairs (i, j) of 1 .. n with -i < 0 < -p(i) < p(j) < j, or i <= p(i) < p(j) < j.
    library: enumeratio-combinatorics
    type: (signed_permutation) -> number
---

- Defined over `SignedPermutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `SignedPermutation` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001867, the alignments of type EN.
