---
name: PermutationTreeHeight
domain: Permutation statistics
signature: PermutationTreeHeight(p)
summary: The height of the rooted tree from inserting the entries one by one, the most entries on the stack of ancestors.
catalog:
  - system: findstat
    identity: St000308
    url: https://www.findstat.org/St000308
    on: Permutation
statOn:
  - Permutation
signatures:
  - call: PermutationTreeHeight(p)
    description: The height of the rooted tree from inserting the entries one by one, the most entries on the stack of ancestors.
    library: enumeratio-combinatorics
    type: (list<integer> | permutation) -> number
---

- Defined over `Permutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Permutation`, and also a bare list of integers: this reading compares entries with each other rather than with their positions, so it stands on any sequence.
