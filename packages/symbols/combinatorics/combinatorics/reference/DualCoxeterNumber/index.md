---
name: DualCoxeterNumber
domain: Cartan type statistics
signature: DualCoxeterNumber(cartanType)
summary: The dual Coxeter number of the type.
catalog:
  - system: findstat
    identity: St001154
    url: https://www.findstat.org/St001154
    on: CartanType
statOn:
  - CartanType
signatures:
  - call: DualCoxeterNumber(cartanType)
    description: The dual Coxeter number of the type.
    library: enumeratio-combinatorics
    type: (cartan_type) -> number
---

- Defined over `CartanType` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `CartanType` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
