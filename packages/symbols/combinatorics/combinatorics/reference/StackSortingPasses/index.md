---
name: StackSortingPasses
domain: Permutation statistics
signature: StackSortingPasses(p)
summary: The passes of West's stack sorting needed to sort p.
catalog:
  - system: findstat
    identity: St000028
    url: https://www.findstat.org/St000028
    on: Permutation
statOn:
  - Permutation
---

- Defined over `Permutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Permutation` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- At most n - 1 passes sort a permutation of n.
