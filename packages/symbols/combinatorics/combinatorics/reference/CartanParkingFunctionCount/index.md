---
name: CartanParkingFunctionCount
domain: Cartan type statistics
signature: CartanParkingFunctionCount(cartanType)
summary: "The parking functions of the type, the points of the torus Q / (h + 1) Q: (h + 1)^n."
catalog:
  - system: findstat
    identity: St000859
    url: https://www.findstat.org/St000859
    on: CartanType
statOn:
  - CartanType
signatures:
  - call: CartanParkingFunctionCount(cartanType)
    description: "The parking functions of the type, the points of the torus Q / (h + 1) Q: (h + 1)^n."
    library: enumeratio-combinatorics
    type: (cartan_type) -> number
---

- Defined over `CartanType` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `CartanType` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
