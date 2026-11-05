---
name: MaximalNestingCount
domain: Set partition statistics
signature: MaximalNestingCount(partition)
summary: "The most pairs that nest one pair: the largest number of pairs (a, b) with a < c and d < b, over the pairs (c, d)."
catalog:
  - system: findstat
    identity: St001046
    url: https://www.findstat.org/St001046
    on: PerfectMatching
statOn:
  - PerfectMatching
signatures:
  - call: MaximalNestingCount(partition)
    description: "The most pairs that nest one pair: the largest number of pairs (a, b) with a < c and d < b, over the pairs (c, d)."
    library: enumeratio-combinatorics
    type: (perfect_matching) -> number
---

- Defined over `PerfectMatching` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `PerfectMatching` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001046.
