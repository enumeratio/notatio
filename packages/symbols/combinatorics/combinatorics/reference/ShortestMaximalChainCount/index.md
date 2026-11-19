---
name: ShortestMaximalChainCount
domain: Poset statistics
signature: ShortestMaximalChainCount(poset)
summary: The maximal chains with the fewest elements.
catalog:
  - system: findstat
    identity: St000910
    url: https://www.findstat.org/St000910
    on: Poset
statOn:
  - Poset
signatures:
  - call: ShortestMaximalChainCount(poset)
    description: The maximal chains with the fewest elements.
    library: enumeratio-combinatorics
    type: (poset) -> number
---

- Defined over `Poset` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Poset` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000910, whose title says the length of the chain: its rows count the chains with the fewest elements. The poset with no elements gives 1, the empty chain, a convention: FindStat has no row for it.
