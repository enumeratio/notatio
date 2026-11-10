---
name: WeylGroupGrassmannianElementCount
domain: Cartan type statistics
signature: WeylGroupGrassmannianElementCount(cartanType)
summary: "The elements of the Weyl group with at most one descent: the identity and, for each simple reflection s, the minimal coset representatives for the parabolic subgroup without s, less the identity."
catalog:
  - system: findstat
    identity: St001146
    url: https://www.findstat.org/St001146
    on: CartanType
statOn:
  - CartanType
signatures:
  - call: WeylGroupGrassmannianElementCount(cartanType)
    description: "The elements of the Weyl group with at most one descent: the identity and, for each simple reflection s, the minimal coset representatives for the parabolic subgroup without s, less the identity."
    library: enumeratio-combinatorics
    type: (cartan_type) -> number
---

- Defined over `CartanType` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `CartanType` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- The count is 1 + the sum over s of |W| / |W_(S - s)| - 1; the indices are binomial for A_n (C(n + 1, k)) and 2^k C(n, k) for B_n, C_n and D_n.
