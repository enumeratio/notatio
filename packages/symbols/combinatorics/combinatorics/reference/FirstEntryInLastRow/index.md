---
name: FirstEntryInLastRow
domain: Tableau statistics
signature: FirstEntryInLastRow(tableau)
summary: "StandardTableau: The first entry in the last row. SemistandardTableau: The first entry in the last row."
catalog:
  - system: findstat
    identity: St000738
    url: https://www.findstat.org/St000738
    on: StandardTableau
  - system: findstat
    identity: St000739
    url: https://www.findstat.org/St000739
    on: SemistandardTableau
statOn:
  - SemistandardTableau
  - StandardTableau
signatures:
  - call: FirstEntryInLastRow(tableau)
    description: The first entry in the last row.
    library: enumeratio-combinatorics
    type: (semistandard_tableau | standard_tableau) -> number
---

- Defined over `StandardTableau` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `StandardTableau` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- The empty tableau, which has no such entry, gives 0.
- Defined over `SemistandardTableau` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `SemistandardTableau` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000739; the same head as on standard tableaux. The empty tableau gives 0.
