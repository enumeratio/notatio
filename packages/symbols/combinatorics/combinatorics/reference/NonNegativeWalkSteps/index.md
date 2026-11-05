---
name: NonNegativeWalkSteps
domain: Permutation statistics
signature: NonNegativeWalkSteps(p)
summary: Steps of the walk (up at an ascent, down at a descent) that begin and end at height at least 0.
catalog:
  - system: findstat
    identity: St001332
    url: https://www.findstat.org/St001332
    on: Permutation
statOn:
  - Permutation
signatures:
  - call: NonNegativeWalkSteps(p)
    description: Steps of the walk (up at an ascent, down at a descent) that begin and end at height at least 0.
    library: enumeratio-combinatorics
    type: (list<integer> | permutation) -> number
---

- Defined over `Permutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Permutation`, and also a bare list of integers: this reading compares entries with each other rather than with their positions, so it stands on any sequence.
