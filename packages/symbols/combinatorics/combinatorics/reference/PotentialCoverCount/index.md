---
name: PotentialCoverCount
domain: Poset statistics
signature: PotentialCoverCount(poset)
summary: The ordered pairs of incomparable elements x, y such that adding x < y adds no other relation.
catalog:
  - system: findstat
    identity: St001902
    url: https://www.findstat.org/St001902
    on: Poset
statOn:
  - Poset
signatures:
  - call: PotentialCoverCount(poset)
    description: The ordered pairs of incomparable elements x, y such that adding x < y adds no other relation.
    library: enumeratio-combinatorics
    type: (poset) -> number
---

- Defined over `Poset` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Poset` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001902. Adding x < y adds the pairs a < b with a ≤ x and y ≤ b that did not hold; one pair is added exactly when that count is 1. The poset with no elements gives 0.
