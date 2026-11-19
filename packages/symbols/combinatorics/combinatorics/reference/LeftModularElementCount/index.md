---
name: LeftModularElementCount
domain: Lattice statistics
signature: LeftModularElementCount(lattice)
summary: The elements a with (y ∨ a) ∧ z = y ∨ (a ∧ z) for every y ≤ z.
catalog:
  - system: findstat
    identity: St000551
    url: https://www.findstat.org/St000551
    on: Poset
statOn:
  - Poset
signatures:
  - call: LeftModularElementCount(lattice)
    description: The elements a with (y ∨ a) ∧ z = y ∨ (a ∧ z) for every y ≤ z.
    library: enumeratio-combinatorics
    type: (poset) -> number
---

- Defined over `Poset` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Poset` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- Defined where `IsLattice(Poset(_x)) && Length(_x) >= 1` holds; elsewhere the call stays unevaluated.
- FindStat's St000551. Defined on a lattice with at least one element; FindStat has no row for the poset with no elements.
