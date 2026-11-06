---
name: ModulesOfVanishingFirstExtensionWithRegularModule
domain: Dyck path statistics
signature: ModulesOfVanishingFirstExtensionWithRegularModule(path)
summary: The indecomposable modules with no first extension by the regular module.
catalog:
  - system: findstat
    identity: St001213
    url: https://www.findstat.org/St001213
    on: DyckPath
statOn:
  - DyckPath
signatures:
  - call: ModulesOfVanishingFirstExtensionWithRegularModule(path)
    description: The indecomposable modules with no first extension by the regular module.
    library: enumeratio-combinatorics
    type: (dyck_path) -> number
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001213. Every indecomposable module is (top v - 1, length 1 .. the series' entry at v).
