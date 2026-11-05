---
name: SimsunDoubleDescents
domain: Permutation statistics
signature: SimsunDoubleDescents(p)
summary: Double descents in the restrictions of p to the values 1..k, over all k, counted with multiplicity.
catalog:
  - system: findstat
    identity: St000367
    url: https://www.findstat.org/St000367
    on: Permutation
statOn:
  - Permutation
signatures:
  - call: SimsunDoubleDescents(p)
    description: Double descents in the restrictions of p to the values 1..k, over all k, counted with multiplicity.
    library: enumeratio-combinatorics
    type: (permutation) -> number
---

- Defined over `Permutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Permutation` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
