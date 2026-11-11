---
name: InvariantSetPartitionCount
domain: Partition statistics
signature: InvariantSetPartitionCount(partition)
summary: The set partitions of the points that a permutation of this cycle type maps to themselves.
catalog:
  - system: findstat
    identity: St000515
    url: https://www.findstat.org/St000515
    on: IntegerPartition
statOn:
  - IntegerPartition
signatures:
  - call: InvariantSetPartitionCount(partition)
    description: The set partitions of the points that a permutation of this cycle type maps to themselves.
    library: enumeratio-combinatorics
    type: (integer_partition) -> number
---

- Defined over `IntegerPartition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `IntegerPartition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
