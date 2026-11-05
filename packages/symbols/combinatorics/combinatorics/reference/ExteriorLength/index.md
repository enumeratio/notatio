---
name: ExteriorLength
domain: Permutation statistics
signature: ExteriorLength(p)
summary: The longest proper prefix whose relative order is that of the suffix of the same length.
catalog:
  - system: findstat
    identity: St001052
    url: https://www.findstat.org/St001052
    on: Permutation
statOn:
  - Permutation
signatures:
  - call: ExteriorLength(p)
    description: The longest proper prefix whose relative order is that of the suffix of the same length.
    library: enumeratio-combinatorics
    type: (list<integer> | permutation) -> number
---

- Defined over `Permutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Permutation`, and also a bare list of integers: this reading compares entries with each other rather than with their positions, so it stands on any sequence.
