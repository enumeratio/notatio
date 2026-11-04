---
name: CouplesAreForeverGrundyValue
domain: Partition statistics
signature: CouplesAreForeverGrundyValue(partition)
summary: "The Grundy value of the game that splits a part above 2 into two parts: the nim-sum of the values of the parts, each the least value missing from the nim-sums over its splits."
catalog:
  - system: findstat
    identity: St000752
    url: https://www.findstat.org/St000752
    on: IntegerPartition
statOn:
  - IntegerPartition
signatures:
  - call: CouplesAreForeverGrundyValue(partition)
    description: "The Grundy value of the game that splits a part above 2 into two parts: the nim-sum of the values of the parts, each the least value missing from the nim-sums over its splits."
    library: enumeratio-combinatorics
    type: (integer_partition) -> number
---

- Defined over `IntegerPartition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `IntegerPartition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
