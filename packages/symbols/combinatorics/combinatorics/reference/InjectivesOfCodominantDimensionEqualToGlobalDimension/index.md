---
name: InjectivesOfCodominantDimensionEqualToGlobalDimension
domain: Dyck path statistics
signature: InjectivesOfCodominantDimensionEqualToGlobalDimension(path)
summary: The indecomposable injective modules whose codominant dimension is the global dimension.
catalog:
  - system: findstat
    identity: St001013
    url: https://www.findstat.org/St001013
    on: DyckPath
statOn:
  - DyckPath
signatures:
  - call: InjectivesOfCodominantDimensionEqualToGlobalDimension(path)
    description: The indecomposable injective modules whose codominant dimension is the global dimension.
    library: enumeratio-combinatorics
    type: (dyck_path) -> number
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- A projective-injective module has infinite codominant dimension, so it is never counted.
