---
name: PermutationBreadth
domain: Permutation statistics
signature: PermutationBreadth(p)
summary: The least Manhattan distance |i - j| + |p(i) - p(j)| between two points of the permutation matrix.
catalog:
  - system: findstat
    identity: St000842
    url: https://www.findstat.org/St000842
    on: Permutation
statOn:
  - Permutation
signatures:
  - call: PermutationBreadth(p)
    description: The least Manhattan distance |i - j| + |p(i) - p(j)| between two points of the permutation matrix.
    library: enumeratio-combinatorics
    type: (permutation) -> number
---

- Defined over `Permutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Permutation` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
