---
name: NonzeroEntryCount
domain: Alternating sign matrix statistics
signature: NonzeroEntryCount(matrix)
summary: "AlternatingSignMatrix: The number of nonzero entries. GelfandTsetlinPattern: The number of nonzero entries."
catalog:
  - system: findstat
    identity: St000890
    url: https://www.findstat.org/St000890
    on: AlternatingSignMatrix
  - system: findstat
    identity: St001406
    url: https://www.findstat.org/St001406
    on: GelfandTsetlinPattern
statOn:
  - AlternatingSignMatrix
  - GelfandTsetlinPattern
signatures:
  - call: NonzeroEntryCount(tableau)
    description: The number of nonzero entries.
    library: enumeratio-combinatorics
    type: (alternating_sign_matrix | gelfand_tsetlin_pattern) -> number
---

- Defined over `AlternatingSignMatrix` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `AlternatingSignMatrix` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000890.
- Defined over `GelfandTsetlinPattern` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `GelfandTsetlinPattern` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001406; the same head as on alternating sign matrices. The empty pattern gives 0.
