---
name: PermutationBounce
domain: Permutation statistics
signature: PermutationBounce(p)
summary: "The sum of n - b over the bounce points b: the position of 1 in p, then the greatest position among the entries up to one past the last."
catalog:
  - system: findstat
    identity: St000133
    url: https://www.findstat.org/St000133
    on: Permutation
statOn:
  - Permutation
signatures:
  - call: PermutationBounce(p)
    description: "The sum of n - b over the bounce points b: the position of 1 in p, then the greatest position among the entries up to one past the last."
    library: enumeratio-combinatorics
    type: (permutation) -> number
---

- Defined over `Permutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Permutation` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
