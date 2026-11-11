---
name: NonnegativeIntegerMatrixCountWithDecreasingColumnSums
domain: Partition statistics
signature: NonnegativeIntegerMatrixCountWithDecreasingColumnSums(partition)
summary: The matrices of nonnegative integers whose row sums are the parts and whose column sums weakly decrease, with no empty column.
catalog:
  - system: findstat
    identity: St000812
    url: https://www.findstat.org/St000812
    on: IntegerPartition
statOn:
  - IntegerPartition
signatures:
  - call: NonnegativeIntegerMatrixCountWithDecreasingColumnSums(partition)
    description: The matrices of nonnegative integers whose row sums are the parts and whose column sums weakly decrease, with no empty column.
    library: enumeratio-combinatorics
    type: (integer_partition) -> number
---

- Defined over `IntegerPartition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `IntegerPartition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
