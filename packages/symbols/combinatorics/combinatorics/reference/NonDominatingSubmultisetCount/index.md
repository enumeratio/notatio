---
name: NonDominatingSubmultisetCount
domain: Partition statistics
signature: NonDominatingSubmultisetCount(partition)
summary: The distinct sub-multisets of the parts that, read as partitions, do not dominate their own conjugate.
catalog:
  - system: findstat
    identity: St001714
    url: https://www.findstat.org/St001714
    on: IntegerPartition
statOn:
  - IntegerPartition
signatures:
  - call: NonDominatingSubmultisetCount(partition)
    description: The distinct sub-multisets of the parts that, read as partitions, do not dominate their own conjugate.
    library: enumeratio-combinatorics
    type: (integer_partition) -> number
---

- Defined over `IntegerPartition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `IntegerPartition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat calls the sub-multisets subpartitions. The partitions with none are the wide ones.
