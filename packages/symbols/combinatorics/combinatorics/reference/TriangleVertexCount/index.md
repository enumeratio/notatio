---
name: TriangleVertexCount
domain: Graph statistics
signature: TriangleVertexCount(graph)
summary: The vertices on a triangle.
signatures:
  - call: TriangleVertexCount(graph)
    description: The vertices on a triangle.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
catalog:
  - system: findstat
    identity: St001995
    url: https://www.findstat.org/St001995
    on: LabeledGraph
statOn:
  - LabeledGraph
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001995. A vertex lies on a triangle when it is adjacent to both ends of some edge. The graph with no vertices gives 0.
