---
name: ProjectivesOfMaximalInjectiveDimension
domain: Dyck path statistics
signature: ProjectivesOfMaximalInjectiveDimension(path)
summary: The indecomposable projective modules whose injective dimension is the global dimension.
catalog:
  - system: findstat
    identity: St000999
    url: https://www.findstat.org/St000999
    on: DyckPath
statOn:
  - DyckPath
signatures:
  - call: ProjectivesOfMaximalInjectiveDimension(path)
    description: The indecomposable projective modules whose injective dimension is the global dimension.
    library: enumeratio-combinatorics
    type: (dyck_path) -> number
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000999.
