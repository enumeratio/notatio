---
name: OneThirdBalancedPairCount
domain: Poset statistics
signature: OneThirdBalancedPairCount(poset)
summary: The pairs x, y whose share of the linear extensions with x first is between a third and two thirds.
catalog:
  - system: findstat
    identity: St000849
    url: https://www.findstat.org/St000849
    on: Poset
statOn:
  - Poset
signatures:
  - call: OneThirdBalancedPairCount(poset)
    description: The pairs x, y whose share of the linear extensions with x first is between a third and two thirds.
    library: enumeratio-combinatorics
    type: (poset) -> number
---

- Defined over `Poset` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Poset` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000849. The shares are compared as integers. A pair counts once. The poset with no elements gives 0, a convention: FindStat has no row for it.
