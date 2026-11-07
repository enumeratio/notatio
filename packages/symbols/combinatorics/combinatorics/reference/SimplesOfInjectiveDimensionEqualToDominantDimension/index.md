---
name: SimplesOfInjectiveDimensionEqualToDominantDimension
domain: Dyck path statistics
signature: SimplesOfInjectiveDimensionEqualToDominantDimension(path)
summary: The simple modules whose injective dimension equals their dominant dimension.
catalog:
  - system: findstat
    identity: St001028
    url: https://www.findstat.org/St001028
    on: DyckPath
statOn:
  - DyckPath
signatures:
  - call: SimplesOfInjectiveDimensionEqualToDominantDimension(path)
    description: The simple modules whose injective dimension equals their dominant dimension.
    library: enumeratio-combinatorics
    type: (dyck_path) -> number
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001028, read with the dominant dimension of the module itself: that is the reading its rows follow.
