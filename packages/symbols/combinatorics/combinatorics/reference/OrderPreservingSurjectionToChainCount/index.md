---
name: OrderPreservingSurjectionToChainCount
domain: Poset statistics
signature: OrderPreservingSurjectionToChainCount(poset)
summary: "The order-preserving surjections from the poset onto a chain of any size: the chains of order ideals from the empty one to the whole poset with strict steps."
catalog:
  - system: findstat
    identity: St001815
    url: https://www.findstat.org/St001815
    on: Poset
statOn:
  - Poset
signatures:
  - call: OrderPreservingSurjectionToChainCount(poset)
    description: "The order-preserving surjections from the poset onto a chain of any size: the chains of order ideals from the empty one to the whole poset with strict steps."
    library: enumeratio-combinatorics
    type: (poset) -> number
---

- Defined over `Poset` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Poset` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001815. The poset with no elements gives 1, the empty map, a convention: FindStat has no row for it.
