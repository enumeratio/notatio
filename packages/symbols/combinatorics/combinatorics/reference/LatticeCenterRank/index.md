---
name: LatticeCenterRank
domain: Lattice statistics
signature: LatticeCenterRank(lattice)
summary: "The base-2 logarithm of the size of the center: the central elements that cover no other central element above the bottom."
catalog:
  - system: findstat
    identity: St001613
    url: https://www.findstat.org/St001613
    on: Poset
statOn:
  - Poset
signatures:
  - call: LatticeCenterRank(lattice)
    description: "The base-2 logarithm of the size of the center: the central elements that cover no other central element above the bottom."
    library: enumeratio-combinatorics
    type: (poset) -> number
---

- Defined over `Poset` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Poset` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- Defined where `IsLattice(Poset(_x)) && Length(_x) >= 1` holds; elsewhere the call stays unevaluated.
- FindStat's St001613. The center is the neutral elements that have a complement; it is a Boolean lattice, so its size is 2^k and k is the number of its atoms, which is what this counts (no logarithm). Defined on a lattice with at least one element; FindStat has no row for the poset with no elements.
