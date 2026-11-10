---
name: InverseFoataArrowAscents
domain: Permutation statistics
signature: InverseFoataArrowAscents(p)
summary: Adjacent ascents p(i) < p(i+1) where inverse Foata sends p(i) to p(i+1).
catalog:
  - system: findstat
    identity: St001744
    url: https://www.findstat.org/St001744
    on: Permutation
statOn:
  - Permutation
signatures:
  - call: InverseFoataArrowAscents(p)
    description: Adjacent ascents p(i) < p(i+1) where inverse Foata sends p(i) to p(i+1).
    library: enumeratio-combinatorics
    type: (permutation) -> number
---

- Defined over `Permutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Permutation` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- Inverse Foata keeps p(i+1) in p(i)'s cycle exactly when p(i+1) is not a left-to-right maximum.
