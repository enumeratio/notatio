---
name: SimplesOfNonVanishingSecondExtensionWithRegularModule
domain: Dyck path statistics
signature: SimplesOfNonVanishingSecondExtensionWithRegularModule(path)
summary: The simple modules with a nonzero second extension by the regular module.
catalog:
  - system: findstat
    identity: St001212
    url: https://www.findstat.org/St001212
    on: DyckPath
statOn:
  - DyckPath
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001212.
