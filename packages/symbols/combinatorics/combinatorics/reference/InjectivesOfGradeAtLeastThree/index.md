---
name: InjectivesOfGradeAtLeastThree
domain: Dyck path statistics
signature: InjectivesOfGradeAtLeastThree(path)
summary: The indecomposable injective modules of grade at least three.
catalog:
  - system: findstat
    identity: St001181
    url: https://www.findstat.org/St001181
    on: DyckPath
statOn:
  - DyckPath
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001181.
