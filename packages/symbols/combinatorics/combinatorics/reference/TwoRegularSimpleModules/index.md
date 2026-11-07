---
name: TwoRegularSimpleModules
domain: Dyck path statistics
signature: TwoRegularSimpleModules(path)
summary: The simple modules that are 2-regular.
catalog:
  - system: findstat
    identity: St001125
    url: https://www.findstat.org/St001125
    on: DyckPath
statOn:
  - DyckPath
signatures:
  - call: TwoRegularSimpleModules(path)
    description: The simple modules that are 2-regular.
    library: enumeratio-combinatorics
    type: (dyck_path) -> number
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001125.
