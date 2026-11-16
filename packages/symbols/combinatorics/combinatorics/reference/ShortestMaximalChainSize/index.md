---
name: ShortestMaximalChainSize
domain: Poset statistics
signature: ShortestMaximalChainSize(poset)
summary: The fewest elements in a maximal chain.
catalog:
  - system: findstat
    identity: St000906
    url: https://www.findstat.org/St000906
    on: Poset
statOn:
  - Poset
signatures:
  - call: ShortestMaximalChainSize(poset)
    description: The fewest elements in a maximal chain.
    library: enumeratio-combinatorics
    type: (poset) -> number
---

- Defined over `Poset` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Poset` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000906, whose title says the length of the chain: its rows count the elements of the chain, one more than the covers. The poset with no elements gives 0.
