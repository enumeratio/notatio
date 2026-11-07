---
name: NakayamaFinitisticDominantDimension
domain: Dyck path statistics
signature: NakayamaFinitisticDominantDimension(path)
summary: The greatest finite dominant dimension of an indecomposable module.
catalog:
  - system: findstat
    identity: St000686
    url: https://www.findstat.org/St000686
    on: DyckPath
statOn:
  - DyckPath
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000686. A dominant dimension reaching the vertex count is the infinite one the fold caps at.
