---
name: WeylGroupCenterOrder
domain: Cartan type statistics
signature: WeylGroupCenterOrder(cartanType)
summary: "The size of the center of the Weyl group: 2 when -1 is in the group (every degree is even), else 1."
catalog:
  - system: findstat
    identity: St000860
    url: https://www.findstat.org/St000860
    on: CartanType
statOn:
  - CartanType
signatures:
  - call: WeylGroupCenterOrder(cartanType)
    description: "The size of the center of the Weyl group: 2 when -1 is in the group (every degree is even), else 1."
    library: enumeratio-combinatorics
    type: (cartan_type) -> number
---

- Defined over `CartanType` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `CartanType` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
