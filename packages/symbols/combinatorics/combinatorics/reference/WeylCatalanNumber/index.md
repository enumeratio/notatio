---
name: WeylCatalanNumber
domain: Cartan type statistics
signature: WeylCatalanNumber(cartanType)
summary: The Catalan number of the type, ∏ (d + h) / d over the degrees d and the Coxeter number h.
catalog:
  - system: findstat
    identity: St000138
    url: https://www.findstat.org/St000138
    on: CartanType
statOn:
  - CartanType
signatures:
  - call: WeylCatalanNumber(cartanType)
    description: The Catalan number of the type, ∏ (d + h) / d over the degrees d and the Coxeter number h.
    library: enumeratio-combinatorics
    type: (cartan_type) -> number
---

- Defined over `CartanType` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `CartanType` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
