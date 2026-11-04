---
name: LargestSearchTreeLeafLabel
domain: Permutation statistics
signature: LargestSearchTreeLeafLabel(p)
summary: The largest label of a leaf of the binary search tree of p, inserting p(1), ..., p(n) in order.
catalog:
  - system: findstat
    identity: St000727
    url: https://www.findstat.org/St000727
    on: Permutation
statOn:
  - Permutation
signatures:
  - call: LargestSearchTreeLeafLabel(p)
    description: The largest label of a leaf of the binary search tree of p, inserting p(1), ..., p(n) in order.
    library: enumeratio-combinatorics
    type: (list<integer> | permutation) -> number
---

- Defined over `Permutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Permutation`, and also a bare list of integers: this reading compares entries with each other rather than with their positions, so it stands on any sequence.
