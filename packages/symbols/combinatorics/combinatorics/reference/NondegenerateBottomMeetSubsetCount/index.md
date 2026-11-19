---
name: NondegenerateBottomMeetSubsetCount
domain: Lattice statistics
signature: NondegenerateBottomMeetSubsetCount(lattice)
summary: The nonempty subsets holding neither the bottom nor the top whose meet is the bottom.
catalog:
  - system: findstat
    identity: St001677
    url: https://www.findstat.org/St001677
    on: Poset
statOn:
  - Poset
signatures:
  - call: NondegenerateBottomMeetSubsetCount(lattice)
    description: The nonempty subsets holding neither the bottom nor the top whose meet is the bottom.
    library: enumeratio-combinatorics
    type: (poset) -> number
---

- Defined over `Poset` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Poset` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- Defined where `Length(_x) <= 12 && IsLattice(Poset(_x)) && Length(_x) >= 0` holds; elsewhere the call stays unevaluated.
- FindStat's St001677. Defined on a lattice. FindStat has no row for the poset with no elements, which gives 0, a count of nothing.
