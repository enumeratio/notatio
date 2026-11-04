---
name: RefinementCount
domain: Partition statistics
signature: RefinementCount(partition)
summary: The partitions that refine this one, whose parts subdivide to give theirs. Itself included.
catalog:
  - system: findstat
    identity: St000345
    url: https://www.findstat.org/St000345
    on: IntegerPartition
statOn:
  - IntegerPartition
signatures:
  - call: RefinementCount(partition)
    description: The partitions that refine this one, whose parts subdivide to give theirs. Itself included.
    library: enumeratio-combinatorics
    type: (integer_partition) -> number
---

- Defined over `IntegerPartition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `IntegerPartition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
