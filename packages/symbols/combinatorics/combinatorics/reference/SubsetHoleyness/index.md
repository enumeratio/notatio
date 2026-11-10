---
name: SubsetHoleyness
domain: Permutation statistics
signature: SubsetHoleyness(p)
summary: The most any subset S of 1 .. n gains in elements m with m + 1 outside it on passing to its image p(S).
catalog:
  - system: findstat
    identity: St001469
    url: https://www.findstat.org/St001469
    on: Permutation
statOn:
  - Permutation
signatures:
  - call: SubsetHoleyness(p)
    description: The most any subset S of 1 .. n gains in elements m with m + 1 outside it on passing to its image p(S).
    library: enumeratio-combinatorics
    type: (permutation) -> number
---

- Defined over `Permutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Permutation` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's holeyness.
