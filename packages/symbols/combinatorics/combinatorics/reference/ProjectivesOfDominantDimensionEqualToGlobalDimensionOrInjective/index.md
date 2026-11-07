---
name: ProjectivesOfDominantDimensionEqualToGlobalDimensionOrInjective
domain: Dyck path statistics
signature: ProjectivesOfDominantDimensionEqualToGlobalDimensionOrInjective(path)
summary: The indecomposable projective modules that are injective or whose dominant dimension is the global dimension.
catalog:
  - system: findstat
    identity: St001166
    url: https://www.findstat.org/St001166
    on: DyckPath
statOn:
  - DyckPath
signatures:
  - call: ProjectivesOfDominantDimensionEqualToGlobalDimensionOrInjective(path)
    description: The indecomposable projective modules that are injective or whose dominant dimension is the global dimension.
    library: enumeratio-combinatorics
    type: (dyck_path) -> number
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001166. A projective-injective module has dominant dimension past the global dimension, so the two cases do not overlap.
