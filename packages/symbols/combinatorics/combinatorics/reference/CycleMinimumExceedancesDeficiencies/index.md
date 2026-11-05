---
name: CycleMinimumExceedancesDeficiencies
domain: Permutation statistics
signature: CycleMinimumExceedancesDeficiencies(p)
summary: The sum over the cycles of the lesser of the number of exceedances and the number of the other points.
catalog:
  - system: findstat
    identity: St001269
    url: https://www.findstat.org/St001269
    on: Permutation
statOn:
  - Permutation
signatures:
  - call: CycleMinimumExceedancesDeficiencies(p)
    description: The sum over the cycles of the lesser of the number of exceedances and the number of the other points.
    library: enumeratio-combinatorics
    type: (permutation) -> number
---

- Defined over `Permutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Permutation` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
