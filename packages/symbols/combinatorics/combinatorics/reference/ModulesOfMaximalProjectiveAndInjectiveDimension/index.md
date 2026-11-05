---
name: ModulesOfMaximalProjectiveAndInjectiveDimension
domain: Dyck path statistics
signature: ModulesOfMaximalProjectiveAndInjectiveDimension(path)
summary: The indecomposable modules whose projective and injective dimensions both equal the global dimension.
catalog:
  - system: findstat
    identity: St001001
    url: https://www.findstat.org/St001001
    on: DyckPath
statOn:
  - DyckPath
signatures:
  - call: ModulesOfMaximalProjectiveAndInjectiveDimension(path)
    description: The indecomposable modules whose projective and injective dimensions both equal the global dimension.
    library: enumeratio-combinatorics
    type: (dyck_path) -> number
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
