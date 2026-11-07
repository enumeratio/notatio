---
name: SelfEvacuatingTableauCount
domain: Partition statistics
signature: SelfEvacuatingTableauCount(partition)
summary: The standard Young tableaux of the shape that evacuation fixes, equivalently its standard domino tableaux.
catalog:
  - system: findstat
    identity: St000618
    url: https://www.findstat.org/St000618
    on: IntegerPartition
statOn:
  - IntegerPartition
signatures:
  - call: SelfEvacuatingTableauCount(partition)
    description: The standard Young tableaux of the shape that evacuation fixes, equivalently its standard domino tableaux.
    library: enumeratio-combinatorics
    type: (integer_partition) -> number
---

- Defined over `IntegerPartition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `IntegerPartition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
