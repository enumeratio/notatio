---
name: IncomparablePairCount
domain: Poset statistics
signature: IncomparablePairCount(poset)
summary: The pairs of elements, neither below the other.
catalog:
  - system: findstat
    identity: St001397
    url: https://www.findstat.org/St001397
    on: Poset
statOn:
  - Poset
signatures:
  - call: IncomparablePairCount(poset)
    description: The pairs of elements, neither below the other.
    library: enumeratio-combinatorics
    type: (poset) -> number
---

- Defined over `Poset` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Poset` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001397. The poset with no elements gives 0.
