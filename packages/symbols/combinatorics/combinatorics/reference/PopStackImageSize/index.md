---
name: PopStackImageSize
domain: Lattice statistics
signature: PopStackImageSize(lattice)
summary: The distinct values of x ∧ (the meet of the elements x covers), where an element that covers none gives itself.
catalog:
  - system: findstat
    identity: St001820
    url: https://www.findstat.org/St001820
    on: Poset
statOn:
  - Poset
signatures:
  - call: PopStackImageSize(lattice)
    description: The distinct values of x ∧ (the meet of the elements x covers), where an element that covers none gives itself.
    library: enumeratio-combinatorics
    type: (poset) -> number
---

- Defined over `Poset` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Poset` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- Defined where `IsLattice(Poset(_x)) && Length(_x) >= 1` holds; elsewhere the call stays unevaluated.
- FindStat's St001820. The meet of the lower covers of x lies below x, so the image is that meet, or x itself when x covers nothing. Defined on a lattice with at least one element; FindStat has no row for the poset with no elements.
