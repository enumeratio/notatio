---
name: RookPlacementCount
domain: Partition statistics
signature: RookPlacementCount(partition)
summary: The rook placements, of any number of rooks, on the Ferrers board of the diagram.
catalog:
  - system: findstat
    identity: St000532
    url: https://www.findstat.org/St000532
    on: IntegerPartition
  - system: findstat
    identity: St001658
    url: https://www.findstat.org/St001658
    on: SkewPartition
statOn:
  - IntegerPartition
  - SkewPartition
signatures:
  - call: RookPlacementCount(partition)
    description: The rook placements, of any number of rooks, on the Ferrers board of the diagram.
    library: enumeratio-combinatorics
    type: (integer_partition | skew_partition) -> number
---

- Defined over `IntegerPartition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `IntegerPartition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
