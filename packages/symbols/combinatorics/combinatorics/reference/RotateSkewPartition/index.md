---
name: RotateSkewPartition
domain: Combinatorial maps
signature: RotateSkewPartition(SkewPartition)
summary: "The shape turned half way around: the rotation of the diagram by 180 degrees."
catalog:
  - system: findstat
    identity: Mp00189
    url: https://www.findstat.org/Mp00189
    on: SkewPartition
mapOn:
  - SkewPartition
signatures:
  - call: RotateSkewPartition(SkewPartition)
    description: "The shape turned half way around: the rotation of the diagram by 180 degrees."
    library: enumeratio-combinatorics
    type: (skew_partition) -> skew_partition
---

- Takes a `SkewPartition` and returns a `SkewPartition` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- FindStat's Mp00189, an involution.
