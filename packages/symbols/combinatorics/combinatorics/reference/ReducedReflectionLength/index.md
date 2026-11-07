---
name: ReducedReflectionLength
domain: Permutation statistics
signature: ReducedReflectionLength(p)
summary: The total displacement less the inversions.
catalog:
  - system: findstat
    identity: St000809
    url: https://www.findstat.org/St000809
    on: Permutation
statOn:
  - Permutation
signatures:
  - call: ReducedReflectionLength(p)
    description: The total displacement less the inversions.
    library: enumeratio-combinatorics
    type: (permutation) -> number
---

- Defined over `Permutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Permutation` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- Twice the depth less the length.
