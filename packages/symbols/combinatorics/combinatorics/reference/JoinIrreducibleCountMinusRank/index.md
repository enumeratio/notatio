---
name: JoinIrreducibleCountMinusRank
domain: Lattice statistics
signature: JoinIrreducibleCountMinusRank(lattice)
summary: The join-irreducible elements less the length of the longest chain.
catalog:
  - system: findstat
    identity: St001845
    url: https://www.findstat.org/St001845
    on: Poset
statOn:
  - Poset
signatures:
  - call: JoinIrreducibleCountMinusRank(lattice)
    description: The join-irreducible elements less the length of the longest chain.
    library: enumeratio-combinatorics
    type: (poset) -> number
---

- Defined over `Poset` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Poset` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- Defined where `IsLattice(Poset(_x)) && Length(_x) >= 1` holds; elsewhere the call stays unevaluated.
- FindStat's St001845. The length of the longest chain is one less than its elements. Defined on a lattice with at least one element; FindStat has no row for the poset with no elements.
