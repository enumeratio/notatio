---
name: CoverRelationCount
domain: Poset statistics
signature: CoverRelationCount(poset)
summary: "The pairs where one element covers another: the edges of the Hasse diagram."
catalog:
  - system: findstat
    identity: St000327
    url: https://www.findstat.org/St000327
    on: Poset
statOn:
  - Poset
signatures:
  - call: CoverRelationCount(poset)
    description: "The pairs where one element covers another: the edges of the Hasse diagram."
    library: enumeratio-combinatorics
    type: (poset) -> number
---

- Defined over `Poset` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Poset` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000327. The poset with no elements gives 0.
