---
name: WeightedSize
domain: Partition and standard tableau statistics
signature: WeightedSize(object)
summary: The sum over the cells of their row, counting rows from 0.
catalog:
  - system: findstat
    identity: St000185
    url: https://www.findstat.org/St000185
    on: IntegerPartition
  - system: findstat
    identity: St000336
    url: https://www.findstat.org/St000336
    on: StandardTableau
statOn:
  - IntegerPartition
  - StandardTableau
signatures:
  - call: WeightedSize(partition)
    description: The sum of the parts weighted by their row, counting rows from 0.
    library: enumeratio-combinatorics
    type: (integer_partition | standard_tableau) -> number
  - call: WeightedSize(tableau)
    description: The sum of the leg lengths of the cells, the sum over the cells of their row counted from 0.
    library: enumeratio-combinatorics
    type: (integer_partition | standard_tableau) -> number
bindings:
  - origin: mapped
    form: sage
    template: enumeratio_stat("IntegerPartition", $1, "WeightedSize")
    arity: 1
    checked:
      version: "10.9"
      on: 2026-10-16
---

- Defined over `IntegerPartition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `IntegerPartition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- Defined over `StandardTableau` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `StandardTableau` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's leg major index (St000336), a statistic of the shape; on a partition it is the same head. The empty tableau gives 0.
