---
name: CartanRank
domain: Cartan type statistics
signature: CartanRank(cartanType)
summary: "The rank of the type: the number of simple roots."
catalog:
  - system: findstat
    identity: St000113
    url: https://www.findstat.org/St000113
    on: CartanType
statOn:
  - CartanType
signatures:
  - call: CartanRank(cartanType)
    description: "The rank of the type: the number of simple roots."
    library: enumeratio-combinatorics
    type: (cartan_type) -> number
---

- Defined over `CartanType` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `CartanType` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
