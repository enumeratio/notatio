---
name: SingletonRefinementCount
domain: Partition statistics
signature: SingletonRefinementCount(partition)
summary: The chains of single splits (a part into two) from this partition down to all ones.
catalog:
  - system: findstat
    identity: St000913
    url: https://www.findstat.org/St000913
    on: IntegerPartition
statOn:
  - IntegerPartition
signatures:
  - call: SingletonRefinementCount(partition)
    description: The chains of single splits (a part into two) from this partition down to all ones.
    library: enumeratio-combinatorics
    type: (integer_partition) -> number
---

- Defined over `IntegerPartition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `IntegerPartition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
