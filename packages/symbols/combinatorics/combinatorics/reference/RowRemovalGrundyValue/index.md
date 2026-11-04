---
name: RowRemovalGrundyValue
domain: Partition statistics
signature: RowRemovalGrundyValue(partition)
summary: "The Grundy value of the game that removes cells from the end of a row while the diagram stays a partition: staircase nim, the nim-sum of the differences of consecutive parts at odd positions."
catalog:
  - system: findstat
    identity: St001055
    url: https://www.findstat.org/St001055
    on: IntegerPartition
statOn:
  - IntegerPartition
signatures:
  - call: RowRemovalGrundyValue(partition)
    description: "The Grundy value of the game that removes cells from the end of a row while the diagram stays a partition: staircase nim, the nim-sum of the differences of consecutive parts at odd positions."
    library: enumeratio-combinatorics
    type: (integer_partition) -> number
---

- Defined over `IntegerPartition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `IntegerPartition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
