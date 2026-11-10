---
name: SimpleDoubleDualDimensionSum
domain: Dyck path statistics
signature: SimpleDoubleDualDimensionSum(path)
summary: The dimension of the double dual of the top A/J of the path's linear Nakayama algebra, J the Jacobson radical.
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001255.
