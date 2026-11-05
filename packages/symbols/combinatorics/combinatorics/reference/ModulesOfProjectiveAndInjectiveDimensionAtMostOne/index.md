---
name: ModulesOfProjectiveAndInjectiveDimensionAtMostOne
domain: Dyck path statistics
signature: ModulesOfProjectiveAndInjectiveDimensionAtMostOne(path)
summary: The indecomposable modules whose projective and injective dimensions are both at most one.
catalog:
  - system: findstat
    identity: St001002
    url: https://www.findstat.org/St001002
    on: DyckPath
statOn:
  - DyckPath
signatures:
  - call: ModulesOfProjectiveAndInjectiveDimensionAtMostOne(path)
    description: The indecomposable modules whose projective and injective dimensions are both at most one.
    library: enumeratio-combinatorics
    type: (dyck_path) -> number
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
