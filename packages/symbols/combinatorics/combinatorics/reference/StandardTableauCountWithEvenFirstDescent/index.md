---
name: StandardTableauCountWithEvenFirstDescent
domain: Partition statistics
signature: StandardTableauCountWithEvenFirstDescent(partition)
summary: The standard Young tableaux whose smallest descent, or the size when there is none, is even.
catalog:
  - system: findstat
    identity: St000621
    url: https://www.findstat.org/St000621
    on: IntegerPartition
statOn:
  - IntegerPartition
signatures:
  - call: StandardTableauCountWithEvenFirstDescent(partition)
    description: The standard Young tableaux whose smallest descent, or the size when there is none, is even.
    library: enumeratio-combinatorics
    type: (integer_partition) -> number
---

- Defined over `IntegerPartition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `IntegerPartition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
