---
name: CornerAlgebraNonSimpleProjectiveInjectives
domain: Dyck path statistics
signature: CornerAlgebraNonSimpleProjectiveInjectives(path)
summary: The indecomposable projective-injective modules of the corner algebra eAe that are not simple.
signatures:
  - call: CornerAlgebraNonSimpleProjectiveInjectives(path)
    description: The indecomposable projective-injective modules of the corner algebra eAe that are not simple.
    library: enumeratio-combinatorics
    type: (dyck_path) -> number
catalog:
  - system: findstat
    identity: St001205
    url: https://www.findstat.org/St001205
    on: DyckPath
statOn:
  - DyckPath
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001205.
