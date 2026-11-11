---
name: NonInjectiveProjectivesWithNonReflexiveSequences
domain: Dyck path statistics
signature: NonInjectiveProjectivesWithNonReflexiveSequences(path)
summary: The indecomposable projective non-injective modules whose Auslander-Reiten sequence has a term that is not reflexive.
signatures:
  - call: NonInjectiveProjectivesWithNonReflexiveSequences(path)
    description: The indecomposable projective non-injective modules whose Auslander-Reiten sequence has a term that is not reflexive.
    library: enumeratio-combinatorics
    type: (dyck_path) -> number
catalog:
  - system: findstat
    identity: St001297
    url: https://www.findstat.org/St001297
    on: DyckPath
statOn:
  - DyckPath
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001297, which counts the non-injective projectives less those with reflexive sequences.
