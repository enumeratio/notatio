---
name: SquareRootCount
domain: Partition statistics
signature: SquareRootCount(partition)
summary: "The permutations whose square is a fixed permutation of this cycle type: a product over the cycle lengths d of the roots of the cycles of length d, which is also the sum of the irreducible character values at that class."
catalog:
  - system: findstat
    identity: St000811
    url: https://www.findstat.org/St000811
    on: IntegerPartition
statOn:
  - IntegerPartition
signatures:
  - call: SquareRootCount(partition)
    description: "The permutations whose square is a fixed permutation of this cycle type: a product over the cycle lengths d of the roots of the cycles of length d, which is also the sum of the irreducible character values at that class."
    library: enumeratio-combinatorics
    type: (integer_partition) -> number
---

- Defined over `IntegerPartition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `IntegerPartition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
