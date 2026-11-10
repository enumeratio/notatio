---
name: DesarrangementTableauCount
domain: Partition statistics
signature: DesarrangementTableauCount(partition)
summary: The standard Young tableaux whose first ascent is even, which are the transposes of the tableaux of the conjugate shape with even first descent.
catalog:
  - system: findstat
    identity: St000506
    url: https://www.findstat.org/St000506
    on: IntegerPartition
statOn:
  - IntegerPartition
signatures:
  - call: DesarrangementTableauCount(partition)
    description: The standard Young tableaux whose first ascent is even, which are the transposes of the tableaux of the conjugate shape with even first descent.
    library: enumeratio-combinatorics
    type: (integer_partition) -> number
---

- Defined over `IntegerPartition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `IntegerPartition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
