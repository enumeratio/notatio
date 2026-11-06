---
name: EarlyCloserPairCount
domain: Perfect matching statistics
signature: EarlyCloserPairCount(matching)
summary: Pairs whose larger point is at most n + 1, for a matching of 2n points.
catalog:
  - system: findstat
    identity: St001044
    url: https://www.findstat.org/St001044
    on: PerfectMatching
statOn:
  - PerfectMatching
signatures:
  - call: EarlyCloserPairCount(partition)
    description: Pairs whose larger point is at most n + 1, for a matching of 2n points.
    library: enumeratio-combinatorics
    type: (perfect_matching) -> number
---

- Defined over `PerfectMatching` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `PerfectMatching` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
