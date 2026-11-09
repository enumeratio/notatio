---
name: TwoConjugate
domain: Combinatorial maps
signature: TwoConjugate(IntegerPartition)
summary: The involution that keeps the odd parts' positions and swaps the number of even parts with the number of cells of zero leg length and odd arm length.
laws:
  - bijection
  - involution
  - graded:
      from: IntegerPartitions
      to: IntegerPartitions
    on: integer_partition
catalog:
  - system: findstat
    identity: Mp00321
    url: https://www.findstat.org/Mp00321
    on: IntegerPartition
mapOn:
  - IntegerPartition
signatures:
  - call: TwoConjugate(IntegerPartition)
    description: The involution that keeps the odd parts' positions and swaps the number of even parts with the number of cells of zero leg length and odd arm length.
    library: enumeratio-combinatorics
    type: (integer_partition) -> integer_partition
---

- Takes a `IntegerPartition` and returns a `IntegerPartition` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- FindStat's Mp00321, the case s = 2 of an involution for every s that is conjugation at s = 1.
