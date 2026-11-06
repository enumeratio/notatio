---
name: ReflectionOrbitCount
domain: Cartan type statistics
signature: ReflectionOrbitCount(cartanType)
summary: "The conjugacy classes of reflections in the Weyl group: 2 where the simple roots have two lengths (B, C, F, G), else 1."
catalog:
  - system: findstat
    identity: St000854
    url: https://www.findstat.org/St000854
    on: CartanType
statOn:
  - CartanType
signatures:
  - call: ReflectionOrbitCount(cartanType)
    description: "The conjugacy classes of reflections in the Weyl group: 2 where the simple roots have two lengths (B, C, F, G), else 1."
    library: enumeratio-combinatorics
    type: (cartan_type) -> number
---

- Defined over `CartanType` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `CartanType` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
