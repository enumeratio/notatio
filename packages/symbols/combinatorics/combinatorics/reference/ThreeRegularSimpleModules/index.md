---
name: ThreeRegularSimpleModules
domain: Dyck path statistics
signature: ThreeRegularSimpleModules(path)
summary: The simple modules that are 3-regular.
catalog:
  - system: findstat
    identity: St001137
    url: https://www.findstat.org/St001137
    on: DyckPath
statOn:
  - DyckPath
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001137.
