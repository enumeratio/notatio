---
name: CornerAlgebraDominantDimension
domain: Dyck path statistics
signature: CornerAlgebraDominantDimension(path)
summary: The dominant dimension of the corner algebra eAe of the path's linear Nakayama algebra, e the idempotent of its minimal faithful projective-injective module.
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001199. A corner algebra with no non-projective injective module is self-injective, and has infinite dominant dimension: the towers, whose corner algebra is the field.
