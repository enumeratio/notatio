---
name: QuasiMinusculeRepresentationDimension
domain: Cartan type statistics
signature: QuasiMinusculeRepresentationDimension(cartanType)
summary: The dimension of the quasi-minuscule representation, whose highest weight is the highest short root.
catalog:
  - system: findstat
    identity: St001149
    url: https://www.findstat.org/St001149
    on: CartanType
statOn:
  - CartanType
signatures:
  - call: QuasiMinusculeRepresentationDimension(cartanType)
    description: The dimension of the quasi-minuscule representation, whose highest weight is the highest short root.
    library: enumeratio-combinatorics
    type: (cartan_type) -> number
---

- Defined over `CartanType` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `CartanType` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
