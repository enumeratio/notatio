---
name: FixedPointMajorIndex
domain: Permutation statistics
signature: FixedPointMajorIndex(p)
summary: The sum of the fixed points less the triangular number of their count, plus the major index of the word without its fixed points.
catalog:
  - system: findstat
    identity: St000339
    url: https://www.findstat.org/St000339
    on: Permutation
statOn:
  - Permutation
signatures:
  - call: FixedPointMajorIndex(p)
    description: The sum of the fixed points less the triangular number of their count, plus the major index of the word without its fixed points.
    library: enumeratio-combinatorics
    type: (permutation) -> number
---

- Defined over `Permutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Permutation` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- Called maf.
