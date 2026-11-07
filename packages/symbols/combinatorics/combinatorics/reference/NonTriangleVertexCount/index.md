---
name: NonTriangleVertexCount
domain: Graph statistics
signature: NonTriangleVertexCount(graph)
summary: The vertices on no triangle.
catalog:
  - system: findstat
    identity: St001996
    url: https://www.findstat.org/St001996
    on: LabeledGraph
statOn:
  - LabeledGraph
signatures:
  - call: NonTriangleVertexCount(graph)
    description: The vertices on no triangle.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001996. The graph with no vertices gives 0.
