---
name: MinimalRowZeroCount
domain: Alternating sign matrix statistics
signature: MinimalRowZeroCount(matrix)
summary: The fewest zeros in a row.
catalog:
  - system: findstat
    identity: St001925
    url: https://www.findstat.org/St001925
    on: AlternatingSignMatrix
statOn:
  - AlternatingSignMatrix
signatures:
  - call: MinimalRowZeroCount(tableau)
    description: The fewest zeros in a row.
    library: enumeratio-combinatorics
    type: (alternating_sign_matrix) -> number
---

- Defined over `AlternatingSignMatrix` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `AlternatingSignMatrix` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001925.
