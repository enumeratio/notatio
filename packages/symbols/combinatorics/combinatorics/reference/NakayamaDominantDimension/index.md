---
name: NakayamaDominantDimension
domain: Dyck path statistics
signature: NakayamaDominantDimension(path)
summary: The dominant dimension of the path's linear Nakayama algebra.
catalog:
  - system: findstat
    identity: St000685
    url: https://www.findstat.org/St000685
    on: DyckPath
statOn:
  - DyckPath
signatures:
  - call: NakayamaDominantDimension(path)
    description: The dominant dimension of the path's linear Nakayama algebra.
    library: enumeratio-combinatorics
    type: (dyck_path) -> number
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000685. An algebra and its opposite have the same dominant dimension, which for the opposite is the least codominant dimension of a non-projective indecomposable injective module.
