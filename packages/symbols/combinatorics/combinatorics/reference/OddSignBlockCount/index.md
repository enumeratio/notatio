---
name: OddSignBlockCount
domain: Signed permutation statistics
signature: OddSignBlockCount(signedPermutation)
summary: The blocks of the direct sum decomposition with an odd number of negative entries.
catalog:
  - system: findstat
    identity: St001895
    url: https://www.findstat.org/St001895
    on: SignedPermutation
statOn:
  - SignedPermutation
signatures:
  - call: OddSignBlockCount(signedPermutation)
    description: The blocks of the direct sum decomposition with an odd number of negative entries.
    library: enumeratio-combinatorics
    type: (signed_permutation) -> number
---

- Defined over `SignedPermutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `SignedPermutation` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001895. The blocks end at the cuts, the places i where the first i entries are 1 .. i up to sign.
