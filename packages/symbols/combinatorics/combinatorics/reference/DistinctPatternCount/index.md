---
name: DistinctPatternCount
domain: Permutation statistics
signature: DistinctPatternCount(p)
summary: The order patterns of the subsequences of p, the empty one included, counted once each.
catalog:
  - system: findstat
    identity: St000520
    url: https://www.findstat.org/St000520
    on: Permutation
statOn:
  - Permutation
signatures:
  - call: DistinctPatternCount(p)
    description: The order patterns of the subsequences of p, the empty one included, counted once each.
    library: enumeratio-combinatorics
    type: (list<integer> | permutation) -> number
---

- Defined over `Permutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Permutation`, and also a bare list of integers: this reading compares entries with each other rather than with their positions, so it stands on any sequence.
- A subsequence is counted when no subsequence at smaller positions, read as a bit mask, has its pattern.
