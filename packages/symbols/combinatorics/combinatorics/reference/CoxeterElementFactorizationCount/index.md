---
name: CoxeterElementFactorizationCount
domain: Cartan type statistics
signature: CoxeterElementFactorizationCount(cartanType)
summary: "The ways to write a Coxeter element as a product of n reflections: n! h^n / |W|."
catalog:
  - system: findstat
    identity: St000858
    url: https://www.findstat.org/St000858
    on: CartanType
statOn:
  - CartanType
signatures:
  - call: CoxeterElementFactorizationCount(cartanType)
    description: "The ways to write a Coxeter element as a product of n reflections: n! h^n / |W|."
    library: enumeratio-combinatorics
    type: (cartan_type) -> number
---

- Defined over `CartanType` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `CartanType` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
