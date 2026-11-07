---
name: NonInjectiveProjectivesOfDominantDimensionDifferentFromInjectiveDimension
domain: Dyck path statistics
signature: NonInjectiveProjectivesOfDominantDimensionDifferentFromInjectiveDimension(path)
summary: The indecomposable projective modules that are not injective and whose dominant dimension differs from their injective dimension.
catalog:
  - system: findstat
    identity: St001089
    url: https://www.findstat.org/St001089
    on: DyckPath
statOn:
  - DyckPath
signatures:
  - call: NonInjectiveProjectivesOfDominantDimensionDifferentFromInjectiveDimension(path)
    description: The indecomposable projective modules that are not injective and whose dominant dimension differs from their injective dimension.
    library: enumeratio-combinatorics
    type: (dyck_path) -> number
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001089: the non-injective projectives less those counted by NonInjectiveProjectivesOfDominantDimensionEqualToInjectiveDimension.
