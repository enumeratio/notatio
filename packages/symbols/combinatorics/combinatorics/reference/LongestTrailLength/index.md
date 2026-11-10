---
name: LongestTrailLength
domain: Graph statistics
signature: LongestTrailLength(graph)
summary: "The most edges in a trail: a set of edges that is connected and has at most two vertices of odd degree."
catalog:
  - system: findstat
    identity: St001649
    url: https://www.findstat.org/St001649
    on: LabeledGraph
statOn:
  - LabeledGraph
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001649: a connected set of edges has an Euler trail when at most two vertices have odd degree. The graph with no vertices gives 0.
