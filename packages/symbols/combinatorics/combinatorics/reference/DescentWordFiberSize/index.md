---
name: DescentWordFiberSize
domain: Permutation statistics
signature: DescentWordFiberSize(p)
summary: The permutations of the same size with the same descents as p.
catalog:
  - system: findstat
    identity: St000530
    url: https://www.findstat.org/St000530
    on: Permutation
statOn:
  - Permutation
signatures:
  - call: DescentWordFiberSize(p)
    description: The permutations of the same size with the same descents as p.
    library: enumeratio-combinatorics
    type: (list<integer> | permutation) -> number
---

- Defined over `Permutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Permutation`, and also a bare list of integers: this reading compares entries with each other rather than with their positions, so it stands on any sequence.
- Counted by the rank of the last entry: a descent keeps the partial sums from the right, an ascent from the left.
