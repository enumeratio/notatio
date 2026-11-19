---
name: JoinIrreducibleCount
domain: Lattice statistics
signature: JoinIrreducibleCount(lattice)
summary: The elements that cover exactly one element.
catalog:
  - system: findstat
    identity: St001622
    url: https://www.findstat.org/St001622
    on: Poset
statOn:
  - Poset
signatures:
  - call: JoinIrreducibleCount(lattice)
    description: The elements that cover exactly one element.
    library: enumeratio-combinatorics
    type: (poset) -> number
---

- Defined over `Poset` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Poset` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- Defined where `IsLattice(Poset(_x)) && Length(_x) >= 1` holds; elsewhere the call stays unevaluated.
- FindStat's St001622. Defined on a lattice with at least one element; FindStat has no row for the poset with no elements.
