---
name: MaximalSimpleDominantDimension
domain: Dyck path statistics
signature: MaximalSimpleDominantDimension(path)
summary: The greatest dominant dimension of a simple module.
catalog:
  - system: findstat
    identity: St001024
    url: https://www.findstat.org/St001024
    on: DyckPath
statOn:
  - DyckPath
signatures:
  - call: MaximalSimpleDominantDimension(path)
    description: The greatest dominant dimension of a simple module.
    library: enumeratio-combinatorics
    type: (dyck_path) -> number
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
