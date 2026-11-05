---
name: Cocharge
domain: Tableau statistics
signature: Cocharge(tableau)
summary: "The cocharge of the reading word: the sum of n - e over the entries e whose successor is in a lower row."
catalog:
  - system: findstat
    identity: St000169
    url: https://www.findstat.org/St000169
    on: StandardTableau
statOn:
  - StandardTableau
signatures:
  - call: Cocharge(tableau)
    description: "The cocharge of the reading word: the sum of n - e over the entries e whose successor is in a lower row."
    library: enumeratio-combinatorics
    type: (standard_tableau) -> number
---

- Defined over `StandardTableau` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `StandardTableau` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- The charge and the cocharge add to n(n - 1) / 2.
