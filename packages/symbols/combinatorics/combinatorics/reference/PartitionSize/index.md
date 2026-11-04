---
name: PartitionSize
domain: Partition statistics
signature: PartitionSize(partition)
summary: The sum of the parts.
catalog:
  - system: findstat
    identity: St000228
    url: https://www.findstat.org/St000228
    on: IntegerPartition
statOn:
  - IntegerPartition
signatures:
  - call: PartitionSize(partition)
    description: The sum of the parts.
    library: enumeratio-combinatorics
    type: (integer_partition) -> number
---

- Defined over `IntegerPartition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `IntegerPartition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
