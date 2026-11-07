---
name: DualRegularModuleVanishingExtensionDegrees
domain: Dyck path statistics
signature: DualRegularModuleVanishingExtensionDegrees(path)
summary: The degrees i from 1 to the global dimension at which the extensions of the direct sum of the indecomposable injective modules by the regular module vanish.
catalog:
  - system: findstat
    identity: St000954
    url: https://www.findstat.org/St000954
    on: DyckPath
statOn:
  - DyckPath
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000954. Ext^i(D(A), A) is Ext^1 of the (i - 1)-th syzygy.
