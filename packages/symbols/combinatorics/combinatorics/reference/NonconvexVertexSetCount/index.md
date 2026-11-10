---
name: NonconvexVertexSetCount
domain: Graph statistics
signature: NonconvexVertexSetCount(graph)
summary: The sets of vertices that miss a vertex on a shortest path between two of their members.
signatures:
  - call: NonconvexVertexSetCount(graph)
    description: The sets of vertices that miss a vertex on a shortest path between two of their members.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
catalog:
  - system: findstat
    identity: St001764
    url: https://www.findstat.org/St001764
    on: LabeledGraph
statOn:
  - LabeledGraph
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001764. The graph with no vertices gives 0.
