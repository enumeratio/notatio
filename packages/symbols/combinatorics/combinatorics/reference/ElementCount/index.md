---
name: ElementCount
domain: Poset statistics
signature: ElementCount(poset)
summary: The elements of the poset.
catalog:
  - system: findstat
    identity: St000189
    url: https://www.findstat.org/St000189
    on: Poset
statOn:
  - Poset
signatures:
  - call: ElementCount(poset)
    description: The elements of the poset.
    library: enumeratio-combinatorics
    type: (poset) -> number
---

- Defined over `Poset` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Poset` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000189. The poset with no elements gives 0.
