---
name: FlagMajorIndex
domain: Signed permutation statistics
signature: FlagMajorIndex(signedPermutation)
summary: The number of negative entries plus twice the sum of the descents, a negative first entry counting as a descent at 0.
catalog:
  - system: findstat
    identity: St001433
    url: https://www.findstat.org/St001433
    on: SignedPermutation
statOn:
  - SignedPermutation
signatures:
  - call: FlagMajorIndex(p)
    description: The number of negative entries plus twice the sum of the descents, a negative first entry counting as a descent at 0.
    library: enumeratio-combinatorics
    type: (signed_permutation) -> number
---

- Defined over `SignedPermutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `SignedPermutation` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- The descent at 0 adds 0 to the sum, so only the descents between entries weigh.
