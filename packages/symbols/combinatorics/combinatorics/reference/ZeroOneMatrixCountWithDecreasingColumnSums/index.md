---
name: ZeroOneMatrixCountWithDecreasingColumnSums
domain: Partition statistics
signature: ZeroOneMatrixCountWithDecreasingColumnSums(partition)
summary: The matrices of 0 and 1 whose row sums are the parts and whose column sums weakly decrease, with no empty column.
catalog:
  - system: findstat
    identity: St000813
    url: https://www.findstat.org/St000813
    on: IntegerPartition
statOn:
  - IntegerPartition
signatures:
  - call: ZeroOneMatrixCountWithDecreasingColumnSums(partition)
    description: The matrices of 0 and 1 whose row sums are the parts and whose column sums weakly decrease, with no empty column.
    library: enumeratio-combinatorics
    type: (integer_partition) -> number
---

- Defined over `IntegerPartition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `IntegerPartition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
