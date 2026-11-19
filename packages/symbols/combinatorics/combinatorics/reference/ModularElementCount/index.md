---
name: ModularElementCount
domain: Lattice statistics
signature: ModularElementCount(lattice)
summary: The elements a with a ∧ (y ∨ z) = (a ∧ y) ∨ z for every y and every z ≤ a.
catalog:
  - system: findstat
    identity: St000550
    url: https://www.findstat.org/St000550
    on: Poset
statOn:
  - Poset
signatures:
  - call: ModularElementCount(lattice)
    description: The elements a with a ∧ (y ∨ z) = (a ∧ y) ∨ z for every y and every z ≤ a.
    library: enumeratio-combinatorics
    type: (poset) -> number
---

- Defined over `Poset` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Poset` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- Defined where `IsLattice(Poset(_x)) && Length(_x) >= 1` holds; elsewhere the call stays unevaluated.
- FindStat's St000550. Its title and description say that (x, y) and (y, x) are modular pairs for every y; that reading agrees with only 39 of the 78 rows through 7 elements, and the reading here, the modular elements of Stern's definition, with all 78. Defined on a lattice with at least one element; FindStat has no row for the poset with no elements.
