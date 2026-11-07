---
name: FullyCommutativeElementCount
domain: Cartan type statistics
signature: FullyCommutativeElementCount(cartanType)
summary: "The fully commutative elements of the Weyl group: the Catalan number C(n + 1) for A_n, (n + 2) C(n) - 1 for B_n and C_n, (n + 3) C(n) / 2 - 1 for D_n (Stembridge)."
catalog:
  - system: findstat
    identity: St001653
    url: https://www.findstat.org/St001653
    on: CartanType
statOn:
  - CartanType
signatures:
  - call: FullyCommutativeElementCount(cartanType)
    description: "The fully commutative elements of the Weyl group: the Catalan number C(n + 1) for A_n, (n + 2) C(n) - 1 for B_n and C_n, (n + 3) C(n) / 2 - 1 for D_n (Stembridge)."
    library: enumeratio-combinatorics
    type: (cartan_type) -> number
---

- Defined over `CartanType` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `CartanType` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
