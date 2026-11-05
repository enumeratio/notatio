---
name: DistinctDiagonalSumCount
domain: Tableau statistics
signature: DistinctDiagonalSumCount(tableau)
summary: The number of distinct sums of the entries along a diagonal.
catalog:
  - system: findstat
    identity: St000893
    url: https://www.findstat.org/St000893
    on: AlternatingSignMatrix
statOn:
  - AlternatingSignMatrix
signatures:
  - call: DistinctDiagonalSumCount(tableau)
    description: The number of distinct sums of the entries along a diagonal.
    library: enumeratio-combinatorics
    type: (alternating_sign_matrix) -> number
---

- Defined over `AlternatingSignMatrix` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `AlternatingSignMatrix` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000893. A middle diagonal can sum below 0, so each sum is raised by the side before it is floored; raising every sum alike leaves the number of distinct ones.
