---
name: DecreasableCornerSumPositions
domain: Alternating sign matrix statistics
signature: DecreasableCornerSumPositions(matrix)
summary: The interior positions of the corner sum matrix whose entry can be lowered by one to give another alternating sign matrix's corner sum matrix.
signatures:
  - call: DecreasableCornerSumPositions(tableau)
    description: The interior positions of the corner sum matrix whose entry can be lowered by one to give another alternating sign matrix's corner sum matrix.
    library: enumeratio-combinatorics
    type: (alternating_sign_matrix) -> number
catalog:
  - system: findstat
    identity: St001965
    url: https://www.findstat.org/St001965
    on: AlternatingSignMatrix
statOn:
  - AlternatingSignMatrix
---

- Defined over `AlternatingSignMatrix` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `AlternatingSignMatrix` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001965. The corner sum c(i, j) is the sum of the entries in the first i rows and j columns; a position 0 < i, j < n qualifies when c(i, j) = c(i + 1, j) = c(i, j + 1) = c(i - 1, j) + 1 = c(i, j - 1) + 1.
