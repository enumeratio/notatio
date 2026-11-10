---
name: TwoRegularModules
domain: Dyck path statistics
signature: TwoRegularModules(path)
summary: The indecomposable modules of projective dimension 2 whose only nonvanishing Ext group with the regular module is Ext^2, one-dimensional.
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001276.
