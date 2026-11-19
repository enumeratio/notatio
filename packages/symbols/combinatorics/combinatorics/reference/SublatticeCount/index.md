---
name: SublatticeCount
domain: Lattice statistics
signature: SublatticeCount(lattice)
summary: The subsets closed under join and meet, the empty set included.
catalog:
  - system: findstat
    identity: St001620
    url: https://www.findstat.org/St001620
    on: Poset
statOn:
  - Poset
signatures:
  - call: SublatticeCount(lattice)
    description: The subsets closed under join and meet, the empty set included.
    library: enumeratio-combinatorics
    type: (poset) -> number
---

- Defined over `Poset` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Poset` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- Defined where `IsLattice(Poset(_x)) && Length(_x) >= 1` holds; elsewhere the call stays unevaluated.
- FindStat's St001620. The empty set is a sublattice: the one-element lattice has 2. Defined on a lattice with at least one element; FindStat has no row for the poset with no elements.
