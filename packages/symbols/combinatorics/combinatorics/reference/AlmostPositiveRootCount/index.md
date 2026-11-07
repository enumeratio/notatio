---
name: AlmostPositiveRootCount
domain: Cartan type statistics
signature: AlmostPositiveRootCount(cartanType)
summary: "The number of almost positive roots: the positive roots and the negatives of the simple roots."
catalog:
  - system: findstat
    identity: St000853
    url: https://www.findstat.org/St000853
    on: CartanType
statOn:
  - CartanType
signatures:
  - call: AlmostPositiveRootCount(cartanType)
    description: "The number of almost positive roots: the positive roots and the negatives of the simple roots."
    library: enumeratio-combinatorics
    type: (cartan_type) -> number
---

- Defined over `CartanType` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `CartanType` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
