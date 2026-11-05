---
name: HalfPermanentOfIdentityPlusPermutation
domain: Permutation statistics
signature: HalfPermanentOfIdentityPlusPermutation(p)
summary: Half the permanent of the identity matrix plus the permutation matrix, which is 2 to the power of the cycles less one.
catalog:
  - system: findstat
    identity: St001661
    url: https://www.findstat.org/St001661
    on: Permutation
statOn:
  - Permutation
signatures:
  - call: HalfPermanentOfIdentityPlusPermutation(p)
    description: Half the permanent of the identity matrix plus the permutation matrix, which is 2 to the power of the cycles less one.
    library: enumeratio-combinatorics
    type: (permutation) -> number
---

- Defined over `Permutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Permutation` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
