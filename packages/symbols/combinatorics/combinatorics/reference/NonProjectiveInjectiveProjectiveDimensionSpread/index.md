---
name: NonProjectiveInjectiveProjectiveDimensionSpread
domain: Dyck path statistics
signature: NonProjectiveInjectiveProjectiveDimensionSpread(path)
summary: The difference between the greatest and the least projective dimension of a non-projective indecomposable injective module.
catalog:
  - system: findstat
    identity: St001026
    url: https://www.findstat.org/St001026
    on: DyckPath
statOn:
  - DyckPath
signatures:
  - call: NonProjectiveInjectiveProjectiveDimensionSpread(path)
    description: The difference between the greatest and the least projective dimension of a non-projective indecomposable injective module.
    library: enumeratio-combinatorics
    type: (dyck_path) -> number
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
