---
name: RootPosetRowmotionOrder
domain: Cartan type statistics
signature: RootPosetRowmotionOrder(cartanType)
summary: "The order of rowmotion on the root poset: h where -1 is in the Weyl group, else 2 h."
catalog:
  - system: findstat
    identity: St001887
    url: https://www.findstat.org/St001887
    on: CartanType
statOn:
  - CartanType
signatures:
  - call: RootPosetRowmotionOrder(cartanType)
    description: "The order of rowmotion on the root poset: h where -1 is in the Weyl group, else 2 h."
    library: enumeratio-combinatorics
    type: (cartan_type) -> number
---

- Defined over `CartanType` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `CartanType` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
