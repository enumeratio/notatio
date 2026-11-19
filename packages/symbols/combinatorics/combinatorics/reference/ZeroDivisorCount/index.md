---
name: ZeroDivisorCount
domain: Lattice statistics
signature: ZeroDivisorCount(lattice)
summary: The elements a above the bottom with some b above the bottom and a ∧ b the bottom.
catalog:
  - system: findstat
    identity: St001990
    url: https://www.findstat.org/St001990
    on: Poset
statOn:
  - Poset
signatures:
  - call: ZeroDivisorCount(lattice)
    description: The elements a above the bottom with some b above the bottom and a ∧ b the bottom.
    library: enumeratio-combinatorics
    type: (poset) -> number
---

- Defined over `Poset` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Poset` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- Defined where `IsLattice(Poset(_x)) && Length(_x) >= 0` holds; elsewhere the call stays unevaluated.
- FindStat's St001990. The lattice with no elements has a row, and its value is 0.
