---
name: StandardTableauCountWithMajorIndexDivisibleBySize
domain: Partition statistics
signature: StandardTableauCountWithMajorIndexDivisibleBySize(partition)
summary: The standard Young tableaux whose major index is divisible by the size of the shape.
catalog:
  - system: findstat
    identity: St001442
    url: https://www.findstat.org/St001442
    on: IntegerPartition
statOn:
  - IntegerPartition
signatures:
  - call: StandardTableauCountWithMajorIndexDivisibleBySize(partition)
    description: The standard Young tableaux whose major index is divisible by the size of the shape.
    library: enumeratio-combinatorics
    type: (integer_partition) -> number
---

- Defined over `IntegerPartition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `IntegerPartition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
