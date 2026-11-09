---
name: OuterShape
domain: Combinatorial maps
signature: OuterShape(SkewPartition)
summary: The outer partition λ of the skew shape λ/μ.
catalog:
  - system: findstat
    identity: Mp00182
    url: https://www.findstat.org/Mp00182
    on: SkewPartition
mapOn:
  - SkewPartition
signatures:
  - call: OuterShape(SkewPartition)
    description: The outer partition λ of the skew shape λ/μ.
    library: enumeratio-combinatorics
    type: (skew_partition) -> integer_partition
---

- Takes a `SkewPartition` and returns a `IntegerPartition` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- FindStat's Mp00182.
