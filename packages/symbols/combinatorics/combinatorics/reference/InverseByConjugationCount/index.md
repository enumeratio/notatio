---
name: InverseByConjugationCount
domain: Partition statistics
signature: InverseByConjugationCount(partition)
summary: "The permutations that a fixed permutation of this cycle type conjugates to their inverse: the square roots of its square, a product over the cycle lengths d of the roots of the cycles of length d."
catalog:
  - system: findstat
    identity: St001710
    url: https://www.findstat.org/St001710
    on: IntegerPartition
statOn:
  - IntegerPartition
signatures:
  - call: InverseByConjugationCount(partition)
    description: "The permutations that a fixed permutation of this cycle type conjugates to their inverse: the square roots of its square, a product over the cycle lengths d of the roots of the cycles of length d."
    library: enumeratio-combinatorics
    type: (integer_partition) -> number
---

- Defined over `IntegerPartition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `IntegerPartition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- alpha pi alpha^-1 = pi^-1 exactly when (pi alpha)^2 = alpha^2.
