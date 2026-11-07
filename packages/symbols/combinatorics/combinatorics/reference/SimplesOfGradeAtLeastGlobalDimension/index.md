---
name: SimplesOfGradeAtLeastGlobalDimension
domain: Dyck path statistics
signature: SimplesOfGradeAtLeastGlobalDimension(path)
summary: "The simple modules of grade at least the global dimension: their extensions with the regular module vanish below it."
catalog:
  - system: findstat
    identity: St001191
    url: https://www.findstat.org/St001191
    on: DyckPath
statOn:
  - DyckPath
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001191.
