---
name: SimplesOfGradeAtLeastThree
domain: Dyck path statistics
signature: SimplesOfGradeAtLeastThree(path)
summary: The simple modules of grade at least three.
catalog:
  - system: findstat
    identity: St001186
    url: https://www.findstat.org/St001186
    on: DyckPath
statOn:
  - DyckPath
signatures:
  - call: SimplesOfGradeAtLeastThree(path)
    description: The simple modules of grade at least three.
    library: enumeratio-combinatorics
    type: (dyck_path) -> number
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001186.
