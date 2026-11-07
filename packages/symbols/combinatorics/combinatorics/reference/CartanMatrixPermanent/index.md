---
name: CartanMatrixPermanent
domain: Cartan type statistics
signature: CartanMatrixPermanent(cartanType)
summary: "The permanent of the Cartan matrix: the sum over the ways to choose one entry from each row and column."
catalog:
  - system: findstat
    identity: St000960
    url: https://www.findstat.org/St000960
    on: CartanType
statOn:
  - CartanType
signatures:
  - call: CartanMatrixPermanent(cartanType)
    description: "The permanent of the Cartan matrix: the sum over the ways to choose one entry from each row and column."
    library: enumeratio-combinatorics
    type: (cartan_type) -> number
---

- Defined over `CartanType` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `CartanType` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- The table has 2^n entries, so the build checks compiled code against the interpreter up to rank 7.
