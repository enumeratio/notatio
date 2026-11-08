---
name: RestrictedGrowthThreeOneTwoCount
domain: Perfect matching statistics
signature: RestrictedGrowthThreeOneTwoCount(matching)
summary: The triples i < j < k of points whose letters in the restricted growth word are in the order 3 1 2.
catalog:
  - system: findstat
    identity: St001837
    url: https://www.findstat.org/St001837
    on: PerfectMatching
statOn:
  - PerfectMatching
signatures:
  - call: RestrictedGrowthThreeOneTwoCount(matching)
    description: The triples i < j < k of points whose letters in the restricted growth word are in the order 3 1 2.
    library: enumeratio-combinatorics
    type: (perfect_matching) -> number
---

- Defined over `PerfectMatching` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `PerfectMatching` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001837.
