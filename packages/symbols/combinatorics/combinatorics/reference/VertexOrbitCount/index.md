---
name: VertexOrbitCount
domain: Graph statistics
signature: VertexOrbitCount(graph)
summary: The vertices that no automorphism sends to a smaller vertex.
catalog:
  - system: findstat
    identity: St000388
    url: https://www.findstat.org/St000388
    on: LabeledGraph
statOn:
  - LabeledGraph
signatures:
  - call: VertexOrbitCount(graph)
    description: The vertices that no automorphism sends to a smaller vertex.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000388: one vertex for each orbit of the automorphism group, its least. The graph with no vertices gives 0, a convention and not a FindStat row.
