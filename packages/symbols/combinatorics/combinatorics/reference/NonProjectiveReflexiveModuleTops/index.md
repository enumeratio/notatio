---
name: NonProjectiveReflexiveModuleTops
domain: Dyck path statistics
signature: NonProjectiveReflexiveModuleTops(path)
summary: The simple modules that are the top of an indecomposable non-projective reflexive module.
signatures:
  - call: NonProjectiveReflexiveModuleTops(path)
    description: The simple modules that are the top of an indecomposable non-projective reflexive module.
    library: enumeratio-combinatorics
    type: (dyck_path) -> number
catalog:
  - system: findstat
    identity: St001167
    url: https://www.findstat.org/St001167
    on: DyckPath
statOn:
  - DyckPath
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001167.
