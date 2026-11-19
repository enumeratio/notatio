---
name: HalfBalancedPairCount
domain: Poset statistics
signature: HalfBalancedPairCount(poset)
summary: The pairs x, y with as many linear extensions with x first as with y first.
catalog:
  - system: findstat
    identity: St000850
    url: https://www.findstat.org/St000850
    on: Poset
statOn:
  - Poset
signatures:
  - call: HalfBalancedPairCount(poset)
    description: The pairs x, y with as many linear extensions with x first as with y first.
    library: enumeratio-combinatorics
    type: (poset) -> number
---

- Defined over `Poset` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Poset` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- Defined where `Length(_x) <= 12` holds; elsewhere the call stays unevaluated.
- FindStat's St000850. The shares are compared as integers. A pair counts once. The poset with no elements gives 0, a convention: FindStat has no row for it.
