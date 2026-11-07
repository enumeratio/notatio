---
name: CycleInverseClassSize
domain: Permutation statistics
signature: CycleInverseClassSize(p)
summary: "2 to the power of the cycles of length at least three: the permutations got by inverting any of p's cycles."
catalog:
  - system: findstat
    identity: St001359
    url: https://www.findstat.org/St001359
    on: Permutation
statOn:
  - Permutation
signatures:
  - call: CycleInverseClassSize(p)
    description: "2 to the power of the cycles of length at least three: the permutations got by inverting any of p's cycles."
    library: enumeratio-combinatorics
    type: (permutation) -> number
---

- Defined over `Permutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Permutation` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
