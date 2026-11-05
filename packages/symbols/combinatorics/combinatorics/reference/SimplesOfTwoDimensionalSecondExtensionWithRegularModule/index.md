---
name: SimplesOfTwoDimensionalSecondExtensionWithRegularModule
domain: Dyck path statistics
signature: SimplesOfTwoDimensionalSecondExtensionWithRegularModule(path)
summary: The simple modules whose second extensions by the regular module have dimension two.
catalog:
  - system: findstat
    identity: St001221
    url: https://www.findstat.org/St001221
    on: DyckPath
statOn:
  - DyckPath
signatures:
  - call: SimplesOfTwoDimensionalSecondExtensionWithRegularModule(path)
    description: The simple modules whose second extensions by the regular module have dimension two.
    library: enumeratio-combinatorics
    type: (dyck_path) -> number
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001221.
