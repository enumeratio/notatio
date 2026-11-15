---
name: MaximalElementCount
domain: Poset statistics
signature: MaximalElementCount(poset)
summary: The elements that nothing covers.
catalog:
  - system: findstat
    identity: St000069
    url: https://www.findstat.org/St000069
    on: Poset
statOn:
  - Poset
signatures:
  - call: MaximalElementCount(poset)
    description: The elements that nothing covers.
    library: enumeratio-combinatorics
    type: (poset) -> number
---

- Defined over `Poset` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Poset` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000069. The poset with no elements gives 0.
