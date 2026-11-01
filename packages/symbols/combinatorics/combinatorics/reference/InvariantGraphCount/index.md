---
name: InvariantGraphCount
domain: Partition statistics
signature: InvariantGraphCount(partition)
summary: "The simple graphs on the points that a permutation of this cycle type maps to themselves: 2 to the number of edge orbits."
catalog:
  - system: findstat
    identity: St000514
    url: https://www.findstat.org/St000514
    on: IntegerPartition
statOn:
  - IntegerPartition
signatures:
  - call: InvariantGraphCount(partition)
    description: "The simple graphs on the points that a permutation of this cycle type maps to themselves: 2 to the number of edge orbits."
    library: enumeratio-combinatorics
    type: (integer_partition) -> number
---

- Defined over `IntegerPartition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `IntegerPartition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
