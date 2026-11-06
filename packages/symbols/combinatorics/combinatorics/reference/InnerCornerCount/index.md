---
name: InnerCornerCount
domain: Skew partition statistics
signature: InnerCornerCount(shape)
summary: The cells that can be added to the inner partition, within the rows of the shape.
catalog:
  - system: findstat
    identity: St001487
    url: https://www.findstat.org/St001487
    on: SkewPartition
statOn:
  - SkewPartition
signatures:
  - call: InnerCornerCount(shape)
    description: The cells that can be added to the inner partition, within the rows of the shape.
    library: enumeratio-combinatorics
    type: (skew_partition) -> number
---

- Defined over `SkewPartition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `SkewPartition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001487, the outside corners of the inner partition; a reduced shape has no row past the last of the outer partition. The empty shape gives 0.
