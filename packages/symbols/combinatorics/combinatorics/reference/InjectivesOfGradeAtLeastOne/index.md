---
name: InjectivesOfGradeAtLeastOne
domain: Dyck path statistics
signature: InjectivesOfGradeAtLeastOne(path)
summary: "The indecomposable injective modules of grade at least one: Hom into the regular module vanishes."
catalog:
  - system: findstat
    identity: St001184
    url: https://www.findstat.org/St001184
    on: DyckPath
statOn:
  - DyckPath
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001184. The grade of a module M is the least i with Ext^i(M, A) nonzero.
