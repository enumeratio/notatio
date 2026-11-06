---
name: SkewCornerCount
domain: Skew partition statistics
signature: SkewCornerCount(shape)
summary: The cells that are an inner corner or an outer corner of the shape, counted once when both.
catalog:
  - system: findstat
    identity: St001488
    url: https://www.findstat.org/St001488
    on: SkewPartition
statOn:
  - SkewPartition
signatures:
  - call: SkewCornerCount(shape)
    description: The cells that are an inner corner or an outer corner of the shape, counted once when both.
    library: enumeratio-combinatorics
    type: (skew_partition) -> number
---

- Defined over `SkewPartition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `SkewPartition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001488, the removable cells of the skew partition: the union of its inner and outer corners. A row holding one cell can have the same cell as both. The empty shape gives 0.
