---
name: MissingBoxCount
domain: Skew partition statistics
signature: MissingBoxCount(shape)
summary: "The boxes of the outer partition that the shape leaves out: the size of the inner partition."
catalog:
  - system: findstat
    identity: St001438
    url: https://www.findstat.org/St001438
    on: SkewPartition
statOn:
  - SkewPartition
signatures:
  - call: MissingBoxCount(shape)
    description: "The boxes of the outer partition that the shape leaves out: the size of the inner partition."
    library: enumeratio-combinatorics
    type: (skew_partition) -> number
---

- Defined over `SkewPartition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `SkewPartition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001438. The empty shape gives 0.
