---
name: UncomplementedElementCount
domain: Lattice statistics
signature: UncomplementedElementCount(lattice)
summary: "The elements with no complement: no y with x ∧ y the bottom and x ∨ y the top."
catalog:
  - system: findstat
    identity: St001846
    url: https://www.findstat.org/St001846
    on: Poset
statOn:
  - Poset
signatures:
  - call: UncomplementedElementCount(lattice)
    description: "The elements with no complement: no y with x ∧ y the bottom and x ∨ y the top."
    library: enumeratio-combinatorics
    type: (poset) -> number
---

- Defined over `Poset` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Poset` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- Defined where `IsLattice(Poset(_x)) && Length(_x) >= 0` holds; elsewhere the call stays unevaluated.
- FindStat's St001846. Defined on a lattice. FindStat has no row for the poset with no elements, which gives 0, a count of nothing.
