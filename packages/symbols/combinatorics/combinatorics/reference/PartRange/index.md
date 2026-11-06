---
name: PartRange
domain: Partition statistics
signature: PartRange(partition)
summary: The largest part minus the smallest.
catalog:
  - system: findstat
    identity: St000225
    url: https://www.findstat.org/St000225
    on: IntegerPartition
  - system: findstat
    identity: St001454
    url: https://www.findstat.org/St001454
    on: PlanePartition
statOn:
  - IntegerPartition
  - PlanePartition
signatures:
  - call: PartRange(partition)
    description: The largest part minus the smallest.
    library: enumeratio-combinatorics
    type: (integer_partition | plane_partition) -> number
---

- Defined over `IntegerPartition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `IntegerPartition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
