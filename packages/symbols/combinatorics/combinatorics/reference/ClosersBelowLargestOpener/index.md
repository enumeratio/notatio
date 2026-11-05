---
name: ClosersBelowLargestOpener
domain: Set partition statistics
signature: ClosersBelowLargestOpener(partition)
summary: The pairs whose larger point is below the largest opener, the larger point of the pair opening last.
catalog:
  - system: findstat
    identity: St000840
    url: https://www.findstat.org/St000840
    on: PerfectMatching
statOn:
  - PerfectMatching
signatures:
  - call: ClosersBelowLargestOpener(partition)
    description: The pairs whose larger point is below the largest opener, the larger point of the pair opening last.
    library: enumeratio-combinatorics
    type: (perfect_matching) -> number
---

- Defined over `PerfectMatching` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `PerfectMatching` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000840. Every other opener is below the largest, so the closers below it number the largest opener less the pairs.
