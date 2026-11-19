---
name: JoinPrimeCount
domain: Lattice statistics
signature: JoinPrimeCount(lattice)
summary: The elements above the bottom that lie below a join p ∨ q only when they lie below p or below q.
catalog:
  - system: findstat
    identity: St001615
    url: https://www.findstat.org/St001615
    on: Poset
statOn:
  - Poset
signatures:
  - call: JoinPrimeCount(lattice)
    description: The elements above the bottom that lie below a join p ∨ q only when they lie below p or below q.
    library: enumeratio-combinatorics
    type: (poset) -> number
---

- Defined over `Poset` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Poset` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- Defined where `IsLattice(Poset(_x)) && Length(_x) >= 0` holds; elsewhere the call stays unevaluated.
- FindStat's St001615. The top counts when it is join-prime. Defined on a lattice. FindStat has no row for the poset with no elements, which gives 0, a count of nothing.
