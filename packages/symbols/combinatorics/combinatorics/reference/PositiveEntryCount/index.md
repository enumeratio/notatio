---
name: PositiveEntryCount
domain: Permutation statistics
signature: PositiveEntryCount(p)
summary: The number of positive entries.
catalog:
  - system: findstat
    identity: St001430
    url: https://www.findstat.org/St001430
    on: SignedPermutation
statOn:
  - SignedPermutation
signatures:
  - call: PositiveEntryCount(p)
    description: The number of positive entries.
    library: enumeratio-combinatorics
    type: (signed_permutation) -> number
---

- Defined over `SignedPermutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `SignedPermutation` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
