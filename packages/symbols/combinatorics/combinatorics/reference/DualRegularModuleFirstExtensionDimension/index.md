---
name: DualRegularModuleFirstExtensionDimension
domain: Dyck path statistics
signature: DualRegularModuleFirstExtensionDimension(path)
summary: The dimension of the first extensions of the direct sum of the indecomposable injective modules by the regular module.
catalog:
  - system: findstat
    identity: St000951
    url: https://www.findstat.org/St000951
    on: DyckPath
statOn:
  - DyckPath
signatures:
  - call: DualRegularModuleFirstExtensionDimension(path)
    description: The dimension of the first extensions of the direct sum of the indecomposable injective modules by the regular module.
    library: enumeratio-combinatorics
    type: (dyck_path) -> number
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000951: the dimension of Ext^1(D(A), A). Ext^1 of an interval module is read off the maps from its syzygy and its projective cover.
