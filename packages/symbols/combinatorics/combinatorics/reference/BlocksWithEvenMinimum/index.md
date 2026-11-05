---
name: BlocksWithEvenMinimum
domain: Set partition statistics
signature: BlocksWithEvenMinimum(partition)
summary: Blocks whose smallest element is even.
catalog:
  - system: findstat
    identity: St001153
    url: https://www.findstat.org/St001153
    on: SetPartition
  - system: findstat
    identity: St001152
    url: https://www.findstat.org/St001152
    on: PerfectMatching
statOn:
  - PerfectMatching
  - SetPartition
signatures:
  - call: BlocksWithEvenMinimum(partition)
    description: Blocks whose smallest element is even.
    library: enumeratio-combinatorics
    type: (set_partition) -> number
---

- Defined over `SetPartition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `SetPartition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
