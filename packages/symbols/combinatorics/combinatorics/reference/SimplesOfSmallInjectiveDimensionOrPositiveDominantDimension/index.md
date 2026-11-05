---
name: SimplesOfSmallInjectiveDimensionOrPositiveDominantDimension
domain: Dyck path statistics
signature: SimplesOfSmallInjectiveDimensionOrPositiveDominantDimension(path)
summary: The simple modules whose injective dimension is at most one or whose dominant dimension is at least one.
catalog:
  - system: findstat
    identity: St001237
    url: https://www.findstat.org/St001237
    on: DyckPath
statOn:
  - DyckPath
signatures:
  - call: SimplesOfSmallInjectiveDimensionOrPositiveDominantDimension(path)
    description: The simple modules whose injective dimension is at most one or whose dominant dimension is at least one.
    library: enumeratio-combinatorics
    type: (dyck_path) -> number
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
