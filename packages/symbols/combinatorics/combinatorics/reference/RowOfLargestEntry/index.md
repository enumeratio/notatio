---
name: RowOfLargestEntry
domain: Tableau statistics
signature: RowOfLargestEntry(tableau)
summary: The row containing the largest entry.
catalog:
  - system: findstat
    identity: St000733
    url: https://www.findstat.org/St000733
    on: StandardTableau
statOn:
  - StandardTableau
signatures:
  - call: RowOfLargestEntry(tableau)
    description: The row containing the largest entry.
    library: enumeratio-combinatorics
    type: (standard_tableau) -> number
---

- Defined over `StandardTableau` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `StandardTableau` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- The empty tableau, which has no such entry, gives 0.
