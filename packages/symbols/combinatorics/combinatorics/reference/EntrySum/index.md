---
name: EntrySum
domain: Semistandard tableau statistics
signature: EntrySum(tableau)
summary: "SemistandardTableau: The sum of the entries. GelfandTsetlinPattern: The sum of the entries."
catalog:
  - system: findstat
    identity: St000103
    url: https://www.findstat.org/St000103
    on: SemistandardTableau
  - system: findstat
    identity: St000114
    url: https://www.findstat.org/St000114
    on: GelfandTsetlinPattern
statOn:
  - GelfandTsetlinPattern
  - SemistandardTableau
signatures:
  - call: EntrySum(tableau)
    description: "SemistandardTableau: The sum of the entries. GelfandTsetlinPattern: The sum of the entries."
    library: enumeratio-combinatorics
    type: (gelfand_tsetlin_pattern | semistandard_tableau) -> number
---

- Defined over `SemistandardTableau` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `SemistandardTableau` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000103. The empty tableau gives 0.
- Defined over `GelfandTsetlinPattern` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `GelfandTsetlinPattern` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000114; the same head as on semistandard tableaux. The empty pattern gives 0.
