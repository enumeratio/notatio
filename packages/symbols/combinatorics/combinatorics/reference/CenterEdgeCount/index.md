---
name: CenterEdgeCount
domain: Graph statistics
signature: CenterEdgeCount(graph)
summary: The edges with both ends in the center.
catalog:
  - system: findstat
    identity: St001341
    url: https://www.findstat.org/St001341
    on: LabeledGraph
statOn:
  - LabeledGraph
signatures:
  - call: CenterEdgeCount(graph)
    description: The edges with both ends in the center.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001341. In a disconnected graph every vertex is central, as for CenterVertexCount. The graph with no vertices gives 0.
