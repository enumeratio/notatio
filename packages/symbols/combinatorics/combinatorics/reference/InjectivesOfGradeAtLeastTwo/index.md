---
name: InjectivesOfGradeAtLeastTwo
domain: Dyck path statistics
signature: InjectivesOfGradeAtLeastTwo(path)
summary: The indecomposable injective modules of grade at least two.
catalog:
  - system: findstat
    identity: St001185
    url: https://www.findstat.org/St001185
    on: DyckPath
statOn:
  - DyckPath
signatures:
  - call: InjectivesOfGradeAtLeastTwo(path)
    description: The indecomposable injective modules of grade at least two.
    library: enumeratio-combinatorics
    type: (dyck_path) -> number
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001185.
