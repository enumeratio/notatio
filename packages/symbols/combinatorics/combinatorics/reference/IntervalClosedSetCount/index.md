---
name: IntervalClosedSetCount
domain: Poset statistics
signature: IntervalClosedSetCount(poset)
summary: The subsets that hold every element between two of their members, the empty subset included.
catalog:
  - system: findstat
    identity: St001909
    url: https://www.findstat.org/St001909
    on: Poset
statOn:
  - Poset
signatures:
  - call: IntervalClosedSetCount(poset)
    description: The subsets that hold every element between two of their members, the empty subset included.
    library: enumeratio-combinatorics
    type: (poset) -> number
---

- Defined over `Poset` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Poset` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001909. The poset with no elements gives 1, the empty subset, a convention: FindStat has no row for it.
