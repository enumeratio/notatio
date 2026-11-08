---
name: AlternatingSignMatrixRank
domain: Alternating sign matrix statistics
signature: AlternatingSignMatrixRank(matrix)
summary: The rank.
signatures:
  - call: AlternatingSignMatrixRank(matrix)
    description: The rank.
    library: enumeratio-combinatorics
    type: (alternating_sign_matrix) -> number
catalog:
  - system: findstat
    identity: St001974
    url: https://www.findstat.org/St001974
    on: AlternatingSignMatrix
statOn:
  - AlternatingSignMatrix
---

- Defined over `AlternatingSignMatrix` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `AlternatingSignMatrix` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001974. The 0 by 0 matrix has rank 0, the one value FindStat's Sage code does not reach.
