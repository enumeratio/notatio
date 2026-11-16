---
name: OrdinalSummandCount
domain: Poset statistics
signature: OrdinalSummandCount(poset)
summary: The summands of the longest decomposition of the poset as an ordinal sum.
catalog:
  - system: findstat
    identity: St000717
    url: https://www.findstat.org/St000717
    on: Poset
statOn:
  - Poset
signatures:
  - call: OrdinalSummandCount(poset)
    description: The summands of the longest decomposition of the poset as an ordinal sum.
    library: enumeratio-combinatorics
    type: (poset) -> number
---

- Defined over `Poset` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Poset` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000717. The summands end where an initial segment lies below everything after it. The poset with no elements gives 0.
