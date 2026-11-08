---
name: RowReducedEntrySum
domain: Semistandard tableau statistics
signature: RowReducedEntrySum(tableau)
summary: The sum of each entry less the number of its row.
catalog:
  - system: findstat
    identity: St000112
    url: https://www.findstat.org/St000112
    on: SemistandardTableau
statOn:
  - SemistandardTableau
signatures:
  - call: RowReducedEntrySum(tableau)
    description: The sum of each entry less the number of its row.
    library: enumeratio-combinatorics
    type: (semistandard_tableau) -> number
---

- Defined over `SemistandardTableau` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `SemistandardTableau` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000112, the depth of the tableau in the crystal of its shape. An entry is at least the number of its row, so no term is negative. The empty tableau gives 0.
