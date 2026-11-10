---
name: PopStackSortingPasses
domain: Permutation statistics
signature: PopStackSortingPasses(p)
summary: The pop-stack sorting passes, each reversing every maximal descending run, needed to sort p.
catalog:
  - system: findstat
    identity: St001090
    url: https://www.findstat.org/St001090
    on: Permutation
statOn:
  - Permutation
signatures:
  - call: PopStackSortingPasses(p)
    description: The pop-stack sorting passes, each reversing every maximal descending run, needed to sort p.
    library: enumeratio-combinatorics
    type: (list<integer> | permutation) -> number
---

- Defined over `Permutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Permutation`, and also a bare list of integers: this reading compares entries with each other rather than with their positions, so it stands on any sequence.
- At most n - 1 passes sort a permutation of n.
