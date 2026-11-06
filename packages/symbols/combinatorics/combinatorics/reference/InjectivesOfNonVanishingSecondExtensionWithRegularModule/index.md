---
name: InjectivesOfNonVanishingSecondExtensionWithRegularModule
domain: Dyck path statistics
signature: InjectivesOfNonVanishingSecondExtensionWithRegularModule(path)
summary: The indecomposable injective modules with a nonzero second extension by the regular module.
catalog:
  - system: findstat
    identity: St001216
    url: https://www.findstat.org/St001216
    on: DyckPath
statOn:
  - DyckPath
signatures:
  - call: InjectivesOfNonVanishingSecondExtensionWithRegularModule(path)
    description: The indecomposable injective modules with a nonzero second extension by the regular module.
    library: enumeratio-combinatorics
    type: (dyck_path) -> number
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001216.
