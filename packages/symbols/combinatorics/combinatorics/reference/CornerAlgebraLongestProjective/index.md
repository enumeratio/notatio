---
name: CornerAlgebraLongestProjective
domain: Dyck path statistics
signature: CornerAlgebraLongestProjective(path)
summary: The greatest dimension of an indecomposable projective module of the corner algebra eAe, the height of its Dyck path.
signatures:
  - call: CornerAlgebraLongestProjective(path)
    description: The greatest dimension of an indecomposable projective module of the corner algebra eAe, the height of its Dyck path.
    library: enumeratio-combinatorics
    type: (dyck_path) -> number
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001206. The towers, whose corner algebra is the field, have 1.
