---
name: SimpleReflexiveModules
domain: Dyck path statistics
signature: SimpleReflexiveModules(path)
summary: The simple modules of the path's linear Nakayama algebra that are reflexive.
signatures:
  - call: SimpleReflexiveModules(path)
    description: The simple modules of the path's linear Nakayama algebra that are reflexive.
    library: enumeratio-combinatorics
    type: (dyck_path) -> number
catalog:
  - system: findstat
    identity: St001066
    url: https://www.findstat.org/St001066
    on: DyckPath
statOn:
  - DyckPath
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001066.
