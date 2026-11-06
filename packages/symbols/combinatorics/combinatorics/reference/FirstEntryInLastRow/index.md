---
name: FirstEntryInLastRow
domain: Tableau statistics
signature: FirstEntryInLastRow(tableau)
summary: The first entry in the last row.
catalog:
  - system: findstat
    identity: St000738
    url: https://www.findstat.org/St000738
    on: StandardTableau
statOn:
  - StandardTableau
signatures:
  - call: FirstEntryInLastRow(tableau)
    description: The first entry in the last row.
    library: enumeratio-combinatorics
    type: (standard_tableau) -> number
---

- Defined over `StandardTableau` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `StandardTableau` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- The empty tableau, which has no such entry, gives 0.
