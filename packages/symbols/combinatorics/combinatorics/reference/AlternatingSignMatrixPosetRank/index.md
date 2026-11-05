---
name: AlternatingSignMatrixPosetRank
domain: Tableau statistics
signature: AlternatingSignMatrixPosetRank(tableau)
summary: "Half the sum of (i - j)^2 a(i, j): the rank in the alternating sign matrix poset."
catalog:
  - system: findstat
    identity: St000076
    url: https://www.findstat.org/St000076
    on: AlternatingSignMatrix
statOn:
  - AlternatingSignMatrix
signatures:
  - call: AlternatingSignMatrixPosetRank(tableau)
    description: "Half the sum of (i - j)^2 a(i, j): the rank in the alternating sign matrix poset."
    library: enumeratio-combinatorics
    type: (alternating_sign_matrix) -> number
---

- Defined over `AlternatingSignMatrix` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `AlternatingSignMatrix` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000076, which gives this formula for the rank (the sum of the monotone triangle's entries less n + 2 choose 3). The sum is never negative.
