---
name: BastidasHohlwegSaliolaExcedanceCount
domain: Signed permutation statistics
signature: BastidasHohlwegSaliolaExcedanceCount(signedPermutation)
summary: The entries p(i) > i, plus half the negative entries, rounded up.
catalog:
  - system: findstat
    identity: St001907
    url: https://www.findstat.org/St001907
    on: SignedPermutation
statOn:
  - SignedPermutation
signatures:
  - call: BastidasHohlwegSaliolaExcedanceCount(signedPermutation)
    description: The entries p(i) > i, plus half the negative entries, rounded up.
    library: enumeratio-combinatorics
    type: (signed_permutation) -> number
---

- Defined over `SignedPermutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `SignedPermutation` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001907, half the flag excedances rounded up: floor((2 exc + neg + 1) / 2).
