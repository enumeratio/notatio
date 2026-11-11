---
name: SemistandardTableauCountWithContent
domain: Partition statistics
signature: SemistandardTableauCountWithContent(partition)
summary: "The semistandard tableaux of any shape in which the entry i occurs as many times as part i: the symmetric matrices of nonnegative integers with these row sums."
catalog:
  - system: findstat
    identity: St000814
    url: https://www.findstat.org/St000814
    on: IntegerPartition
statOn:
  - IntegerPartition
signatures:
  - call: SemistandardTableauCountWithContent(partition)
    description: "The semistandard tableaux of any shape in which the entry i occurs as many times as part i: the symmetric matrices of nonnegative integers with these row sums."
    library: enumeratio-combinatorics
    type: (integer_partition) -> number
---

- Defined over `IntegerPartition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `IntegerPartition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
