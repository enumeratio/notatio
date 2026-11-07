---
name: DualRegularModuleTopExtensionDimension
domain: Dyck path statistics
signature: DualRegularModuleTopExtensionDimension(path)
summary: The dimension of the extensions in the global dimension of the direct sum of the indecomposable injective modules by the regular module.
catalog:
  - system: findstat
    identity: St000964
    url: https://www.findstat.org/St000964
    on: DyckPath
statOn:
  - DyckPath
signatures:
  - call: DualRegularModuleTopExtensionDimension(path)
    description: The dimension of the extensions in the global dimension of the direct sum of the indecomposable injective modules by the regular module.
    library: enumeratio-combinatorics
    type: (dyck_path) -> number
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000964.
