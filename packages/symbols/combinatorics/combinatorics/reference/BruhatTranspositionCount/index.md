---
name: BruhatTranspositionCount
domain: Permutation statistics
signature: BruhatTranspositionCount(p)
summary: Transpositions that are at most p in Bruhat order.
catalog:
  - system: findstat
    identity: St001558
    url: https://www.findstat.org/St001558
    on: Permutation
statOn:
  - Permutation
signatures:
  - call: BruhatTranspositionCount(p)
    description: Transpositions that are at most p in Bruhat order.
    library: enumeratio-combinatorics
    type: (permutation) -> number
---

- Defined over `Permutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Permutation` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- Equal to the inversions exactly when p avoids 4231 and 3412.
