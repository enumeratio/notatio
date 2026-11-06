---
name: SecondPositiveWeylFussCatalanNumber
domain: Cartan type statistics
signature: SecondPositiveWeylFussCatalanNumber(cartanType)
summary: The positive Fuss-Catalan number of order 2 of the type, ∏ (d + 2h - 2) / d.
catalog:
  - system: findstat
    identity: St001053
    url: https://www.findstat.org/St001053
    on: CartanType
statOn:
  - CartanType
signatures:
  - call: SecondPositiveWeylFussCatalanNumber(cartanType)
    description: The positive Fuss-Catalan number of order 2 of the type, ∏ (d + 2h - 2) / d.
    library: enumeratio-combinatorics
    type: (cartan_type) -> number
---

- Defined over `CartanType` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `CartanType` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
