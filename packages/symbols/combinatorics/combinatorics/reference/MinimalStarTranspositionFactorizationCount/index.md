---
name: MinimalStarTranspositionFactorizationCount
domain: Permutation statistics
signature: MinimalStarTranspositionFactorizationCount(p)
summary: The minimal length factorizations of p into the transpositions (1 a).
catalog:
  - system: findstat
    identity: St001081
    url: https://www.findstat.org/St001081
    on: Permutation
statOn:
  - Permutation
---

- Defined over `Permutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Permutation` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's formula.
