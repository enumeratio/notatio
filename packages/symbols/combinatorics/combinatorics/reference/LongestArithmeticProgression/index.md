---
name: LongestArithmeticProgression
domain: Permutation statistics
signature: LongestArithmeticProgression(p)
summary: The length of a longest subsequence whose entries form an arithmetic progression, of either sign.
catalog:
  - system: findstat
    identity: St001566
    url: https://www.findstat.org/St001566
    on: Permutation
statOn:
  - Permutation
signatures:
  - call: LongestArithmeticProgression(p)
    description: The length of a longest subsequence whose entries form an arithmetic progression, of either sign.
    library: enumeratio-combinatorics
    type: (permutation) -> number
---

- Defined over `Permutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Permutation` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
