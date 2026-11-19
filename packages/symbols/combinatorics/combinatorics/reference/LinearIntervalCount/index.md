---
name: LinearIntervalCount
domain: Lattice statistics
signature: LinearIntervalCount(lattice)
summary: The pairs x ≤ y, x = y included, whose interval [x, y] is a chain.
catalog:
  - system: findstat
    identity: St001833
    url: https://www.findstat.org/St001833
    on: Poset
statOn:
  - Poset
signatures:
  - call: LinearIntervalCount(lattice)
    description: The pairs x ≤ y, x = y included, whose interval [x, y] is a chain.
    library: enumeratio-combinatorics
    type: (poset) -> number
---

- Defined over `Poset` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Poset` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- Defined where `IsLattice(Poset(_x)) && Length(_x) >= 1` holds; elsewhere the call stays unevaluated.
- FindStat's St001833. Defined on a lattice with at least one element; FindStat has no row for the poset with no elements.
