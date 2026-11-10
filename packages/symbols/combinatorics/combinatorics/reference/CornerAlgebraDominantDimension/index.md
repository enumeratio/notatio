---
name: CornerAlgebraDominantDimension
domain: Dyck path statistics
signature: CornerAlgebraDominantDimension(path)
summary: The dominant dimension of the corner algebra eAe of the path's linear Nakayama algebra, e the idempotent of its minimal faithful projective-injective module.
signatures:
  - call: CornerAlgebraDominantDimension(path)
    description: The dominant dimension of the corner algebra eAe of the path's linear Nakayama algebra, e the idempotent of its minimal faithful projective-injective module.
    library: enumeratio-combinatorics
    type: (dyck_path) -> number
catalog:
  - system: findstat
    identity: St001199
    url: https://www.findstat.org/St001199
    on: DyckPath
statOn:
  - DyckPath
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001199. A corner algebra with no non-projective injective module is self-injective, and has infinite dominant dimension: the towers, whose corner algebra is the field.
