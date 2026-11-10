---
name: WeylGroupInvolutionCount
domain: Cartan type statistics
signature: WeylGroupInvolutionCount(cartanType)
summary: "The elements of the Weyl group that are their own inverse, the identity included: the telephone numbers for A_n, and for B_n, C_n and D_n the coefficients of exp(x^2 + 2x) and exp(x^2) (exp(2x) + 1) / 2."
catalog:
  - system: findstat
    identity: St001467
    url: https://www.findstat.org/St001467
    on: CartanType
statOn:
  - CartanType
signatures:
  - call: WeylGroupInvolutionCount(cartanType)
    description: "The elements of the Weyl group that are their own inverse, the identity included: the telephone numbers for A_n, and for B_n, C_n and D_n the coefficients of exp(x^2 + 2x) and exp(x^2) (exp(2x) + 1) / 2."
    library: enumeratio-combinatorics
    type: (cartan_type) -> number
---

- Defined over `CartanType` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `CartanType` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- The E_6, E_7 and E_8 counts are of the elements fixing every vector of a root-spanned subspace and negating its complement: 892 = 1 + 36 + 270 + 540 + 45.
