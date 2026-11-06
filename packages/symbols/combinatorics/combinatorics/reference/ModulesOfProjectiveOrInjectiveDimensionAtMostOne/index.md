---
name: ModulesOfProjectiveOrInjectiveDimensionAtMostOne
domain: Dyck path statistics
signature: ModulesOfProjectiveOrInjectiveDimensionAtMostOne(path)
summary: The indecomposable modules whose projective dimension or injective dimension is at most one.
catalog:
  - system: findstat
    identity: St001138
    url: https://www.findstat.org/St001138
    on: DyckPath
statOn:
  - DyckPath
signatures:
  - call: ModulesOfProjectiveOrInjectiveDimensionAtMostOne(path)
    description: The indecomposable modules whose projective dimension or injective dimension is at most one.
    library: enumeratio-combinatorics
    type: (dyck_path) -> number
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
