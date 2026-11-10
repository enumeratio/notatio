---
name: InjectiveDoubleDualDimensionSum
domain: Dyck path statistics
signature: InjectiveDoubleDualDimensionSum(path)
summary: The dimension of the double dual of D(A), the direct sum of the indecomposable injectives of the path's linear Nakayama algebra.
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001259.
