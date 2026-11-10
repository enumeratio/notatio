---
name: NakayamaGlobalMinusCornerGlobalDimension
domain: Dyck path statistics
signature: NakayamaGlobalMinusCornerGlobalDimension(path)
summary: The global dimension of the path's linear Nakayama algebra less that of its corner algebra eAe.
signatures:
  - call: NakayamaGlobalMinusCornerGlobalDimension(path)
    description: The global dimension of the path's linear Nakayama algebra less that of its corner algebra eAe.
    library: enumeratio-combinatorics
    type: (dyck_path) -> number
catalog:
  - system: findstat
    identity: St001196
    url: https://www.findstat.org/St001196
    on: DyckPath
statOn:
  - DyckPath
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001196.
