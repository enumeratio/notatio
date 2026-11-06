---
name: ReflectionCount
domain: Cartan type statistics
signature: ReflectionCount(cartanType)
summary: "The number of reflections in the Weyl group, which is the number of positive roots: the sum of the exponents."
catalog:
  - system: findstat
    identity: St000857
    url: https://www.findstat.org/St000857
    on: CartanType
statOn:
  - CartanType
signatures:
  - call: ReflectionCount(cartanType)
    description: "The number of reflections in the Weyl group, which is the number of positive roots: the sum of the exponents."
    library: enumeratio-combinatorics
    type: (cartan_type) -> number
---

- Defined over `CartanType` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `CartanType` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
