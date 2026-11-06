---
name: CoxeterNumber
domain: Cartan type statistics
signature: CoxeterNumber(cartanType)
summary: "The Coxeter number of the type: the largest degree of its Weyl group."
catalog:
  - system: findstat
    identity: St000139
    url: https://www.findstat.org/St000139
    on: CartanType
statOn:
  - CartanType
signatures:
  - call: CoxeterNumber(cartanType)
    description: "The Coxeter number of the type: the largest degree of its Weyl group."
    library: enumeratio-combinatorics
    type: (cartan_type) -> number
---

- Defined over `CartanType` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `CartanType` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
