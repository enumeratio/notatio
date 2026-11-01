---
name: CubeRootCount
domain: Partition statistics
signature: CubeRootCount(partition)
summary: "The permutations whose cube is a fixed permutation of this cycle type: the product over part sizes d, with a parts of size d, of the number of ways to take the cube root of each part of size d alone or of three together as a cycle of length 3d."
catalog:
  - system: findstat
    identity: St001364
    url: https://www.findstat.org/St001364
    on: IntegerPartition
statOn:
  - IntegerPartition
signatures:
  - call: CubeRootCount(partition)
    description: "The permutations whose cube is a fixed permutation of this cycle type: the product over part sizes d, with a parts of size d, of the number of ways to take the cube root of each part of size d alone or of three together as a cycle of length 3d."
    library: enumeratio-combinatorics
    type: (integer_partition) -> number
---

- Defined over `IntegerPartition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `IntegerPartition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
