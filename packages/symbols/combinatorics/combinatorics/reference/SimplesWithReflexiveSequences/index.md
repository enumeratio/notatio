---
name: SimplesWithReflexiveSequences
domain: Dyck path statistics
signature: SimplesWithReflexiveSequences(path)
summary: The non-projective simple modules whose Auslander-Reiten sequence ending at them has only reflexive terms.
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001219. The sequence 0 -> tau S -> E -> S -> 0 has the middle term the module of length two on S.
