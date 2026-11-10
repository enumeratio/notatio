---
name: HalfFullyPackedLoopHorizontalEdgeCount
domain: Alternating sign matrix statistics
signature: HalfFullyPackedLoopHorizontalEdgeCount(matrix)
summary: Half the cells whose vertical edge is occupied where row + column is even and empty where it is odd, less half the order rounded down.
catalog:
  - system: findstat
    identity: St001030
    url: https://www.findstat.org/St001030
    on: AlternatingSignMatrix
statOn:
  - AlternatingSignMatrix
signatures:
  - call: HalfFullyPackedLoopHorizontalEdgeCount(matrix)
    description: Half the cells whose vertical edge is occupied where row + column is even and empty where it is odd, less half the order rounded down.
    library: enumeratio-combinatorics
    type: (alternating_sign_matrix) -> number
---

- Defined over `AlternatingSignMatrix` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `AlternatingSignMatrix` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001030, half the non-boundary horizontal edges of the fully packed loop, which Sage reads off a six-vertex model coded 0 to 5. The edge above a cell is occupied when the column sum above it is 1; this count, over the cells, of the occupied edges where row + column is even and the empty ones where it is odd gives all 1200 of its rows (matrices up to order 6). The empty matrix gives 0.
