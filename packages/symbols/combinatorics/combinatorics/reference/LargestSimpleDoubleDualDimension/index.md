---
name: LargestSimpleDoubleDualDimension
domain: Dyck path statistics
signature: LargestSimpleDoubleDualDimension(path)
summary: The greatest dimension of the double dual of a simple module of the path's linear Nakayama algebra.
signatures:
  - call: LargestSimpleDoubleDualDimension(path)
    description: The greatest dimension of the double dual of a simple module of the path's linear Nakayama algebra.
    library: enumeratio-combinatorics
    type: (dyck_path) -> number
catalog:
  - system: findstat
    identity: St001239
    url: https://www.findstat.org/St001239
    on: DyckPath
statOn:
  - DyckPath
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001239. The dual of a module is the maps into the regular module, and the double dual the maps from that into it.
