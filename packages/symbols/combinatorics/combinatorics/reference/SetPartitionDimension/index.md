---
name: SetPartitionDimension
domain: Set partition statistics
signature: SetPartitionDimension(partition)
summary: The sum of the lengths of the arcs, taking for each block its largest element minus its smallest.
catalog:
  - system: findstat
    identity: St000728
    url: https://www.findstat.org/St000728
    on: SetPartition
statOn:
  - SetPartition
signatures:
  - call: SetPartitionDimension(partition)
    description: The sum of the lengths of the arcs, taking for each block its largest element minus its smallest.
    library: enumeratio-combinatorics
    type: (set_partition) -> number
---

- Defined over `SetPartition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `SetPartition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000728; the arcs join consecutive elements of a block, so the lengths add up to the block's span.
