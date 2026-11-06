---
name: CoxeterElementCount
domain: Cartan type statistics
signature: CoxeterElementCount(cartanType)
summary: The Coxeter elements of the Weyl group, one conjugacy class of size |W| / h.
catalog:
  - system: findstat
    identity: St000865
    url: https://www.findstat.org/St000865
    on: CartanType
statOn:
  - CartanType
signatures:
  - call: CoxeterElementCount(cartanType)
    description: The Coxeter elements of the Weyl group, one conjugacy class of size |W| / h.
    library: enumeratio-combinatorics
    type: (cartan_type) -> number
---

- Defined over `CartanType` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `CartanType` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
