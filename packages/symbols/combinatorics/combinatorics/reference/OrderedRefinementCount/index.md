---
name: OrderedRefinementCount
domain: Partition statistics
signature: OrderedRefinementCount(partition)
summary: The partitions whose parts cut, in order, into consecutive blocks summing to the parts of this one.
catalog:
  - system: findstat
    identity: St000935
    url: https://www.findstat.org/St000935
    on: IntegerPartition
statOn:
  - IntegerPartition
signatures:
  - call: OrderedRefinementCount(partition)
    description: The partitions whose parts cut, in order, into consecutive blocks summing to the parts of this one.
    library: enumeratio-combinatorics
    type: (integer_partition) -> number
---

- Defined over `IntegerPartition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `IntegerPartition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
