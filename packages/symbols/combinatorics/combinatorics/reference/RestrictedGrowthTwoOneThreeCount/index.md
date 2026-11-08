---
name: RestrictedGrowthTwoOneThreeCount
domain: Perfect matching statistics
signature: RestrictedGrowthTwoOneThreeCount(matching)
summary: The triples i < j < k of points whose letters in the restricted growth word are in the order 2 1 3.
catalog:
  - system: findstat
    identity: St001836
    url: https://www.findstat.org/St001836
    on: PerfectMatching
statOn:
  - PerfectMatching
signatures:
  - call: RestrictedGrowthTwoOneThreeCount(matching)
    description: The triples i < j < k of points whose letters in the restricted growth word are in the order 2 1 3.
    library: enumeratio-combinatorics
    type: (perfect_matching) -> number
---

- Defined over `PerfectMatching` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `PerfectMatching` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001836.
