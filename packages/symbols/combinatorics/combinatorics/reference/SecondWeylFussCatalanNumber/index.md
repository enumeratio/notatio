---
name: SecondWeylFussCatalanNumber
domain: Cartan type statistics
signature: SecondWeylFussCatalanNumber(cartanType)
summary: The Fuss-Catalan number of order 2 of the type, ∏ (d + 2h) / d.
catalog:
  - system: findstat
    identity: St000852
    url: https://www.findstat.org/St000852
    on: CartanType
statOn:
  - CartanType
signatures:
  - call: SecondWeylFussCatalanNumber(cartanType)
    description: The Fuss-Catalan number of order 2 of the type, ∏ (d + 2h) / d.
    library: enumeratio-combinatorics
    type: (cartan_type) -> number
---

- Defined over `CartanType` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `CartanType` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
