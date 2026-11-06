---
name: OverlapSetSize
domain: Permutation statistics
signature: OverlapSetSize(p)
summary: Shifts i < n for which the first n - i entries and the last n - i entries are in the same relative order.
catalog:
  - system: findstat
    identity: St001096
    url: https://www.findstat.org/St001096
    on: Permutation
statOn:
  - Permutation
signatures:
  - call: OverlapSetSize(p)
    description: Shifts i < n for which the first n - i entries and the last n - i entries are in the same relative order.
    library: enumeratio-combinatorics
    type: (list<integer> | permutation) -> number
---

- Defined over `Permutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Permutation`, and also a bare list of integers: this reading compares entries with each other rather than with their positions, so it stands on any sequence.
