---
name: GraphEdgeConnectivity
domain: Graph statistics
signature: GraphEdgeConnectivity(graph)
summary: "The fewest edges whose deletion leaves a disconnected graph: the fewest edges between a set of vertices and the rest."
catalog:
  - system: findstat
    identity: St000261
    url: https://www.findstat.org/St000261
    on: LabeledGraph
statOn:
  - LabeledGraph
signatures:
  - call: GraphEdgeConnectivity(graph)
    description: "The fewest edges whose deletion leaves a disconnected graph: the fewest edges between a set of vertices and the rest."
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000261. A disconnected graph gives 0, and so does the graph with one vertex. The graph with no vertices gives 0.
