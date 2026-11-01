---
name: DominatedPartitionCount
domain: Partition statistics
signature: DominatedPartitionCount(partition)
summary: The partitions of the same size that this one dominates (partial sums of the parts at least those of the other), itself included.
catalog:
  - system: findstat
    identity: St000321
    url: https://www.findstat.org/St000321
    on: IntegerPartition
statOn:
  - IntegerPartition
signatures:
  - call: DominatedPartitionCount(partition)
    description: The partitions of the same size that this one dominates (partial sums of the parts at least those of the other), itself included.
    library: enumeratio-combinatorics
    type: (integer_partition) -> number
---

- Defined over `IntegerPartition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `IntegerPartition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
