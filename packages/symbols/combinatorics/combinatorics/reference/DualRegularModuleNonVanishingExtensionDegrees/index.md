---
name: DualRegularModuleNonVanishingExtensionDegrees
domain: Dyck path statistics
signature: DualRegularModuleNonVanishingExtensionDegrees(path)
summary: The degrees i from 1 to the global dimension at which the extensions of the direct sum of the indecomposable injective modules by the regular module do not vanish.
catalog:
  - system: findstat
    identity: St000955
    url: https://www.findstat.org/St000955
    on: DyckPath
statOn:
  - DyckPath
signatures:
  - call: DualRegularModuleNonVanishingExtensionDegrees(path)
    description: The degrees i from 1 to the global dimension at which the extensions of the direct sum of the indecomposable injective modules by the regular module do not vanish.
    library: enumeratio-combinatorics
    type: (dyck_path) -> number
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000955.
