---
name: DistinctEntryCount
domain: Semistandard tableau statistics
signature: DistinctEntryCount(tableau)
summary: "SemistandardTableau: The number of distinct entries. GelfandTsetlinPattern: The number of distinct entries."
catalog:
  - system: findstat
    identity: St001401
    url: https://www.findstat.org/St001401
    on: SemistandardTableau
  - system: findstat
    identity: St001404
    url: https://www.findstat.org/St001404
    on: GelfandTsetlinPattern
statOn:
  - GelfandTsetlinPattern
  - SemistandardTableau
signatures:
  - call: DistinctEntryCount(tableau)
    description: "SemistandardTableau: The number of distinct entries. GelfandTsetlinPattern: The number of distinct entries."
    library: enumeratio-combinatorics
    type: (gelfand_tsetlin_pattern | semistandard_tableau) -> number
---

- Defined over `SemistandardTableau` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `SemistandardTableau` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001401. The empty tableau gives 0.
- Defined over `GelfandTsetlinPattern` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `GelfandTsetlinPattern` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001404; the same head as on semistandard tableaux. The empty pattern gives 0.
