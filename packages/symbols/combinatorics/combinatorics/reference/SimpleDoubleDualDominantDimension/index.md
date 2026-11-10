---
name: SimpleDoubleDualDominantDimension
domain: Dyck path statistics
signature: SimpleDoubleDualDominantDimension(path)
summary: The dominant dimension of the double dual of A/J, the least among its nonzero summands, for the path's linear Nakayama algebra A with Jacobson radical J.
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001257. A projective-injective summand counts every step up to the vertex count.
