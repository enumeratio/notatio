---
name: CornerSumLatticeDegree
domain: Alternating sign matrix statistics
signature: CornerSumLatticeDegree(matrix)
summary: The positions of the corner sum matrix whose entry can be lowered or raised by one to give another alternating sign matrix's corner sum matrix.
catalog:
  - system: findstat
    identity: St001977
    url: https://www.findstat.org/St001977
    on: AlternatingSignMatrix
statOn:
  - AlternatingSignMatrix
signatures:
  - call: CornerSumLatticeDegree(matrix)
    description: The positions of the corner sum matrix whose entry can be lowered or raised by one to give another alternating sign matrix's corner sum matrix.
    library: enumeratio-combinatorics
    type: (alternating_sign_matrix) -> number
---

- Defined over `AlternatingSignMatrix` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `AlternatingSignMatrix` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001977, the degree in the Hasse diagram of the corner sum lattice: the positions of DecreasableCornerSumPositions and those where the entry can instead rise.
