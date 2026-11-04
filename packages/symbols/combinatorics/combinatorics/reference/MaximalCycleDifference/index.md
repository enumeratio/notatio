---
name: MaximalCycleDifference
domain: Permutation statistics
signature: MaximalCycleDifference(p)
summary: The largest difference between two elements of one cycle.
catalog:
  - system: findstat
    identity: St000209
    url: https://www.findstat.org/St000209
    on: Permutation
statOn:
  - Permutation
signatures:
  - call: MaximalCycleDifference(p)
    description: The largest difference between two elements of one cycle.
    library: enumeratio-combinatorics
    type: (permutation) -> number
---

- Defined over `Permutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Permutation` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
