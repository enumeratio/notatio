---
name: NaturalMajorIndex
domain: Tableau statistics
signature: NaturalMajorIndex(tableau)
summary: The sum of the natural descents, the entries whose successor is in a strictly higher row.
catalog:
  - system: findstat
    identity: St001696
    url: https://www.findstat.org/St001696
    on: StandardTableau
statOn:
  - StandardTableau
signatures:
  - call: NaturalMajorIndex(tableau)
    description: The sum of the natural descents, the entries whose successor is in a strictly higher row.
    library: enumeratio-combinatorics
    type: (standard_tableau) -> number
---

- Defined over `StandardTableau` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `StandardTableau` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
