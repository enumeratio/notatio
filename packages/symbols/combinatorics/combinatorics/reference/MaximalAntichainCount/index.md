---
name: MaximalAntichainCount
domain: Poset statistics
signature: MaximalAntichainCount(poset)
summary: The antichains that no element can be added to.
catalog:
  - system: findstat
    identity: St000912
    url: https://www.findstat.org/St000912
    on: Poset
statOn:
  - Poset
signatures:
  - call: MaximalAntichainCount(poset)
    description: The antichains that no element can be added to.
    library: enumeratio-combinatorics
    type: (poset) -> number
---

- Defined over `Poset` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Poset` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000912. The poset with no elements gives 1, the empty antichain, a convention: FindStat has no row for it.
