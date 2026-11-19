---
name: MoebiusInvariant
domain: Lattice statistics
signature: MoebiusInvariant(lattice)
summary: The Möbius function from the bottom to the top.
catalog:
  - system: findstat
    identity: St001625
    url: https://www.findstat.org/St001625
    on: Poset
statOn:
  - Poset
signatures:
  - call: MoebiusInvariant(lattice)
    description: The Möbius function from the bottom to the top.
    library: enumeratio-combinatorics
    type: (poset) -> number
---

- Defined over `Poset` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Poset` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- Defined where `IsLattice(Poset(_x)) && Length(_x) >= 1` holds; elsewhere the call stays unevaluated.
- FindStat's St001625. μ(1, n) of the lattice, the last entry of the Möbius row of the bottom. Defined on a lattice with at least one element; FindStat has no row for the poset with no elements.
