---
name: MaximalSimpleProjectiveAndInjectiveDimensionSum
domain: Dyck path statistics
signature: MaximalSimpleProjectiveAndInjectiveDimensionSum(path)
summary: The greatest sum of the projective and the injective dimension of a simple module.
catalog:
  - system: findstat
    identity: St001183
    url: https://www.findstat.org/St001183
    on: DyckPath
statOn:
  - DyckPath
signatures:
  - call: MaximalSimpleProjectiveAndInjectiveDimensionSum(path)
    description: The greatest sum of the projective and the injective dimension of a simple module.
    library: enumeratio-combinatorics
    type: (dyck_path) -> number
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
