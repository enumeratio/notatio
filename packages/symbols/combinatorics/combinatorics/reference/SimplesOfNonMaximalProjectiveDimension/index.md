---
name: SimplesOfNonMaximalProjectiveDimension
domain: Dyck path statistics
signature: SimplesOfNonMaximalProjectiveDimension(path)
summary: The simple modules whose projective dimension is less than the global dimension.
catalog:
  - system: findstat
    identity: St001170
    url: https://www.findstat.org/St001170
    on: DyckPath
statOn:
  - DyckPath
signatures:
  - call: SimplesOfNonMaximalProjectiveDimension(path)
    description: The simple modules whose projective dimension is less than the global dimension.
    library: enumeratio-combinatorics
    type: (dyck_path) -> number
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001170 counts the indecomposable injective modules whose socle is such a simple module: there is one injective for each simple socle.
