---
name: MaximalArcLength
domain: Set partition statistics
signature: MaximalArcLength(partition)
summary: The length of the longest arc; 0 when there is no arc.
catalog:
  - system: findstat
    identity: St000730
    url: https://www.findstat.org/St000730
    on: SetPartition
statOn:
  - SetPartition
signatures:
  - call: MaximalArcLength(partition)
    description: The length of the longest arc; 0 when there is no arc.
    library: enumeratio-combinatorics
    type: (set_partition) -> number
---

- Defined over `SetPartition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `SetPartition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000730.
