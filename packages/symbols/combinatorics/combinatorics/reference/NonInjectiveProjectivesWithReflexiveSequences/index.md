---
name: NonInjectiveProjectivesWithReflexiveSequences
domain: Dyck path statistics
signature: NonInjectiveProjectivesWithReflexiveSequences(path)
summary: The indecomposable projective non-injective modules whose Auslander-Reiten sequence has only reflexive terms.
signatures:
  - call: NonInjectiveProjectivesWithReflexiveSequences(path)
    description: The indecomposable projective non-injective modules whose Auslander-Reiten sequence has only reflexive terms.
    library: enumeratio-combinatorics
    type: (dyck_path) -> number
catalog:
  - system: findstat
    identity: St001113
    url: https://www.findstat.org/St001113
    on: DyckPath
statOn:
  - DyckPath
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001113.
