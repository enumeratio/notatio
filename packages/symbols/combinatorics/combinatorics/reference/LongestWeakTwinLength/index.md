---
name: LongestWeakTwinLength
domain: Permutation statistics
signature: LongestWeakTwinLength(p)
summary: The size of a largest pair of disjoint subsequences of p with the same pattern of rises and falls.
catalog:
  - system: findstat
    identity: St001667
    url: https://www.findstat.org/St001667
    on: Permutation
statOn:
  - Permutation
signatures:
  - call: LongestWeakTwinLength(p)
    description: The size of a largest pair of disjoint subsequences of p with the same pattern of rises and falls.
    library: enumeratio-combinatorics
    type: (permutation) -> number
---

- Defined over `Permutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Permutation` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
