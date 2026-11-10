---
name: LargestFundamentalRepresentationDimension
domain: Cartan type statistics
signature: LargestFundamentalRepresentationDimension(cartanType)
summary: "The largest dimension among the fundamental representations of the Lie algebra, by Weyl's formula: an exterior power of the vector representation, or its traceless part, for the classical types."
catalog:
  - system: findstat
    identity: St001370
    url: https://www.findstat.org/St001370
    on: CartanType
statOn:
  - CartanType
signatures:
  - call: LargestFundamentalRepresentationDimension(cartanType)
    description: "The largest dimension among the fundamental representations of the Lie algebra, by Weyl's formula: an exterior power of the vector representation, or its traceless part, for the classical types."
    library: enumeratio-combinatorics
    type: (cartan_type) -> number
---

- Defined over `CartanType` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `CartanType` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
