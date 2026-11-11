---
name: StandardTableauCountWithNoConsecutiveEntriesInOneRow
domain: Partition statistics
signature: StandardTableauCountWithNoConsecutiveEntriesInOneRow(partition)
summary: The standard Young tableaux of the shape in which no row holds i and i + 1 together.
catalog:
  - system: findstat
    identity: St000212
    url: https://www.findstat.org/St000212
    on: IntegerPartition
statOn:
  - IntegerPartition
signatures:
  - call: StandardTableauCountWithNoConsecutiveEntriesInOneRow(partition)
    description: The standard Young tableaux of the shape in which no row holds i and i + 1 together.
    library: enumeratio-combinatorics
    type: (integer_partition) -> number
---

- Defined over `IntegerPartition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `IntegerPartition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
