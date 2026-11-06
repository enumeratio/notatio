---
name: DynkinIndex
domain: Cartan type statistics
signature: DynkinIndex(cartanType)
summary: "The Dynkin index of the Lie algebra: the greatest common divisor of the indices of its representations."
catalog:
  - system: findstat
    identity: St001156
    url: https://www.findstat.org/St001156
    on: CartanType
statOn:
  - CartanType
signatures:
  - call: DynkinIndex(cartanType)
    description: "The Dynkin index of the Lie algebra: the greatest common divisor of the indices of its representations."
    library: enumeratio-combinatorics
    type: (cartan_type) -> number
---

- Defined over `CartanType` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `CartanType` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
