---
name: MinimalBottomMeetSubsetCount
domain: Lattice statistics
signature: MinimalBottomMeetSubsetCount(lattice)
summary: The subsets whose meet is the bottom and no smaller subset's is.
catalog:
  - system: findstat
    identity: St001681
    url: https://www.findstat.org/St001681
    on: Poset
statOn:
  - Poset
signatures:
  - call: MinimalBottomMeetSubsetCount(lattice)
    description: The subsets whose meet is the bottom and no smaller subset's is.
    library: enumeratio-combinatorics
    type: (poset) -> number
---

- Defined over `Poset` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Poset` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- Defined where `Length(_x) <= 12 && IsLattice(Poset(_x)) && Length(_x) >= 1` holds; elsewhere the call stays unevaluated.
- FindStat's St001681. A subset with meet the bottom stays one when elements are added, so it is minimal when dropping any one element loses that. Defined on a lattice with at least one element; FindStat has no row for the poset with no elements.
