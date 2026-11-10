---
name: MaximalSimpleTorsionfreeIndex
domain: Dyck path statistics
signature: MaximalSimpleTorsionfreeIndex(path)
summary: The greatest r for which a non-projective simple module is r-torsionfree, up to the global dimension.
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001294. Ext^i(D(A), tau S) never vanishes for every i up to the global dimension on a path of semilength 6 or less, so the cap is not reached.
