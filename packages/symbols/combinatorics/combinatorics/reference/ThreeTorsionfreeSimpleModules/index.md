---
name: ThreeTorsionfreeSimpleModules
domain: Dyck path statistics
signature: ThreeTorsionfreeSimpleModules(path)
summary: "The simple modules of the path's linear Nakayama algebra that are 3-torsionfree: Ext^i(D(A), tau S) vanishes for i = 1, 2, 3."
signatures:
  - call: ThreeTorsionfreeSimpleModules(path)
    description: "The simple modules of the path's linear Nakayama algebra that are 3-torsionfree: Ext^i(D(A), tau S) vanishes for i = 1, 2, 3."
    library: enumeratio-combinatorics
    type: (dyck_path) -> number
catalog:
  - system: findstat
    identity: St001063
    url: https://www.findstat.org/St001063
    on: DyckPath
statOn:
  - DyckPath
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001063.
