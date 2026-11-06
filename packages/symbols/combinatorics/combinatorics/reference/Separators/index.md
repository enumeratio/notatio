---
name: Separators
domain: Permutation statistics
signature: Separators(p)
summary: The values v that are a vertical separator of p, or whose image under p^-1 is a vertical separator of p^-1.
catalog:
  - system: findstat
    identity: St001402
    url: https://www.findstat.org/St001402
    on: Permutation
statOn:
  - Permutation
signatures:
  - call: Separators(p)
    description: The values v that are a vertical separator of p, or whose image under p^-1 is a vertical separator of p^-1.
    library: enumeratio-combinatorics
    type: (permutation) -> number
---

- Defined over `Permutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Permutation` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
