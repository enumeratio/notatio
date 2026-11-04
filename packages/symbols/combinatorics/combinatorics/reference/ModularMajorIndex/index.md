---
name: ModularMajorIndex
domain: Tableau statistics
signature: ModularMajorIndex(tableau)
summary: The major index modulo the number of entries.
catalog:
  - system: findstat
    identity: St000693
    url: https://www.findstat.org/St000693
    on: StandardTableau
statOn:
  - StandardTableau
signatures:
  - call: ModularMajorIndex(tableau)
    description: The major index modulo the number of entries.
    library: enumeratio-combinatorics
    type: (standard_tableau) -> number
---

- Defined over `StandardTableau` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `StandardTableau` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- The major index is the sum of the descents, the entries whose successor is in a strictly lower row. A tableau of fewer than two entries gives 0.
