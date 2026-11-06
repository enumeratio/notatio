---
name: CommutativePositiveRootCount
domain: Cartan type statistics
signature: CommutativePositiveRootCount(cartanType)
summary: "The commutative positive roots: those whose upper ideal in the root poset is abelian."
catalog:
  - system: findstat
    identity: St001173
    url: https://www.findstat.org/St001173
    on: CartanType
statOn:
  - CartanType
signatures:
  - call: CommutativePositiveRootCount(cartanType)
    description: "The commutative positive roots: those whose upper ideal in the root poset is abelian."
    library: enumeratio-combinatorics
    type: (cartan_type) -> number
---

- Defined over `CartanType` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `CartanType` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
