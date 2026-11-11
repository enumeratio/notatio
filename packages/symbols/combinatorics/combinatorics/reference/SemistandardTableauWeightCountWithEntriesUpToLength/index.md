---
name: SemistandardTableauWeightCountWithEntriesUpToLength
domain: Partition statistics
signature: SemistandardTableauWeightCountWithEntriesUpToLength(partition)
summary: "The distinct weights of the semistandard tableaux of the shape with entries at most the number of parts: the arrangements of the partitions of the size, at most that many parts, that the shape dominates."
catalog:
  - system: findstat
    identity: St001908
    url: https://www.findstat.org/St001908
    on: IntegerPartition
statOn:
  - IntegerPartition
---

- Defined over `IntegerPartition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `IntegerPartition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
