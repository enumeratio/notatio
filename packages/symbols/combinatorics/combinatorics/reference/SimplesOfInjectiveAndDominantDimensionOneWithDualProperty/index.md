---
name: SimplesOfInjectiveAndDominantDimensionOneWithDualProperty
domain: Dyck path statistics
signature: SimplesOfInjectiveAndDominantDimensionOneWithDualProperty(path)
summary: The simple modules whose injective and dominant dimensions are both one and whose projective and codominant dimensions are both one.
catalog:
  - system: findstat
    identity: St001230
    url: https://www.findstat.org/St001230
    on: DyckPath
statOn:
  - DyckPath
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001230.
