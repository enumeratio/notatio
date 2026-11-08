---
name: ArcDiagramComponentCount
domain: Perfect matching statistics
signature: ArcDiagramComponentCount(matching)
summary: The points i such that the points 1 .. i are matched among themselves.
catalog:
  - system: findstat
    identity: St000843
    url: https://www.findstat.org/St000843
    on: PerfectMatching
statOn:
  - PerfectMatching
signatures:
  - call: ArcDiagramComponentCount(matching)
    description: The points i such that the points 1 .. i are matched among themselves.
    library: enumeratio-combinatorics
    type: (perfect_matching) -> number
---

- Defined over `PerfectMatching` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `PerfectMatching` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000843, the decomposition number: the components of the arc diagram, cut at each point no pair spans.
