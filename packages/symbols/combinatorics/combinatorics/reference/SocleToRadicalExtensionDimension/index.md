---
name: SocleToRadicalExtensionDimension
domain: Dyck path statistics
signature: SocleToRadicalExtensionDimension(path)
summary: The dimension of the first extensions of the socle of the regular module by the Jacobson radical.
catalog:
  - system: findstat
    identity: St001227
    url: https://www.findstat.org/St001227
    on: DyckPath
statOn:
  - DyckPath
signatures:
  - call: SocleToRadicalExtensionDimension(path)
    description: The dimension of the first extensions of the socle of the regular module by the Jacobson radical.
    library: enumeratio-combinatorics
    type: (dyck_path) -> number
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001227.
