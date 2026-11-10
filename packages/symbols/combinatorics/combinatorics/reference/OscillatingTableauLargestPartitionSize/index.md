---
name: OscillatingTableauLargestPartitionSize
domain: Perfect matching statistics
signature: OscillatingTableauLargestPartitionSize(matching)
summary: "The most pairs a cut between two points separates: the largest number of pairs with one point on each side."
catalog:
  - system: findstat
    identity: St000720
    url: https://www.findstat.org/St000720
    on: PerfectMatching
statOn:
  - PerfectMatching
---

- Defined over `PerfectMatching` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `PerfectMatching` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000720. The oscillating tableau of Sundaram's map has the pairs open after a point as its partition, so its largest partition is the most pairs open at a cut.
