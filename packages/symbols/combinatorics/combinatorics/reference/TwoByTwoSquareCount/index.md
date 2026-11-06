---
name: TwoByTwoSquareCount
domain: Skew partition statistics
signature: TwoByTwoSquareCount(shape)
summary: The cells of the shape whose neighbors to the right, below and below to the right are also in it.
catalog:
  - system: findstat
    identity: St001596
    url: https://www.findstat.org/St001596
    on: SkewPartition
statOn:
  - SkewPartition
signatures:
  - call: TwoByTwoSquareCount(shape)
    description: The cells of the shape whose neighbors to the right, below and below to the right are also in it.
    library: enumeratio-combinatorics
    type: (skew_partition) -> number
---

- Defined over `SkewPartition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `SkewPartition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001596. A cell (i, j) with the cell (i + 1, j + 1) also in the shape is the top left of a square, so row i counts the columns from μᵢ to λᵢ₊₁ - 2. The empty shape gives 0.
