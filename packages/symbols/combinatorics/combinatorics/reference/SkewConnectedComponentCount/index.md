---
name: SkewConnectedComponentCount
domain: Skew partition statistics
signature: SkewConnectedComponentCount(shape)
summary: "The connected components of the shape: rows that start a component, the first row and every row that shares no column with the row above."
catalog:
  - system: findstat
    identity: St001490
    url: https://www.findstat.org/St001490
    on: SkewPartition
statOn:
  - SkewPartition
signatures:
  - call: SkewConnectedComponentCount(shape)
    description: "The connected components of the shape: rows that start a component, the first row and every row that shares no column with the row above."
    library: enumeratio-combinatorics
    type: (skew_partition) -> number
---

- Defined over `SkewPartition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `SkewPartition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001490, the components of the cell poset. Row i meets the row above in a column exactly when λᵢ exceeds μᵢ₋₁. The empty shape gives 0.
