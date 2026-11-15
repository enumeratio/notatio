---
name: IncomparableTripleCount
domain: Poset statistics
signature: IncomparableTripleCount(poset)
summary: The sets of three elements, no two of them comparable.
catalog:
  - system: findstat
    identity: St001396
    url: https://www.findstat.org/St001396
    on: Poset
statOn:
  - Poset
signatures:
  - call: IncomparableTripleCount(poset)
    description: The sets of three elements, no two of them comparable.
    library: enumeratio-combinatorics
    type: (poset) -> number
---

- Defined over `Poset` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Poset` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001396. The poset with no elements gives 0.
