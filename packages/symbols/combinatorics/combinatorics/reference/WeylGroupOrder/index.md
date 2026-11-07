---
name: WeylGroupOrder
domain: Cartan type statistics
signature: WeylGroupOrder(cartanType)
summary: "The size of the Weyl group of the type: the product of its degrees."
catalog:
  - system: findstat
    identity: St000106
    url: https://www.findstat.org/St000106
    on: CartanType
statOn:
  - CartanType
signatures:
  - call: WeylGroupOrder(cartanType)
    description: "The size of the Weyl group of the type: the product of its degrees."
    library: enumeratio-combinatorics
    type: (cartan_type) -> number
---

- Defined over `CartanType` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `CartanType` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- Humphreys, Reflection Groups and Coxeter Groups, section 3.7 and the table of section 2.11.
