---
name: LargestUniversalPatternSize
domain: Permutation statistics
signature: LargestUniversalPatternSize(p)
summary: The largest k such that p contains every permutation of size k as a pattern.
catalog:
  - system: findstat
    identity: St001741
    url: https://www.findstat.org/St001741
    on: Permutation
statOn:
  - Permutation
signatures:
  - call: LargestUniversalPatternSize(p)
    description: The largest k such that p contains every permutation of size k as a pattern.
    library: enumeratio-combinatorics
    type: (permutation) -> number
---

- Defined over `Permutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Permutation` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- Containing every pattern of size k implies containing those of every smaller size, so the sizes counted are exactly 1 up to the largest.
