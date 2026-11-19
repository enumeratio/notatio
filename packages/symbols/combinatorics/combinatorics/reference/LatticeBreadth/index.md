---
name: LatticeBreadth
domain: Lattice statistics
signature: LatticeBreadth(lattice)
summary: "The most elements in a join-irredundant subset: one whose join changes when any element is dropped."
catalog:
  - system: findstat
    identity: St001624
    url: https://www.findstat.org/St001624
    on: Poset
statOn:
  - Poset
signatures:
  - call: LatticeBreadth(lattice)
    description: "The most elements in a join-irredundant subset: one whose join changes when any element is dropped."
    library: enumeratio-combinatorics
    type: (poset) -> number
---

- Defined over `Poset` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Poset` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- Defined where `IsLattice(Poset(_x)) && Length(_x) >= 1` holds; elsewhere the call stays unevaluated.
- FindStat's St001624. At least 1. The same value is the most elements in a join-irredundant subset of the join-irreducible elements. Named for the lattice: Breadth is a permutation statistic. Defined on a lattice with at least one element; FindStat has no row for the poset with no elements.
