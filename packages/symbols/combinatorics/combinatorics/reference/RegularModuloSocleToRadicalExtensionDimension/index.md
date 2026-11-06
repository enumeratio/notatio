---
name: RegularModuloSocleToRadicalExtensionDimension
domain: Dyck path statistics
signature: RegularModuloSocleToRadicalExtensionDimension(path)
summary: The dimension of the first extensions of the regular module modulo its socle by the Jacobson radical.
catalog:
  - system: findstat
    identity: St001254
    url: https://www.findstat.org/St001254
    on: DyckPath
statOn:
  - DyckPath
signatures:
  - call: RegularModuloSocleToRadicalExtensionDimension(path)
    description: The dimension of the first extensions of the regular module modulo its socle by the Jacobson radical.
    library: enumeratio-combinatorics
    type: (dyck_path) -> number
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001254.
