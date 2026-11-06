---
name: MainDiagonalSum
domain: Alternating sign matrix statistics
signature: MainDiagonalSum(matrix)
summary: The sum of the entries on the main diagonal, its trace.
catalog:
  - system: findstat
    identity: St000894
    url: https://www.findstat.org/St000894
    on: AlternatingSignMatrix
statOn:
  - AlternatingSignMatrix
signatures:
  - call: MainDiagonalSum(tableau)
    description: The sum of the entries on the main diagonal, its trace.
    library: enumeratio-combinatorics
    type: (alternating_sign_matrix) -> number
---

- Defined over `AlternatingSignMatrix` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `AlternatingSignMatrix` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000894. The entries are -1, 0 and 1, so the trace is the number of 1s on the diagonal less the number of -1s.
