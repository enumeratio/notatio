---
name: SimplesOfEqualProjectiveAndInjectiveDimension
domain: Dyck path statistics
signature: SimplesOfEqualProjectiveAndInjectiveDimension(path)
summary: The simple modules whose projective dimension equals their injective dimension.
catalog:
  - system: findstat
    identity: St001027
    url: https://www.findstat.org/St001027
    on: DyckPath
statOn:
  - DyckPath
signatures:
  - call: SimplesOfEqualProjectiveAndInjectiveDimension(path)
    description: The simple modules whose projective dimension equals their injective dimension.
    library: enumeratio-combinatorics
    type: (dyck_path) -> number
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
