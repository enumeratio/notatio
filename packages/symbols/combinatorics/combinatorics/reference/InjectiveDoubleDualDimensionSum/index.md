---
name: InjectiveDoubleDualDimensionSum
domain: Dyck path statistics
signature: InjectiveDoubleDualDimensionSum(path)
summary: The dimension of the double dual of D(A), the direct sum of the indecomposable injectives of the path's linear Nakayama algebra.
signatures:
  - call: InjectiveDoubleDualDimensionSum(path)
    description: The dimension of the double dual of D(A), the direct sum of the indecomposable injectives of the path's linear Nakayama algebra.
    library: enumeratio-combinatorics
    type: (dyck_path) -> number
catalog:
  - system: findstat
    identity: St001259
    url: https://www.findstat.org/St001259
    on: DyckPath
statOn:
  - DyckPath
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001259.
