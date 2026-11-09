---
name: DominatingPartition
domain: Combinatorial maps
signature: DominatingPartition(SkewPartition)
summary: "The largest partition in dominance order in the Schur expansion of the skew Schur function: the conjugate of the column lengths, sorted."
catalog:
  - system: findstat
    identity: Mp00186
    url: https://www.findstat.org/Mp00186
    on: SkewPartition
mapOn:
  - SkewPartition
signatures:
  - call: DominatingPartition(SkewPartition)
    description: "The largest partition in dominance order in the Schur expansion of the skew Schur function: the conjugate of the column lengths, sorted."
    library: enumeratio-combinatorics
    type: (skew_partition) -> integer_partition
---

- Takes a `SkewPartition` and returns a `IntegerPartition` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- FindStat's Mp00186 (Lam, Postnikov and Pylyavskyy).
