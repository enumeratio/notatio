---
name: ProjectiveSquaredRadicalsOfInjectiveDimensionAtMostOne
domain: Dyck path statistics
signature: ProjectiveSquaredRadicalsOfInjectiveDimensionAtMostOne(path)
summary: The indecomposable projective modules whose square radical, zero included, has injective dimension at most one.
catalog:
  - system: findstat
    identity: St001240
    url: https://www.findstat.org/St001240
    on: DyckPath
statOn:
  - DyckPath
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001240: the modules e_i J^2, the zero ones included.
