---
name: TopLeftZeroSquareSize
domain: Tableau statistics
signature: TopLeftZeroSquareSize(tableau)
summary: The side of the largest square of zeros at the top left corner.
catalog:
  - system: findstat
    identity: St001981
    url: https://www.findstat.org/St001981
    on: AlternatingSignMatrix
statOn:
  - AlternatingSignMatrix
signatures:
  - call: TopLeftZeroSquareSize(tableau)
    description: The side of the largest square of zeros at the top left corner.
    library: enumeratio-combinatorics
    type: (alternating_sign_matrix) -> number
---

- Defined over `AlternatingSignMatrix` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `AlternatingSignMatrix` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001981. The square of side z is all zeros exactly when z is below the largest of the row and column of every nonzero entry, so the side is the least such largest, less 1; an alternating sign matrix has a nonzero entry.
