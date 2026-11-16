---
name: VSubsetCount
domain: Poset statistics
signature: VSubsetCount(poset)
summary: The sets of three elements with one below the other two, which are incomparable.
catalog:
  - system: findstat
    identity: St001398
    url: https://www.findstat.org/St001398
    on: Poset
statOn:
  - Poset
signatures:
  - call: VSubsetCount(poset)
    description: The sets of three elements with one below the other two, which are incomparable.
    library: enumeratio-combinatorics
    type: (poset) -> number
---

- Defined over `Poset` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Poset` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001398. The bottom need not be covered by the other two. The poset with no elements gives 0.
