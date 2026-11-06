---
name: WeylGroupExponents
domain: Cartan type statistics
signature: WeylGroupExponents(cartanType)
summary: "The exponents of the Weyl group of the type: one less than each degree."
signatures:
  - call: WeylGroupExponents(cartanType)
    description: "The exponents of the Weyl group of the type: one less than each degree."
    library: enumeratio-combinatorics
    type: (cartan_type) -> list<integer>
---

- Defined over `CartanType` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `CartanType` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
