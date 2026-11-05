---
name: MaximalRightCrossingCount
domain: Set partition statistics
signature: MaximalRightCrossingCount(partition)
summary: "The most pairs (c, d) with a < c < b < d, over the pairs (a, b): arcs that cross a given arc at its right end."
catalog:
  - system: findstat
    identity: St001047
    url: https://www.findstat.org/St001047
    on: PerfectMatching
statOn:
  - PerfectMatching
signatures:
  - call: MaximalRightCrossingCount(partition)
    description: "The most pairs (c, d) with a < c < b < d, over the pairs (a, b): arcs that cross a given arc at its right end."
    library: enumeratio-combinatorics
    type: (perfect_matching) -> number
---

- Defined over `PerfectMatching` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `PerfectMatching` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001047 counts these, though its title says arcs crossing a given arc: its code sweeps the closers and counts the arcs opened inside and still open, which leaves out the arcs crossing at the left end.
