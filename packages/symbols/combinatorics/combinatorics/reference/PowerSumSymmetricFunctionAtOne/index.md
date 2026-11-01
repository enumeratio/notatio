---
name: PowerSumSymmetricFunctionAtOne
domain: Partition statistics
signature: PowerSumSymmetricFunctionAtOne(partition)
summary: "The power-sum symmetric function indexed by the partition, in as many variables as it has parts, all set to 1: the number of parts to its own power."
catalog:
  - system: findstat
    identity: St001563
    url: https://www.findstat.org/St001563
    on: IntegerPartition
statOn:
  - IntegerPartition
signatures:
  - call: PowerSumSymmetricFunctionAtOne(partition)
    description: "The power-sum symmetric function indexed by the partition, in as many variables as it has parts, all set to 1: the number of parts to its own power."
    library: enumeratio-combinatorics
    type: (integer_partition) -> number
---

- Defined over `IntegerPartition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `IntegerPartition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
