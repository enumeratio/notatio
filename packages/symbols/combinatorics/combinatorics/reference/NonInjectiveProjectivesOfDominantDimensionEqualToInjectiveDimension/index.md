---
name: NonInjectiveProjectivesOfDominantDimensionEqualToInjectiveDimension
domain: Dyck path statistics
signature: NonInjectiveProjectivesOfDominantDimensionEqualToInjectiveDimension(path)
summary: The indecomposable projective modules that are not injective and whose dominant dimension equals their injective dimension.
catalog:
  - system: findstat
    identity: St001088
    url: https://www.findstat.org/St001088
    on: DyckPath
statOn:
  - DyckPath
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001088.
