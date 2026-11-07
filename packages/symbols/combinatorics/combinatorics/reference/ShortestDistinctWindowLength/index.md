---
name: ShortestDistinctWindowLength
domain: Permutation statistics
signature: ShortestDistinctWindowLength(p)
summary: The least k such that no two windows of k consecutive entries are order isomorphic.
catalog:
  - system: findstat
    identity: St000923
    url: https://www.findstat.org/St000923
    on: Permutation
statOn:
  - Permutation
signatures:
  - call: ShortestDistinctWindowLength(p)
    description: The least k such that no two windows of k consecutive entries are order isomorphic.
    library: enumeratio-combinatorics
    type: (list<integer> | permutation) -> number
---

- Defined over `Permutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Permutation`, and also a bare list of integers: this reading compares entries with each other rather than with their positions, so it stands on any sequence.
- The whole word is one window, so the least exists.
