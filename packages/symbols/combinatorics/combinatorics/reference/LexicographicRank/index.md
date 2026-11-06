---
name: LexicographicRank
domain: Permutation statistics
signature: LexicographicRank(p)
summary: The position of p among the permutations of its size in lexicographic order, counting from 1.
catalog:
  - system: findstat
    identity: St000020
    url: https://www.findstat.org/St000020
    on: Permutation
statOn:
  - Permutation
signatures:
  - call: LexicographicRank(p)
    description: The position of p among the permutations of its size in lexicographic order, counting from 1.
    library: enumeratio-combinatorics
    type: (list<integer> | permutation) -> number
---

- Defined over `Permutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Permutation`, and also a bare list of integers: this reading compares entries with each other rather than with their positions, so it stands on any sequence.
- One more than the Lehmer code read as a number in the factorial base.
