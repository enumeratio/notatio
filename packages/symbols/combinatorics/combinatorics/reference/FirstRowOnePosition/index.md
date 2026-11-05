---
name: FirstRowOnePosition
domain: Tableau statistics
signature: FirstRowOnePosition(tableau)
summary: The column of the unique 1 in the first row.
catalog:
  - system: findstat
    identity: St000066
    url: https://www.findstat.org/St000066
    on: AlternatingSignMatrix
statOn:
  - AlternatingSignMatrix
signatures:
  - call: FirstRowOnePosition(tableau)
    description: The column of the unique 1 in the first row.
    library: enumeratio-combinatorics
    type: (alternating_sign_matrix) -> number
---

- Defined over `AlternatingSignMatrix` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `AlternatingSignMatrix` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
