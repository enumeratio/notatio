---
name: SimpleModulesSecondExtensionWithRegularModuleDimension
domain: Dyck path statistics
signature: SimpleModulesSecondExtensionWithRegularModuleDimension(path)
summary: The dimension of the second extensions of the direct sum of the simple modules by the regular module.
catalog:
  - system: findstat
    identity: St001215
    url: https://www.findstat.org/St001215
    on: DyckPath
statOn:
  - DyckPath
signatures:
  - call: SimpleModulesSecondExtensionWithRegularModuleDimension(path)
    description: The dimension of the second extensions of the direct sum of the simple modules by the regular module.
    library: enumeratio-combinatorics
    type: (dyck_path) -> number
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001215.
