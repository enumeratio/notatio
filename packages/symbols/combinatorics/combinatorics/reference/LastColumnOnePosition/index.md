---
name: LastColumnOnePosition
domain: Tableau statistics
signature: LastColumnOnePosition(tableau)
summary: The row of the unique 1 in the last column.
catalog:
  - system: findstat
    identity: St000200
    url: https://www.findstat.org/St000200
    on: AlternatingSignMatrix
statOn:
  - AlternatingSignMatrix
signatures:
  - call: LastColumnOnePosition(tableau)
    description: The row of the unique 1 in the last column.
    library: enumeratio-combinatorics
    type: (alternating_sign_matrix) -> number
---

- Defined over `AlternatingSignMatrix` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `AlternatingSignMatrix` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
