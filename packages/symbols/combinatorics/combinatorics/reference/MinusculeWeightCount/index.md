---
name: MinusculeWeightCount
domain: Cartan type statistics
signature: MinusculeWeightCount(cartanType)
summary: "The minuscule dominant weights: the simple roots that appear once in the highest root."
catalog:
  - system: findstat
    identity: St001147
    url: https://www.findstat.org/St001147
    on: CartanType
statOn:
  - CartanType
signatures:
  - call: MinusculeWeightCount(cartanType)
    description: "The minuscule dominant weights: the simple roots that appear once in the highest root."
    library: enumeratio-combinatorics
    type: (cartan_type) -> number
---

- Defined over `CartanType` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `CartanType` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
