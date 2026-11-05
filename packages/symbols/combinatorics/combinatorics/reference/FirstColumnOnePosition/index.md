---
name: FirstColumnOnePosition
domain: Tableau statistics
signature: FirstColumnOnePosition(tableau)
summary: The row of the unique 1 in the first column.
catalog:
  - system: findstat
    identity: St000193
    url: https://www.findstat.org/St000193
    on: AlternatingSignMatrix
statOn:
  - AlternatingSignMatrix
signatures:
  - call: FirstColumnOnePosition(tableau)
    description: The row of the unique 1 in the first column.
    library: enumeratio-combinatorics
    type: (alternating_sign_matrix) -> number
---

- Defined over `AlternatingSignMatrix` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `AlternatingSignMatrix` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
