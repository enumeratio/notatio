---
name: TriangleFreeEdgeDeletionNumber
domain: Graph statistics
signature: TriangleFreeEdgeDeletionNumber(graph)
summary: The fewest edges whose deletion leaves a graph with no triangle.
catalog:
  - system: findstat
    identity: St001573
    url: https://www.findstat.org/St001573
    on: LabeledGraph
statOn:
  - LabeledGraph
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001573: the edges less the most edges of a set with no triangle. A triangle is three vertices a < b < c whose three edges are all in the set. The graph with no vertices gives 0.
