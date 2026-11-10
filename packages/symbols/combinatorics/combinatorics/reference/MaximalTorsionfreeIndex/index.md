---
name: MaximalTorsionfreeIndex
domain: Dyck path statistics
signature: MaximalTorsionfreeIndex(path)
summary: The greatest r for which an indecomposable non-projective module is r-torsionfree, up to the global dimension.
signatures:
  - call: MaximalTorsionfreeIndex(path)
    description: The greatest r for which an indecomposable non-projective module is r-torsionfree, up to the global dimension.
    library: enumeratio-combinatorics
    type: (dyck_path) -> number
catalog:
  - system: findstat
    identity: St001296
    url: https://www.findstat.org/St001296
    on: DyckPath
statOn:
  - DyckPath
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001296.
