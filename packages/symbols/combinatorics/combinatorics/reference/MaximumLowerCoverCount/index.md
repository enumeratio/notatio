---
name: MaximumLowerCoverCount
domain: Poset statistics
signature: MaximumLowerCoverCount(poset)
summary: The most elements covered by one element.
catalog:
  - system: findstat
    identity: St000846
    url: https://www.findstat.org/St000846
    on: Poset
statOn:
  - Poset
signatures:
  - call: MaximumLowerCoverCount(poset)
    description: The most elements covered by one element.
    library: enumeratio-combinatorics
    type: (poset) -> number
---

- Defined over `Poset` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Poset` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000846, whose title says the elements covering one element: its rows count the elements a single element covers. The poset with no elements gives 0.
