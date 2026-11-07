---
name: SimplesNotInSocleOrOfVanishingFirstExtensionWithRegularModule
domain: Dyck path statistics
signature: SimplesNotInSocleOrOfVanishingFirstExtensionWithRegularModule(path)
summary: The simple modules that are not in the socle of the regular module or have no first extension by the regular module.
catalog:
  - system: findstat
    identity: St001492
    url: https://www.findstat.org/St001492
    on: DyckPath
statOn:
  - DyckPath
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001492. A simple module is in the socle when some indecomposable projective ends at it.
