---
name: FranklNumber
domain: Lattice statistics
signature: FranklNumber(lattice)
summary: The greatest n − 2 |[x, n]| over the join-irreducible elements x, the interval [x, n] being the elements at or above x.
catalog:
  - system: findstat
    identity: St001651
    url: https://www.findstat.org/St001651
    on: Poset
statOn:
  - Poset
signatures:
  - call: FranklNumber(lattice)
    description: The greatest n − 2 |[x, n]| over the join-irreducible elements x, the interval [x, n] being the elements at or above x.
    library: enumeratio-combinatorics
    type: (poset) -> number
---

- Defined over `Poset` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Poset` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- Defined where `IsLattice(Poset(_x)) && Length(_x) >= 2` holds; elsewhere the call stays unevaluated.
- FindStat's St001651. The one-element lattice has no join-irreducible element and FindStat no row for it, so it is outside the domain, not 0. Defined on a lattice with at least two elements.
