---
name: SmallerChildPathLeafLabel
domain: Permutation statistics
signature: SmallerChildPathLeafLabel(p)
summary: The label of the leaf reached from the root of the increasing binary tree of p by always following the child with the smaller label.
catalog:
  - system: findstat
    identity: St000724
    url: https://www.findstat.org/St000724
    on: Permutation
statOn:
  - Permutation
signatures:
  - call: SmallerChildPathLeafLabel(p)
    description: The label of the leaf reached from the root of the increasing binary tree of p by always following the child with the smaller label.
    library: enumeratio-combinatorics
    type: (permutation) -> number
---

- Defined over `Permutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Permutation` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- The root of a window is its minimum, and the smaller child is the root of the side holding the second smallest entry (St000724).
