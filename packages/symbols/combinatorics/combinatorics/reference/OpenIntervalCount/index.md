---
name: OpenIntervalCount
domain: Poset statistics
signature: OpenIntervalCount(poset)
summary: The pairs x < y with an element strictly between them.
catalog:
  - system: findstat
    identity: St001718
    url: https://www.findstat.org/St001718
    on: Poset
statOn:
  - Poset
signatures:
  - call: OpenIntervalCount(poset)
    description: The pairs x < y with an element strictly between them.
    library: enumeratio-combinatorics
    type: (poset) -> number
---

- Defined over `Poset` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Poset` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001718. The poset with no elements gives 0.
