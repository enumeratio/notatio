---
name: NakayamaGorensteinDegree
domain: Dyck path statistics
signature: NakayamaGorensteinDegree(path)
summary: The greatest k for which the path's linear Nakayama algebra is k-Gorenstein, capped at the global dimension.
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000930: the first terms of the minimal injective coresolution of A have projective dimension at most their index.
