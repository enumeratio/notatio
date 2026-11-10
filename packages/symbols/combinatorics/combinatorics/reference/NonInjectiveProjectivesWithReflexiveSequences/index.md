---
name: NonInjectiveProjectivesWithReflexiveSequences
domain: Dyck path statistics
signature: NonInjectiveProjectivesWithReflexiveSequences(path)
summary: The indecomposable projective non-injective modules whose Auslander-Reiten sequence has only reflexive terms.
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001113.
