---
name: DistanceTwoSwapClassSize
domain: Permutation statistics
signature: DistanceTwoSwapClassSize(p)
summary: The permutations reached from p by swapping adjacent entries that differ by 2, p included.
catalog:
  - system: findstat
    identity: St000669
    url: https://www.findstat.org/St000669
    on: Permutation
statOn:
  - Permutation
---

- Defined over `Permutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Permutation` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
