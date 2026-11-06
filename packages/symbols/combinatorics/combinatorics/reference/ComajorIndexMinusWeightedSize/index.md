---
name: ComajorIndexMinusWeightedSize
domain: Tableau statistics
signature: ComajorIndexMinusWeightedSize(tableau)
summary: The sum of n - e over the descents e of the tableau, less the weighted size of its shape.
signatures:
  - call: ComajorIndexMinusWeightedSize(tableau)
    description: The sum of n - e over the descents e of the tableau, less the weighted size of its shape.
    library: enumeratio-combinatorics
    type: (standard_tableau) -> number
catalog:
  - system: findstat
    identity: St001698
    url: https://www.findstat.org/St001698
    on: StandardTableau
statOn:
  - StandardTableau
---

- Defined over `StandardTableau` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `StandardTableau` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001698. A descent is an entry whose successor is in a strictly lower row. A tableau of fewer than two entries has neither.
