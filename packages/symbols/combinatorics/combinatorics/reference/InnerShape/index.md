---
name: InnerShape
domain: Combinatorial maps
signature: InnerShape(SkewPartition)
summary: The inner partition μ of the skew shape λ/μ.
catalog:
  - system: findstat
    identity: Mp00183
    url: https://www.findstat.org/Mp00183
    on: SkewPartition
mapOn:
  - SkewPartition
signatures:
  - call: InnerShape(SkewPartition)
    description: The inner partition μ of the skew shape λ/μ.
    library: enumeratio-combinatorics
    type: (skew_partition) -> integer_partition
---

- Takes a `SkewPartition` and returns a `IntegerPartition` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- FindStat's Mp00183.
