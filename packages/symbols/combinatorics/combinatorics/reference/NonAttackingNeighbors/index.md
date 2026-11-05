---
name: NonAttackingNeighbors
domain: Permutation statistics
signature: NonAttackingNeighbors(p)
summary: Positions i with |p(i) - p(i+1)| > 1.
catalog:
  - system: findstat
    identity: St001388
    url: https://www.findstat.org/St001388
    on: Permutation
statOn:
  - Permutation
signatures:
  - call: NonAttackingNeighbors(p)
    description: Positions i with |p(i) - p(i+1)| > 1.
    library: enumeratio-combinatorics
    type: (list<integer> | permutation) -> number
---

- Defined over `Permutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Permutation`, and also a bare list of integers: this reading compares entries with each other rather than with their positions, so it stands on any sequence.
- Kings on adjacent columns that do not attack each other.
