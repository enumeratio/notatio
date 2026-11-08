---
name: RestrictedGrowthTwoThreeOneCount
domain: Perfect matching statistics
signature: RestrictedGrowthTwoThreeOneCount(matching)
summary: The triples i < j < k of points whose letters in the restricted growth word are in the order 2 3 1.
catalog:
  - system: findstat
    identity: St001835
    url: https://www.findstat.org/St001835
    on: PerfectMatching
statOn:
  - PerfectMatching
signatures:
  - call: RestrictedGrowthTwoThreeOneCount(matching)
    description: The triples i < j < k of points whose letters in the restricted growth word are in the order 2 3 1.
    library: enumeratio-combinatorics
    type: (perfect_matching) -> number
---

- Defined over `PerfectMatching` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `PerfectMatching` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001835. The restricted growth word has for each point the number of its pair among the pairs by smaller point.
