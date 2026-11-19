---
name: CoverJoinChainSize
domain: Lattice statistics
signature: CoverJoinChainSize(lattice)
summary: The elements of the chain from the bottom to the top that jumps from each element to the join of its upper covers.
catalog:
  - system: findstat
    identity: St001720
    url: https://www.findstat.org/St001720
    on: Poset
statOn:
  - Poset
signatures:
  - call: CoverJoinChainSize(lattice)
    description: The elements of the chain from the bottom to the top that jumps from each element to the join of its upper covers.
    library: enumeratio-combinatorics
    type: (poset) -> number
---

- Defined over `Poset` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Poset` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- Defined where `IsLattice(Poset(_x)) && Length(_x) >= 1` holds; elsewhere the call stays unevaluated.
- FindStat's St001720. Its title says the shortest chain of small intervals and its length: its rows count the elements of the chain that jumps from each element to the join of all its upper covers, both ends included, so the one-element lattice gives 1. That chain is not always the shortest: on one lattice of 7 elements it has 4 elements, the shortest has 3, and the row says 4. Defined on a lattice with at least one element; FindStat has no row for the poset with no elements.
