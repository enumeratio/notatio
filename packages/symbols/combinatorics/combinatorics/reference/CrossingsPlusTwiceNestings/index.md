---
name: CrossingsPlusTwiceNestings
domain: Set partition statistics
signature: CrossingsPlusTwiceNestings(partition)
summary: The crossings plus twice the nestings.
catalog:
  - system: findstat
    identity: St000043
    url: https://www.findstat.org/St000043
    on: PerfectMatching
statOn:
  - PerfectMatching
signatures:
  - call: CrossingsPlusTwiceNestings(partition)
    description: The crossings plus twice the nestings.
    library: enumeratio-combinatorics
    type: (perfect_matching) -> number
---

- Defined over `PerfectMatching` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `PerfectMatching` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000043. For a pair opening before another, the other opens inside it when it crosses or nests, and closes inside it when it nests, so 1 for the first and 2 for both.
