---
name: NonProjectiveReflexiveModules
domain: Dyck path statistics
signature: NonProjectiveReflexiveModules(path)
summary: The indecomposable non-projective modules that are reflexive, in the path's linear Nakayama algebra.
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001253. A module is reflexive when Ext^i(D(A), tau M) vanishes for i = 1, 2.
