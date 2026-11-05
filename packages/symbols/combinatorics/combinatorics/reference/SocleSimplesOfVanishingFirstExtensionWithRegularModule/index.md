---
name: SocleSimplesOfVanishingFirstExtensionWithRegularModule
domain: Dyck path statistics
signature: SocleSimplesOfVanishingFirstExtensionWithRegularModule(path)
summary: The simple modules in the socle of the regular module that have no first extension by the regular module.
catalog:
  - system: findstat
    identity: St001483
    url: https://www.findstat.org/St001483
    on: DyckPath
statOn:
  - DyckPath
signatures:
  - call: SocleSimplesOfVanishingFirstExtensionWithRegularModule(path)
    description: The simple modules in the socle of the regular module that have no first extension by the regular module.
    library: enumeratio-combinatorics
    type: (dyck_path) -> number
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001483. A simple module is in the socle when some indecomposable projective ends at it.
