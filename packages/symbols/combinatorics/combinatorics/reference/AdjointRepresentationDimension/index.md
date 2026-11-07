---
name: AdjointRepresentationDimension
domain: Cartan type statistics
signature: AdjointRepresentationDimension(cartanType)
summary: "The dimension of the adjoint representation of the Lie algebra: n plus twice the number of positive roots."
catalog:
  - system: findstat
    identity: St001148
    url: https://www.findstat.org/St001148
    on: CartanType
statOn:
  - CartanType
signatures:
  - call: AdjointRepresentationDimension(cartanType)
    description: "The dimension of the adjoint representation of the Lie algebra: n plus twice the number of positive roots."
    library: enumeratio-combinatorics
    type: (cartan_type) -> number
---

- Defined over `CartanType` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `CartanType` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
