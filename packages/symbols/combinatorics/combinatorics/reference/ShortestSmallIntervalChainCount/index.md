---
name: ShortestSmallIntervalChainCount
domain: Lattice statistics
signature: ShortestSmallIntervalChainCount(lattice)
summary: The chains from the bottom to the top with the fewest elements in which each element is a join of upper covers of the one before.
catalog:
  - system: findstat
    identity: St001719
    url: https://www.findstat.org/St001719
    on: Poset
statOn:
  - Poset
signatures:
  - call: ShortestSmallIntervalChainCount(lattice)
    description: The chains from the bottom to the top with the fewest elements in which each element is a join of upper covers of the one before.
    library: enumeratio-combinatorics
    type: (poset) -> number
---

- Defined over `Poset` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Poset` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- Defined where `IsLattice(Poset(_x)) && Length(_x) >= 1` holds; elsewhere the call stays unevaluated.
- FindStat's St001719. A step from e to j > e is allowed when the upper covers of e below j have join j. Counted by a fold from the top over the elements. Defined on a lattice with at least one element; FindStat has no row for the poset with no elements.
