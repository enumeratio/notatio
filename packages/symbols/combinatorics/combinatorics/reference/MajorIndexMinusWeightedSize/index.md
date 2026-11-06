---
name: MajorIndexMinusWeightedSize
domain: Tableau statistics
signature: MajorIndexMinusWeightedSize(tableau)
summary: The major index of the tableau less the weighted size of its shape.
signatures:
  - call: MajorIndexMinusWeightedSize(tableau)
    description: The major index of the tableau less the weighted size of its shape.
    library: enumeratio-combinatorics
    type: (standard_tableau) -> number
catalog:
  - system: findstat
    identity: St001699
    url: https://www.findstat.org/St001699
    on: StandardTableau
statOn:
  - StandardTableau
---

- Defined over `StandardTableau` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `StandardTableau` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001699. The major index is the sum of the descents, the entries whose successor is in a strictly lower row; the weighted size is the sum over the rows of the row's number counted from 0 times its length. A tableau of fewer than two entries has neither.
