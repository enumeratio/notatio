---
name: LastEntryInFirstRow
domain: Tableau statistics
signature: LastEntryInFirstRow(tableau)
summary: "StandardTableau: The last entry in the first row. SemistandardTableau: The last entry in the first row."
catalog:
  - system: findstat
    identity: St000734
    url: https://www.findstat.org/St000734
    on: StandardTableau
  - system: findstat
    identity: St000736
    url: https://www.findstat.org/St000736
    on: SemistandardTableau
statOn:
  - SemistandardTableau
  - StandardTableau
signatures:
  - call: LastEntryInFirstRow(tableau)
    description: The last entry in the first row.
    library: enumeratio-combinatorics
    type: (semistandard_tableau | standard_tableau) -> number
---

- Defined over `StandardTableau` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `StandardTableau` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- The empty tableau, which has no such entry, gives 0.
- Defined over `SemistandardTableau` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `SemistandardTableau` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000736; the same head as on standard tableaux. The empty tableau gives 0.
