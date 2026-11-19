---
name: RelationCount
domain: Poset statistics
signature: RelationCount(poset)
summary: "The pairs x ≤ y: the elements and the pairs x < y."
catalog:
  - system: findstat
    identity: St000639
    url: https://www.findstat.org/St000639
    on: Poset
statOn:
  - Poset
signatures:
  - call: RelationCount(poset)
    description: "The pairs x ≤ y: the elements and the pairs x < y."
    library: enumeratio-combinatorics
    type: (poset) -> number
---

- Defined over `Poset` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Poset` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000639. The poset with no elements gives 0.
