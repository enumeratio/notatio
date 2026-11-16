---
name: MaximumUpperCoverCount
domain: Poset statistics
signature: MaximumUpperCoverCount(poset)
summary: The most elements covering one element.
catalog:
  - system: findstat
    identity: St000845
    url: https://www.findstat.org/St000845
    on: Poset
statOn:
  - Poset
signatures:
  - call: MaximumUpperCoverCount(poset)
    description: The most elements covering one element.
    library: enumeratio-combinatorics
    type: (poset) -> number
---

- Defined over `Poset` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Poset` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000845, whose title says the elements covered by one element: its rows count the elements covering a single element. The poset with no elements gives 0.
