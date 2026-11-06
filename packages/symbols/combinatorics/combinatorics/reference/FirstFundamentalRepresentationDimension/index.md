---
name: FirstFundamentalRepresentationDimension
domain: Cartan type statistics
signature: FirstFundamentalRepresentationDimension(cartanType)
summary: The dimension of the representation with highest weight the first fundamental weight, in Bourbaki's numbering.
catalog:
  - system: findstat
    identity: St000107
    url: https://www.findstat.org/St000107
    on: CartanType
statOn:
  - CartanType
signatures:
  - call: FirstFundamentalRepresentationDimension(cartanType)
    description: The dimension of the representation with highest weight the first fundamental weight, in Bourbaki's numbering.
    library: enumeratio-combinatorics
    type: (cartan_type) -> number
---

- Defined over `CartanType` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `CartanType` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
