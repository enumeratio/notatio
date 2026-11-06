---
name: PoincarePolynomialMaximalCoefficient
domain: Cartan type statistics
signature: PoincarePolynomialMaximalCoefficient(cartanType)
summary: The largest coefficient of the Poincaré polynomial ∏ [d]_q of the Weyl group.
catalog:
  - system: findstat
    identity: St001443
    url: https://www.findstat.org/St001443
    on: CartanType
statOn:
  - CartanType
signatures:
  - call: PoincarePolynomialMaximalCoefficient(cartanType)
    description: The largest coefficient of the Poincaré polynomial ∏ [d]_q of the Weyl group.
    library: enumeratio-combinatorics
    type: (cartan_type) -> number
---

- Defined over `CartanType` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `CartanType` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
