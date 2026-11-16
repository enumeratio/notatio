---
name: MaximalChainCount
domain: Poset statistics
signature: MaximalChainCount(poset)
summary: "The chains that no element can be added to: the paths up the Hasse diagram from a minimal to a maximal element."
catalog:
  - system: findstat
    identity: St000071
    url: https://www.findstat.org/St000071
    on: Poset
statOn:
  - Poset
signatures:
  - call: MaximalChainCount(poset)
    description: "The chains that no element can be added to: the paths up the Hasse diagram from a minimal to a maximal element."
    library: enumeratio-combinatorics
    type: (poset) -> number
---

- Defined over `Poset` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Poset` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000071. The poset with no elements gives 1, the empty chain.
