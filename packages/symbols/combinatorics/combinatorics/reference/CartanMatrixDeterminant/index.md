---
name: CartanMatrixDeterminant
domain: Cartan type statistics
signature: CartanMatrixDeterminant(cartanType)
summary: The determinant of the Cartan matrix, the order of the center of the simply connected group.
catalog:
  - system: findstat
    identity: St000821
    url: https://www.findstat.org/St000821
    on: CartanType
statOn:
  - CartanType
signatures:
  - call: CartanMatrixDeterminant(cartanType)
    description: The determinant of the Cartan matrix, the order of the center of the simply connected group.
    library: enumeratio-combinatorics
    type: (cartan_type) -> number
---

- Defined over `CartanType` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `CartanType` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
