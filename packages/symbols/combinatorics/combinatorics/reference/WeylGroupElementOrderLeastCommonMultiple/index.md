---
name: WeylGroupElementOrderLeastCommonMultiple
domain: Cartan type statistics
signature: WeylGroupElementOrderLeastCommonMultiple(cartanType)
summary: "The exponent of the Weyl group, the least common multiple of the orders of its elements: the least common multiple of its degrees."
catalog:
  - system: findstat
    identity: St001157
    url: https://www.findstat.org/St001157
    on: CartanType
statOn:
  - CartanType
signatures:
  - call: WeylGroupElementOrderLeastCommonMultiple(cartanType)
    description: "The exponent of the Weyl group, the least common multiple of the orders of its elements: the least common multiple of its degrees."
    library: enumeratio-combinatorics
    type: (cartan_type) -> number
---

- Defined over `CartanType` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `CartanType` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- For A_n the orders are the cycle lengths, for B_n and C_n the cycle lengths and twice them (a negative cycle doubles its length), for D_n the same with an even number of negative cycles; each case is the least common multiple of the degrees, and the exceptional types are checked against their element orders.
