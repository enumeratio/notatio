---
name: ProjectivesOfInjectiveDimensionAtMostDominantDimension
domain: Dyck path statistics
signature: ProjectivesOfInjectiveDimensionAtMostDominantDimension(path)
summary: The indecomposable projective modules whose injective dimension is at most their dominant dimension.
catalog:
  - system: findstat
    identity: St000998
    url: https://www.findstat.org/St000998
    on: DyckPath
statOn:
  - DyckPath
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000998, read with the dominant dimension of the module itself: that is the reading its rows follow.
