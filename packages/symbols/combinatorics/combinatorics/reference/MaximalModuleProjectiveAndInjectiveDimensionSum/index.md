---
name: MaximalModuleProjectiveAndInjectiveDimensionSum
domain: Dyck path statistics
signature: MaximalModuleProjectiveAndInjectiveDimensionSum(path)
summary: The greatest sum of the projective and the injective dimension of an indecomposable module.
catalog:
  - system: findstat
    identity: St001258
    url: https://www.findstat.org/St001258
    on: DyckPath
statOn:
  - DyckPath
signatures:
  - call: MaximalModuleProjectiveAndInjectiveDimensionSum(path)
    description: The greatest sum of the projective and the injective dimension of an indecomposable module.
    library: enumeratio-combinatorics
    type: (dyck_path) -> number
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
