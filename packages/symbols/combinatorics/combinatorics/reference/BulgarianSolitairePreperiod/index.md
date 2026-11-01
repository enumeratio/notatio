---
name: BulgarianSolitairePreperiod
domain: Partition statistics
signature: BulgarianSolitairePreperiod(partition)
summary: The steps of Bulgarian solitaire before this partition reaches the cycle it ends in.
catalog:
  - system: findstat
    identity: St001912
    url: https://www.findstat.org/St001912
    on: IntegerPartition
statOn:
  - IntegerPartition
signatures:
  - call: BulgarianSolitairePreperiod(partition)
    description: The steps of Bulgarian solitaire before this partition reaches the cycle it ends in.
    library: enumeratio-combinatorics
    type: (integer_partition) -> number
---

- Defined over `IntegerPartition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `IntegerPartition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
