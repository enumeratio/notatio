---
name: UnicellularMapVertexCount
domain: Perfect matching statistics
signature: UnicellularMapVertexCount(matching)
summary: The cycles of the matching, as a fixed-point-free involution, followed by the long cycle 1 -> 2 -> ... -> 2n -> 1.
catalog:
  - system: findstat
    identity: St000044
    url: https://www.findstat.org/St000044
    on: PerfectMatching
statOn:
  - PerfectMatching
signatures:
  - call: UnicellularMapVertexCount(matching)
    description: The cycles of the matching, as a fixed-point-free involution, followed by the long cycle 1 -> 2 -> ... -> 2n -> 1.
    library: enumeratio-combinatorics
    type: (perfect_matching) -> number
---

- Defined over `PerfectMatching` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `PerfectMatching` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000044, the vertices of the unicellular map the matching gives.
