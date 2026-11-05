---
name: MaximalDiagonalSum
domain: Tableau statistics
signature: MaximalDiagonalSum(tableau)
summary: The largest sum of the entries along a diagonal.
catalog:
  - system: findstat
    identity: St000888
    url: https://www.findstat.org/St000888
    on: AlternatingSignMatrix
statOn:
  - AlternatingSignMatrix
signatures:
  - call: MaximalDiagonalSum(tableau)
    description: The largest sum of the entries along a diagonal.
    library: enumeratio-combinatorics
    type: (alternating_sign_matrix) -> number
---

- Defined over `AlternatingSignMatrix` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `AlternatingSignMatrix` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- The diagonals are the cells (i, j) with i - j fixed. A sum is floored at 0, which no sum of a corner cell falls below, so the largest is unchanged.
