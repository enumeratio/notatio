---
name: MinimalElementCount
domain: Poset statistics
signature: MinimalElementCount(poset)
summary: The elements that cover nothing.
catalog:
  - system: findstat
    identity: St000068
    url: https://www.findstat.org/St000068
    on: Poset
statOn:
  - Poset
signatures:
  - call: MinimalElementCount(poset)
    description: The elements that cover nothing.
    library: enumeratio-combinatorics
    type: (poset) -> number
---

- Defined over `Poset` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Poset` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000068. The poset with no elements gives 0.
