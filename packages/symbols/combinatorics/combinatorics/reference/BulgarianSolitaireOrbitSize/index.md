---
name: BulgarianSolitaireOrbitSize
domain: Partition statistics
signature: BulgarianSolitaireOrbitSize(partition)
summary: The partitions that Bulgarian solitaire (remove the first column, insert it as a row) visits from this one, itself included.
catalog:
  - system: findstat
    identity: St001914
    url: https://www.findstat.org/St001914
    on: IntegerPartition
statOn:
  - IntegerPartition
signatures:
  - call: BulgarianSolitaireOrbitSize(partition)
    description: The partitions that Bulgarian solitaire (remove the first column, insert it as a row) visits from this one, itself included.
    library: enumeratio-combinatorics
    type: (integer_partition) -> number
---

- Defined over `IntegerPartition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `IntegerPartition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
