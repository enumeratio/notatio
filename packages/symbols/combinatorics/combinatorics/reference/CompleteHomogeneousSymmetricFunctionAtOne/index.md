---
name: CompleteHomogeneousSymmetricFunctionAtOne
domain: Partition statistics
signature: CompleteHomogeneousSymmetricFunctionAtOne(partition)
summary: "The complete homogeneous symmetric function indexed by the partition, in as many variables as it has parts, all set to 1: the product of the multiset coefficients of the number of parts and each part."
catalog:
  - system: findstat
    identity: St001562
    url: https://www.findstat.org/St001562
    on: IntegerPartition
statOn:
  - IntegerPartition
signatures:
  - call: CompleteHomogeneousSymmetricFunctionAtOne(partition)
    description: "The complete homogeneous symmetric function indexed by the partition, in as many variables as it has parts, all set to 1: the product of the multiset coefficients of the number of parts and each part."
    library: enumeratio-combinatorics
    type: (integer_partition) -> number
---

- Defined over `IntegerPartition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `IntegerPartition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
