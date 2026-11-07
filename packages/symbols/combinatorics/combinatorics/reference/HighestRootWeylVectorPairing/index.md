---
name: HighestRootWeylVectorPairing
domain: Cartan type statistics
signature: HighestRootWeylVectorPairing(cartanType)
summary: The symmetric bilinear form of the highest root with the Weyl vector, normalized so that the shortest roots have squared length 2.
catalog:
  - system: findstat
    identity: St001678
    url: https://www.findstat.org/St001678
    on: CartanType
statOn:
  - CartanType
signatures:
  - call: HighestRootWeylVectorPairing(cartanType)
    description: The symmetric bilinear form of the highest root with the Weyl vector, normalized so that the shortest roots have squared length 2.
    library: enumeratio-combinatorics
    type: (cartan_type) -> number
---

- Defined over `CartanType` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `CartanType` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
