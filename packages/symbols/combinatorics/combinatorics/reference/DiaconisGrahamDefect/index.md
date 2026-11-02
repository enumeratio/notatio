---
name: DiaconisGrahamDefect
domain: Permutation statistics
signature: DiaconisGrahamDefect(p)
summary: Half of the total displacement less the number of inversions and the reflection length.
catalog:
  - system: findstat
    identity: St001906
    url: https://www.findstat.org/St001906
    on: Permutation
statOn:
  - Permutation
signatures:
  - call: DiaconisGrahamDefect(p)
    description: Half of the total displacement less the number of inversions and the reflection length.
    library: enumeratio-combinatorics
    type: (permutation) -> number
---

- Defined over `Permutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Permutation` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
