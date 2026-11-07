---
name: GammaNumber
domain: Cartan type statistics
signature: GammaNumber(cartanType)
summary: "The gamma number of the Weyl group, from the sum of the squares of its exponents e: γ = 6 Σ e² / n - h² + h."
catalog:
  - system: findstat
    identity: St001676
    url: https://www.findstat.org/St001676
    on: CartanType
statOn:
  - CartanType
signatures:
  - call: GammaNumber(cartanType)
    description: "The gamma number of the Weyl group, from the sum of the squares of its exponents e: γ = 6 Σ e² / n - h² + h."
    library: enumeratio-combinatorics
    type: (cartan_type) -> number
---

- Defined over `CartanType` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `CartanType` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
