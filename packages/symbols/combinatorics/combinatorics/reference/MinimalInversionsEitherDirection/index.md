---
name: MinimalInversionsEitherDirection
domain: Permutation statistics
signature: MinimalInversionsEitherDirection(p)
summary: The smaller of the number of inversions and the number of non-inversions.
catalog:
  - system: findstat
    identity: St001511
    url: https://www.findstat.org/St001511
    on: Permutation
statOn:
  - Permutation
signatures:
  - call: MinimalInversionsEitherDirection(p)
    description: The smaller of the number of inversions and the number of non-inversions.
    library: enumeratio-combinatorics
    type: (list<integer> | permutation) -> number
---

- Defined over `Permutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Permutation`, and also a bare list of integers: this reading compares entries with each other rather than with their positions, so it stands on any sequence.
- Inversions of p against those of its reverse.
