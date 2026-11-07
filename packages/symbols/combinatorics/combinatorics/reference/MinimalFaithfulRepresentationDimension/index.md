---
name: MinimalFaithfulRepresentationDimension
domain: Cartan type statistics
signature: MinimalFaithfulRepresentationDimension(cartanType)
summary: The smallest dimension of a faithful representation of the Lie algebra.
catalog:
  - system: findstat
    identity: St001150
    url: https://www.findstat.org/St001150
    on: CartanType
statOn:
  - CartanType
signatures:
  - call: MinimalFaithfulRepresentationDimension(cartanType)
    description: The smallest dimension of a faithful representation of the Lie algebra.
    library: enumeratio-combinatorics
    type: (cartan_type) -> number
---

- Defined over `CartanType` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `CartanType` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
