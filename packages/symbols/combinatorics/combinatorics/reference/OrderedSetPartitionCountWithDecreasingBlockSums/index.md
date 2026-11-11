---
name: OrderedSetPartitionCountWithDecreasingBlockSums
domain: Partition statistics
signature: OrderedSetPartitionCountWithDecreasingBlockSums(partition)
summary: The ways to put the parts, told apart by position, into an ordered list of blocks whose sums weakly decrease.
catalog:
  - system: findstat
    identity: St000810
    url: https://www.findstat.org/St000810
    on: IntegerPartition
statOn:
  - IntegerPartition
---

- Defined over `IntegerPartition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `IntegerPartition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
