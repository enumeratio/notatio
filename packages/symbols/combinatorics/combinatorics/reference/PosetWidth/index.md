---
name: PosetWidth
domain: Poset statistics
signature: PosetWidth(poset)
summary: The elements of the largest antichain.
catalog:
  - system: findstat
    identity: St000527
    url: https://www.findstat.org/St000527
    on: Poset
statOn:
  - Poset
signatures:
  - call: PosetWidth(poset)
    description: The elements of the largest antichain.
    library: enumeratio-combinatorics
    type: (poset) -> number
---

- Defined over `Poset` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Poset` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000527. The poset with no elements gives 0.
