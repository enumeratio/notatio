---
name: MonotoneTriangleMaximalLastDiagonalCount
domain: Alternating sign matrix statistics
signature: MonotoneTriangleMaximalLastDiagonalCount(matrix)
summary: The rows k of the monotone triangle whose smallest entry is the second smallest entry of the row below it, or one less than its own second smallest.
catalog:
  - system: findstat
    identity: St000898
    url: https://www.findstat.org/St000898
    on: AlternatingSignMatrix
statOn:
  - AlternatingSignMatrix
signatures:
  - call: MonotoneTriangleMaximalLastDiagonalCount(matrix)
    description: The rows k of the monotone triangle whose smallest entry is the second smallest entry of the row below it, or one less than its own second smallest.
    library: enumeratio-combinatorics
    type: (alternating_sign_matrix) -> number
---

- Defined over `AlternatingSignMatrix` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `AlternatingSignMatrix` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000898. Row k of the monotone triangle lists the columns holding a 1 in the column sums of the first k rows, the last diagonal being the smallest entry of each row; an entry is maximal when it equals the second smallest entry of the row below, or one less than the second smallest of its own row.
