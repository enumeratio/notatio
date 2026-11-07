---
name: CharacterPolynomialConstantTerm
domain: Partition statistics
signature: CharacterPolynomialConstantTerm(partition)
summary: "The constant term of the character polynomial: 1 for the partition of all ones (the empty one included), 0 otherwise."
catalog:
  - system: findstat
    identity: St000929
    url: https://www.findstat.org/St000929
    on: IntegerPartition
statOn:
  - IntegerPartition
signatures:
  - call: CharacterPolynomialConstantTerm(partition)
    description: "The constant term of the character polynomial: 1 for the partition of all ones (the empty one included), 0 otherwise."
    library: enumeratio-combinatorics
    type: (integer_partition) -> number
---

- Defined over `IntegerPartition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `IntegerPartition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
