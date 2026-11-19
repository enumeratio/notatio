---
name: DoublyIrreducibleCount
domain: Lattice statistics
signature: DoublyIrreducibleCount(lattice)
summary: The elements that cover exactly one element and are covered by exactly one.
catalog:
  - system: findstat
    identity: St001623
    url: https://www.findstat.org/St001623
    on: Poset
statOn:
  - Poset
signatures:
  - call: DoublyIrreducibleCount(lattice)
    description: The elements that cover exactly one element and are covered by exactly one.
    library: enumeratio-combinatorics
    type: (poset) -> number
---

- Defined over `Poset` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Poset` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- Defined where `IsLattice(Poset(_x)) && Length(_x) >= 1` holds; elsewhere the call stays unevaluated.
- FindStat's St001623. Defined on a lattice with at least one element; FindStat has no row for the poset with no elements.
