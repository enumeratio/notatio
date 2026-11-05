---
name: NaturalComajorIndex
domain: Tableau statistics
signature: NaturalComajorIndex(tableau)
summary: The sum of n - e over the natural descents e, the entries whose successor is in a strictly higher row.
catalog:
  - system: findstat
    identity: St001695
    url: https://www.findstat.org/St001695
    on: StandardTableau
statOn:
  - StandardTableau
signatures:
  - call: NaturalComajorIndex(tableau)
    description: The sum of n - e over the natural descents e, the entries whose successor is in a strictly higher row.
    library: enumeratio-combinatorics
    type: (standard_tableau) -> number
---

- Defined over `StandardTableau` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `StandardTableau` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
