---
name: SmallestLeafLabel
domain: Permutation statistics
signature: SmallestLeafLabel(p)
summary: "The smallest label of a leaf of the increasing binary tree of p: the least peak, an end counting as a peak."
catalog:
  - system: findstat
    identity: St000725
    url: https://www.findstat.org/St000725
    on: Permutation
statOn:
  - Permutation
signatures:
  - call: SmallestLeafLabel(p)
    description: "The smallest label of a leaf of the increasing binary tree of p: the least peak, an end counting as a peak."
    library: enumeratio-combinatorics
    type: (permutation) -> number
---

- Defined over `Permutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Permutation` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
