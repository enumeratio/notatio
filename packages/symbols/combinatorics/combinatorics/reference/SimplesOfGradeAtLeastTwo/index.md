---
name: SimplesOfGradeAtLeastTwo
domain: Dyck path statistics
signature: SimplesOfGradeAtLeastTwo(path)
summary: The simple modules of grade at least two.
catalog:
  - system: findstat
    identity: St001188
    url: https://www.findstat.org/St001188
    on: DyckPath
  - system: findstat
    identity: St001244
    url: https://www.findstat.org/St001244
    on: DyckPath
statOn:
  - DyckPath
signatures:
  - call: SimplesOfGradeAtLeastTwo(path)
    description: The simple modules of grade at least two.
    library: enumeratio-combinatorics
    type: (dyck_path) -> number
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001188, and St001244 (the simples of projective dimension one that are not 1-regular), which has the same values on every path of semilength 8 or less.
