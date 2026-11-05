---
name: PermutationGenus
domain: Permutation statistics
signature: PermutationGenus(p)
summary: The genus g with n + 1 - 2g the cycles of p plus the cycles of p^-1 composed with the long cycle.
catalog:
  - system: findstat
    identity: St001394
    url: https://www.findstat.org/St001394
    on: Permutation
statOn:
  - Permutation
signatures:
  - call: PermutationGenus(p)
    description: The genus g with n + 1 - 2g the cycles of p plus the cycles of p^-1 composed with the long cycle.
    library: enumeratio-combinatorics
    type: (permutation) -> number
---

- Defined over `Permutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Permutation` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
