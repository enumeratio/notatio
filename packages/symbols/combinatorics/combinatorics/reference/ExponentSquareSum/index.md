---
name: ExponentSquareSum
domain: Cartan type statistics
signature: ExponentSquareSum(cartanType)
summary: The sum of the squares of the exponents of the Weyl group.
catalog:
  - system: findstat
    identity: St001680
    url: https://www.findstat.org/St001680
    on: CartanType
statOn:
  - CartanType
signatures:
  - call: ExponentSquareSum(cartanType)
    description: The sum of the squares of the exponents of the Weyl group.
    library: enumeratio-combinatorics
    type: (cartan_type) -> number
---

- Defined over `CartanType` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `CartanType` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
