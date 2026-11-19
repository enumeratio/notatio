---
name: BottomMeetSubsetCount
domain: Lattice statistics
signature: BottomMeetSubsetCount(lattice)
summary: The nonempty subsets whose meet is the bottom.
catalog:
  - system: findstat
    identity: St001679
    url: https://www.findstat.org/St001679
    on: Poset
statOn:
  - Poset
signatures:
  - call: BottomMeetSubsetCount(lattice)
    description: The nonempty subsets whose meet is the bottom.
    library: enumeratio-combinatorics
    type: (poset) -> number
---

- Defined over `Poset` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Poset` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- Defined where `IsLattice(Poset(_x)) && Length(_x) >= 1` holds; elsewhere the call stays unevaluated.
- FindStat's St001679. 2^(n−1) + 2 times St001677 for n ≥ 2. Defined on a lattice with at least one element; FindStat has no row for the poset with no elements.
