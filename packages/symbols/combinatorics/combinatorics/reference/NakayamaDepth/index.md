---
name: NakayamaDepth
domain: Dyck path statistics
signature: NakayamaDepth(path)
summary: "The depth of the path's linear Nakayama algebra: the greatest grade of a simple module."
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001530.
