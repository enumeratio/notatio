---
name: ZerosOnMainDiagonal
domain: Alternating sign matrix statistics
signature: ZerosOnMainDiagonal(matrix)
summary: The number of 0s on the main diagonal.
catalog:
  - system: findstat
    identity: St000896
    url: https://www.findstat.org/St000896
    on: AlternatingSignMatrix
statOn:
  - AlternatingSignMatrix
signatures:
  - call: ZerosOnMainDiagonal(tableau)
    description: The number of 0s on the main diagonal.
    library: enumeratio-combinatorics
    type: (alternating_sign_matrix) -> number
---

- Defined over `AlternatingSignMatrix` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `AlternatingSignMatrix` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
