---
name: MaximalDiagonalNonzeroCount
domain: Alternating sign matrix statistics
signature: MaximalDiagonalNonzeroCount(matrix)
summary: The largest number of nonzero entries along a diagonal.
catalog:
  - system: findstat
    identity: St000892
    url: https://www.findstat.org/St000892
    on: AlternatingSignMatrix
statOn:
  - AlternatingSignMatrix
signatures:
  - call: MaximalDiagonalNonzeroCount(tableau)
    description: The largest number of nonzero entries along a diagonal.
    library: enumeratio-combinatorics
    type: (alternating_sign_matrix) -> number
---

- Defined over `AlternatingSignMatrix` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `AlternatingSignMatrix` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000892. The diagonals are those of MaximalDiagonalSum.
