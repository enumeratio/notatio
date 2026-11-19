---
name: LongestMaximalChainCount
domain: Poset statistics
signature: LongestMaximalChainCount(poset)
summary: The maximal chains with the most elements.
catalog:
  - system: findstat
    identity: St000909
    url: https://www.findstat.org/St000909
    on: Poset
statOn:
  - Poset
signatures:
  - call: LongestMaximalChainCount(poset)
    description: The maximal chains with the most elements.
    library: enumeratio-combinatorics
    type: (poset) -> number
---

- Defined over `Poset` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Poset` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000909. The poset with no elements gives 1, the empty chain, a convention: FindStat has no row for it.
