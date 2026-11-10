---
name: OscillatingTableauWeight
domain: Perfect matching statistics
signature: OscillatingTableauWeight(matching)
summary: "The sum over the pairs of the larger point less the smaller: the pairs a cut separates, summed over the cuts."
catalog:
  - system: findstat
    identity: St000721
    url: https://www.findstat.org/St000721
    on: PerfectMatching
statOn:
  - PerfectMatching
---

- Defined over `PerfectMatching` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `PerfectMatching` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000721, the weight of the matching: the sizes of the oscillating tableau's partitions, the pairs open after each point, summed. A pair is open after each point from its smaller point up to the one before its larger.
