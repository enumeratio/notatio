---
name: SquareRemovalGrundyValue
domain: Partition statistics
signature: SquareRemovalGrundyValue(partition)
summary: The Grundy value of the game that removes a cell or a 2 x 2 square of cells from the diagram, which must stay a partition, the player who cannot move losing.
catalog:
  - system: findstat
    identity: St000137
    url: https://www.findstat.org/St000137
    on: IntegerPartition
statOn:
  - IntegerPartition
signatures:
  - call: SquareRemovalGrundyValue(partition)
    description: The Grundy value of the game that removes a cell or a 2 x 2 square of cells from the diagram, which must stay a partition, the player who cannot move losing.
    library: enumeratio-combinatorics
    type: (integer_partition) -> number
---

- Defined over `IntegerPartition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `IntegerPartition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
