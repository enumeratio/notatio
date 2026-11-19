---
name: MostBalancedPairExtensionCount
domain: Poset statistics
signature: MostBalancedPairExtensionCount(poset)
summary: The most, over the pairs x, y, of the fewer of the linear extensions with x first and with y first.
catalog:
  - system: findstat
    identity: St000848
    url: https://www.findstat.org/St000848
    on: Poset
statOn:
  - Poset
signatures:
  - call: MostBalancedPairExtensionCount(poset)
    description: The most, over the pairs x, y, of the fewer of the linear extensions with x first and with y first.
    library: enumeratio-combinatorics
    type: (poset) -> number
---

- Defined over `Poset` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Poset` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000848. A comparable pair gives 0, and so does a poset with fewer than two elements. The poset with no elements gives 0, a convention: FindStat has no row for it.
