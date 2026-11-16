---
name: LargestIntervalSize
domain: Poset statistics
signature: LargestIntervalSize(poset)
summary: The most elements in an interval [x, y].
catalog:
  - system: findstat
    identity: St001717
    url: https://www.findstat.org/St001717
    on: Poset
statOn:
  - Poset
signatures:
  - call: LargestIntervalSize(poset)
    description: The most elements in an interval [x, y].
    library: enumeratio-combinatorics
    type: (poset) -> number
---

- Defined over `Poset` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Poset` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001717. An interval [x, y] holds the elements z with x ≤ z ≤ y. The poset with no elements gives 0.
