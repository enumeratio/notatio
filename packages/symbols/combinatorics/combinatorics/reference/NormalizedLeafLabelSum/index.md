---
name: NormalizedLeafLabelSum
domain: Permutation statistics
signature: NormalizedLeafLabelSum(p)
summary: The sum of the leaf labels of the increasing binary tree of p, less n.
catalog:
  - system: findstat
    identity: St000726
    url: https://www.findstat.org/St000726
    on: Permutation
statOn:
  - Permutation
signatures:
  - call: NormalizedLeafLabelSum(p)
    description: The sum of the leaf labels of the increasing binary tree of p, less n.
    library: enumeratio-combinatorics
    type: (list<integer> | permutation) -> number
---

- Defined over `Permutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Permutation`, and also a bare list of integers: this reading compares entries with each other rather than with their positions, so it stands on any sequence.
