---
name: SimplesOfVanishingSecondExtensionWithRegularModule
domain: Dyck path statistics
signature: SimplesOfVanishingSecondExtensionWithRegularModule(path)
summary: The simple modules with no second extension by the regular module.
catalog:
  - system: findstat
    identity: St001211
    url: https://www.findstat.org/St001211
    on: DyckPath
statOn:
  - DyckPath
signatures:
  - call: SimplesOfVanishingSecondExtensionWithRegularModule(path)
    description: The simple modules with no second extension by the regular module.
    library: enumeratio-combinatorics
    type: (dyck_path) -> number
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001211.
