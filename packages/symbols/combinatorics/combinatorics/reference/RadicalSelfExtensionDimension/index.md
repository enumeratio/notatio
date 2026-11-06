---
name: RadicalSelfExtensionDimension
domain: Dyck path statistics
signature: RadicalSelfExtensionDimension(path)
summary: The dimension of the first extensions of the Jacobson radical by itself.
catalog:
  - system: findstat
    identity: St001225
    url: https://www.findstat.org/St001225
    on: DyckPath
statOn:
  - DyckPath
signatures:
  - call: RadicalSelfExtensionDimension(path)
    description: The dimension of the first extensions of the Jacobson radical by itself.
    library: enumeratio-combinatorics
    type: (dyck_path) -> number
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001225.
