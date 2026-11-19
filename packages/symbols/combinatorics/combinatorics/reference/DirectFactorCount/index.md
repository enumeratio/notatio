---
name: DirectFactorCount
domain: Lattice statistics
signature: DirectFactorCount(lattice)
summary: "The directly indecomposable factors of the lattice, when it is a product of them: the larger of 1 and the center's rank."
catalog:
  - system: findstat
    identity: St001881
    url: https://www.findstat.org/St001881
    on: Poset
statOn:
  - Poset
signatures:
  - call: DirectFactorCount(lattice)
    description: "The directly indecomposable factors of the lattice, when it is a product of them: the larger of 1 and the center's rank."
    library: enumeratio-combinatorics
    type: (poset) -> number
---

- Defined over `Poset` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Poset` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- Defined where `IsLattice(Poset(_x)) && Length(_x) >= 1` holds; elsewhere the call stays unevaluated.
- FindStat's St001881. The center is a Boolean lattice 2^k and the lattice is a product of k directly indecomposable lattices; equal to the larger of 1 and the base-2 logarithm of the center's size on every row. Defined on a lattice with at least one element; FindStat has no row for the poset with no elements.
