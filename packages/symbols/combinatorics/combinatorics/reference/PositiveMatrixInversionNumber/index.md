---
name: PositiveMatrixInversionNumber
domain: Alternating sign matrix statistics
signature: PositiveMatrixInversionNumber(matrix)
summary: The inversion number less the number of entries equal to -1.
catalog:
  - system: findstat
    identity: St000332
    url: https://www.findstat.org/St000332
    on: AlternatingSignMatrix
statOn:
  - AlternatingSignMatrix
signatures:
  - call: PositiveMatrixInversionNumber(tableau)
    description: The inversion number less the number of entries equal to -1.
    library: enumeratio-combinatorics
    type: (alternating_sign_matrix) -> number
---

- Defined over `AlternatingSignMatrix` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `AlternatingSignMatrix` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000332.
