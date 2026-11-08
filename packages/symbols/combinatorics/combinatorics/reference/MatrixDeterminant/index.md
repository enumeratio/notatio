---
name: MatrixDeterminant
domain: Alternating sign matrix statistics
signature: MatrixDeterminant(matrix)
summary: The determinant.
catalog:
  - system: findstat
    identity: St000187
    url: https://www.findstat.org/St000187
    on: AlternatingSignMatrix
statOn:
  - AlternatingSignMatrix
signatures:
  - call: MatrixDeterminant(matrix)
    description: The determinant.
    library: enumeratio-combinatorics
    type: (alternating_sign_matrix) -> number
---

- Defined over `AlternatingSignMatrix` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `AlternatingSignMatrix` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000187. The 0 by 0 matrix has determinant 1.
