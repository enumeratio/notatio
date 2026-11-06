---
name: PositiveWeylCatalanNumber
domain: Cartan type statistics
signature: PositiveWeylCatalanNumber(cartanType)
summary: The positive Catalan number of the type, ∏ (d + h - 2) / d.
catalog:
  - system: findstat
    identity: St000140
    url: https://www.findstat.org/St000140
    on: CartanType
statOn:
  - CartanType
signatures:
  - call: PositiveWeylCatalanNumber(cartanType)
    description: The positive Catalan number of the type, ∏ (d + h - 2) / d.
    library: enumeratio-combinatorics
    type: (cartan_type) -> number
---

- Defined over `CartanType` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `CartanType` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
