---
name: LastRowOnePosition
domain: Alternating sign matrix statistics
signature: LastRowOnePosition(matrix)
summary: The column of the unique 1 in the last row.
catalog:
  - system: findstat
    identity: St000199
    url: https://www.findstat.org/St000199
    on: AlternatingSignMatrix
statOn:
  - AlternatingSignMatrix
signatures:
  - call: LastRowOnePosition(tableau)
    description: The column of the unique 1 in the last row.
    library: enumeratio-combinatorics
    type: (alternating_sign_matrix) -> number
---

- Defined over `AlternatingSignMatrix` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `AlternatingSignMatrix` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
