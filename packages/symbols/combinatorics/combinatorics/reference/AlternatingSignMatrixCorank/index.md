---
name: AlternatingSignMatrixCorank
domain: Alternating sign matrix statistics
signature: AlternatingSignMatrixCorank(matrix)
summary: The size minus the rank.
signatures:
  - call: AlternatingSignMatrixCorank(matrix)
    description: The size minus the rank.
    library: enumeratio-combinatorics
    type: (alternating_sign_matrix) -> number
catalog:
  - system: findstat
    identity: St001975
    url: https://www.findstat.org/St001975
    on: AlternatingSignMatrix
statOn:
  - AlternatingSignMatrix
---

- Defined over `AlternatingSignMatrix` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `AlternatingSignMatrix` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001975, the number of rows less the rank. The 0 by 0 matrix has corank 0.
