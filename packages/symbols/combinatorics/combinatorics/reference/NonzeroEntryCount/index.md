---
name: NonzeroEntryCount
domain: Tableau statistics
signature: NonzeroEntryCount(tableau)
summary: The number of nonzero entries.
catalog:
  - system: findstat
    identity: St000890
    url: https://www.findstat.org/St000890
    on: AlternatingSignMatrix
statOn:
  - AlternatingSignMatrix
signatures:
  - call: NonzeroEntryCount(tableau)
    description: The number of nonzero entries.
    library: enumeratio-combinatorics
    type: (alternating_sign_matrix) -> number
---

- Defined over `AlternatingSignMatrix` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `AlternatingSignMatrix` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000890.
