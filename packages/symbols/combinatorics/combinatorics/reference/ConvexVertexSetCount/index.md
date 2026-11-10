---
name: ConvexVertexSetCount
domain: Graph statistics
signature: ConvexVertexSetCount(graph)
summary: The sets of vertices that hold every vertex on a shortest path between two of their members.
signatures:
  - call: ConvexVertexSetCount(graph)
    description: The sets of vertices that hold every vertex on a shortest path between two of their members.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
catalog:
  - system: findstat
    identity: St001762
    url: https://www.findstat.org/St001762
    on: LabeledGraph
statOn:
  - LabeledGraph
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001762. Vertices with no path between them have no shortest path. The graph with no vertices has the empty set, so 1.
