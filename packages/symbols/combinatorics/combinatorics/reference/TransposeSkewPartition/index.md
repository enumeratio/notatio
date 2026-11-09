---
name: TransposeSkewPartition
domain: Combinatorial maps
signature: TransposeSkewPartition(SkewPartition)
summary: "The conjugate skew shape: rows become columns."
catalog:
  - system: findstat
    identity: Mp00187
    url: https://www.findstat.org/Mp00187
    on: SkewPartition
mapOn:
  - SkewPartition
signatures:
  - call: TransposeSkewPartition(SkewPartition)
    description: "The conjugate skew shape: rows become columns."
    library: enumeratio-combinatorics
    type: (skew_partition) -> skew_partition
---

- Takes a `SkewPartition` and returns a `SkewPartition` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- FindStat's Mp00187, an involution: λ/μ becomes λ'/μ'.
