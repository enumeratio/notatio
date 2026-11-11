---
name: SmallestOddRestrictionDepth
domain: Partition statistics
signature: SmallestOddRestrictionDepth(partition)
summary: "The fewest cells to remove from the diagram so that the partition left has an odd number of standard tableaux: the least d such that the restriction of the irreducible representation to the symmetric group on n - d points has a constituent of odd dimension."
catalog:
  - system: findstat
    identity: St000749
    url: https://www.findstat.org/St000749
    on: IntegerPartition
statOn:
  - IntegerPartition
signatures:
  - call: SmallestOddRestrictionDepth(partition)
    description: "The fewest cells to remove from the diagram so that the partition left has an odd number of standard tableaux: the least d such that the restriction of the irreducible representation to the symmetric group on n - d points has a constituent of odd dimension."
    library: enumeratio-combinatorics
    type: (integer_partition) -> number
---

- Defined over `IntegerPartition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `IntegerPartition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
