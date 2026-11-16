---
name: ChainCount
domain: Poset statistics
signature: ChainCount(poset)
summary: The sets of pairwise comparable elements, the empty set included.
catalog:
  - system: findstat
    identity: St000180
    url: https://www.findstat.org/St000180
    on: Poset
statOn:
  - Poset
signatures:
  - call: ChainCount(poset)
    description: The sets of pairwise comparable elements, the empty set included.
    library: enumeratio-combinatorics
    type: (poset) -> number
---

- Defined over `Poset` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Poset` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000180. The poset with no elements gives 1, the empty chain.
