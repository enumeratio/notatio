---
name: NaturalDescentCount
domain: Tableau statistics
signature: NaturalDescentCount(tableau)
summary: Entries whose successor is in a strictly higher row.
catalog:
  - system: findstat
    identity: St001712
    url: https://www.findstat.org/St001712
    on: StandardTableau
statOn:
  - StandardTableau
signatures:
  - call: NaturalDescentCount(tableau)
    description: Entries whose successor is in a strictly higher row.
    library: enumeratio-combinatorics
    type: (standard_tableau) -> number
---

- Defined over `StandardTableau` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `StandardTableau` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- The opposite of a descent of the tableau (FindStat's St000157), where the successor is in a lower row. An entry whose successor is in its own row is neither.
