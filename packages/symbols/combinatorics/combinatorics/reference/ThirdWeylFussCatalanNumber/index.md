---
name: ThirdWeylFussCatalanNumber
domain: Cartan type statistics
signature: ThirdWeylFussCatalanNumber(cartanType)
summary: The Fuss-Catalan number of order 3 of the type, ∏ (d + 3h) / d.
catalog:
  - system: findstat
    identity: St000851
    url: https://www.findstat.org/St000851
    on: CartanType
statOn:
  - CartanType
signatures:
  - call: ThirdWeylFussCatalanNumber(cartanType)
    description: The Fuss-Catalan number of order 3 of the type, ∏ (d + 3h) / d.
    library: enumeratio-combinatorics
    type: (cartan_type) -> number
---

- Defined over `CartanType` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `CartanType` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
