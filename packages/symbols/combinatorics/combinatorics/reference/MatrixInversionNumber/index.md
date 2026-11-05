---
name: MatrixInversionNumber
domain: Tableau statistics
signature: MatrixInversionNumber(tableau)
summary: The sum of a(i, j) a(k, l) over the pairs of entries with i > k and j < l.
catalog:
  - system: findstat
    identity: St000067
    url: https://www.findstat.org/St000067
    on: AlternatingSignMatrix
statOn:
  - AlternatingSignMatrix
signatures:
  - call: MatrixInversionNumber(tableau)
    description: The sum of a(i, j) a(k, l) over the pairs of entries with i > k and j < l.
    library: enumeratio-combinatorics
    type: (alternating_sign_matrix) -> number
---

- Defined over `AlternatingSignMatrix` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `AlternatingSignMatrix` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000067. On a permutation matrix it is the number of inversions.
