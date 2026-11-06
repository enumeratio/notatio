---
name: SymmetryClassSize
domain: Permutation statistics
signature: SymmetryClassSize(p)
summary: "The permutations reachable from p by inverse, reverse and complement: 8 over the symmetries that fix p."
catalog:
  - system: findstat
    identity: St000401
    url: https://www.findstat.org/St000401
    on: Permutation
statOn:
  - Permutation
signatures:
  - call: SymmetryClassSize(p)
    description: "The permutations reachable from p by inverse, reverse and complement: 8 over the symmetries that fix p."
    library: enumeratio-combinatorics
    type: (permutation) -> number
---

- Defined over `Permutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Permutation` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
