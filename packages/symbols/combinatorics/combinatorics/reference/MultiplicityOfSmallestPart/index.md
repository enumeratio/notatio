---
name: MultiplicityOfSmallestPart
domain: Partition statistics
signature: MultiplicityOfSmallestPart(partition)
summary: How many parts equal the smallest.
catalog:
  - system: findstat
    identity: St000160
    url: https://www.findstat.org/St000160
    on: IntegerPartition
  - system: findstat
    identity: St001457
    url: https://www.findstat.org/St001457
    on: PlanePartition
statOn:
  - IntegerPartition
  - PlanePartition
signatures:
  - call: MultiplicityOfSmallestPart(partition)
    description: How many parts equal the smallest.
    library: enumeratio-combinatorics
    type: (integer_partition | plane_partition) -> number
---

- Defined over `IntegerPartition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `IntegerPartition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
