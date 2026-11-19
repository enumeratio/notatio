---
name: IsLattice
domain: Lattice statistics
signature: IsLattice(poset)
summary: Whether every pair of elements has a join and a meet.
signatures:
  - call: IsLattice(poset)
    description: Whether every pair of elements has a join and a meet.
    library: enumeratio-combinatorics
    type: (poset) -> boolean
---

- Defined over `Poset` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Poset` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- True for the poset with no elements. A poset has a join for every pair and a bottom exactly when it is a lattice: the test is one minimal element and, for every pair, a least common upper bound (a common upper bound below all the others). A top and a join for every pair are not enough.
