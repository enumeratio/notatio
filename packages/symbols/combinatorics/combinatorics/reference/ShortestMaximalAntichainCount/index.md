---
name: ShortestMaximalAntichainCount
domain: Poset statistics
signature: ShortestMaximalAntichainCount(poset)
summary: The maximal antichains with the fewest elements.
catalog:
  - system: findstat
    identity: St000907
    url: https://www.findstat.org/St000907
    on: Poset
statOn:
  - Poset
signatures:
  - call: ShortestMaximalAntichainCount(poset)
    description: The maximal antichains with the fewest elements.
    library: enumeratio-combinatorics
    type: (poset) -> number
---

- Defined over `Poset` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Poset` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000907. The poset with no elements gives 1, the empty antichain, a convention: FindStat has no row for it.
