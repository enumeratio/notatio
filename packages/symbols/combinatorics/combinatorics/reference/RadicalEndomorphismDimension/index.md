---
name: RadicalEndomorphismDimension
domain: Dyck path statistics
signature: RadicalEndomorphismDimension(path)
summary: The dimension of the endomorphisms of the Jacobson radical of the path's linear Nakayama algebra.
catalog:
  - system: findstat
    identity: St001228
    url: https://www.findstat.org/St001228
    on: DyckPath
statOn:
  - DyckPath
signatures:
  - call: RadicalEndomorphismDimension(path)
    description: The dimension of the endomorphisms of the Jacobson radical of the path's linear Nakayama algebra.
    library: enumeratio-combinatorics
    type: (dyck_path) -> number
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001228. The radical is the sum of the radicals of the indecomposable projectives.
